# Self-referencing context validator inference

Investigated on September 10, 2026, using the repository's TypeScript 5.9.3 compiler.
This investigation informed the subsequent implementation: ValidatorSource now uses the narrow unchecked-return boundary described below. The experiment results document the pre-change baseline.

## Reproduction and cause

The following declaration needs to work without annotating either the group or callback:

```ts
const dates = group({
  end: field<string>(null),
  start: field<string>(null, ({ value }) => {
    const end = dates.end();
    return end && !value() ? { kind: 'missingStart' } : null;
  }),
});
```

Both the null and explicit-undefined ternaries produce TS7022/TS7024. An `if` returning the
error with implicit fallthrough compiles. Null and undefined remain equivalent successful
results in the Form Nodes runtime; the discrepancy is in declaration inference.

The compiler's `compareSignaturesRelated` skips source-return comparison when the target
return is exactly `any` or `void`. With other target returns it requests the source signature's
return type. That can require the initializing group's type before inference has completed.
`unknown` does not take this early-return path, despite accepting arbitrary results.

Reference: [TypeScript 5.9.3 checker](https://github.com/microsoft/TypeScript/blob/v5.9.3/src/compiler/checker.ts),
`compareSignaturesRelated`, `getReturnTypeFromBody`, and
`contextuallyCheckFunctionExpressionOrObjectLiteralMethod`.
Related compiler discussions include [context-sensitive inference](https://github.com/microsoft/TypeScript/issues/47599)
and [self-referencing initializers](https://github.com/microsoft/TypeScript/issues/22390).
These issues describe related limitations; they do not establish that no other encoding is possible.

## Experiments

Minimal compiler-API fixtures tested the exact self-reference, invalid number/error returns,
incorrect context-value assignments, and incorrect assignments from the resulting group.

| Callback/signature strategy | Exact example compiles | Rejects invalid callback results |
| --- | --- | --- |
| Checked result | No | Yes |
| `NoInfer<Result>` | No | Yes |
| `unknown` return | No | No |
| `object \| null \| undefined` return | No | Only primitive results |
| Checked/any intersection, either order | No | Yes |
| Checked/any function union | No | No |
| Bivariant method signature | No | Yes |
| Generic callback constrained to the result | No | Also rejects ordinary valid implementations |
| Additional result generic defaulting to the checked result | No | Yes |
| Additional result generic defaulting to `any` | Yes | No |
| Checked overload followed by an any fallback | No | No |
| Any overload first | Yes | No |
| `void` return | Yes | No |
| `any` return | Yes | No |

These successful cases retain the context value and resulting field types. The probes explicitly
reject assigning a string field value to a number; compilation alone was not treated as evidence
that inference survived. `void` is not a stronger result check: it also accepts arbitrary returns,
and communicates ignored values even though the validation runner consumes them.

## Tests against the actual library

A compiler-host prototype changed source text in memory, leaving repository implementation files
untouched, and ran the complete type-test program with the null/undefined return annotations removed.

1. Changing all `ComposableValidator` returns to `any` resolves the cycle but additionally removes
   existing checked-error guarantees in `validator()` and loses nested callback contextual typing.
2. Changing only `ValidatorSource` to use a shared, typed-context callback with an `any` return
   resolves the cycle while preserving checked context-taking `validator()` callbacks and existing
   public `Validator` and `ComposableValidator` contracts.
3. The same narrow prototype with `void` has the same observable type-checking tradeoff.

The narrow prototype was also checked with class properties, form siblings, validator arrays,
`options.validators`, exact `value()` and `node()` types, invalid field writes, and missing children.
Those checks passed. The full existing type suite produced two diagnostics at one nested-composition
example: the returned callback's parameter lost its contextual type and its type equality assertion
failed. This was recorded as a regression, not reported as a passing suite.

Wrapping that example's outer callback with `validator()` restored its nested contextual typing:

```ts
field('', [validator((context) => {
  return [(inner) => {
    // The actual prototype asserts string | null for inner.value().
    return null;
  }];
})]);
```

This wrapper retains a checked return contract; it does not automatically solve self-reference
inside that strict callback. Simple self-referencing consumers would use the declaration callback.

## Recommended design

Use a shared typed-context, unchecked-return callback at the `ValidatorSource` input boundary.
Keep `Validator`, `ComposableValidator`, and context-taking `validator()` authoring strict.
Do not change the node model, exposed value, error types, or runtime pipeline to `any`.

The explicit costs are that direct callbacks can return malformed errors or an unmarked Promise
without a compile-time diagnostic, and returned inline callbacks need a checked authoring context
such as the outer `validator()` wrapper. The current runtime already ignores malformed results and
warns in development; that is not equivalent to a compile-time guarantee or production rejection.

Before shipping, the change needs public type/JSDoc and website updates, replacement of the nested
composition example with a supported checked form, regression coverage for all declaration paths,
and normal package verification. No claim is made that the unmodified library already supports this.

## Runtime reference and verification

Angular `22.1.x`, commit `da8dac62a79025fa42ae3ee5c64e3e3f1979ce54`, was checked in Signal Forms
`api/rules/validation/validate.ts` and `test/node/api/validators/validation_errors.spec.ts`.
Its schema-path callback API is not the same initializer-inference problem. No runtime state or
validation scheduling change is needed for the proposed declaration adjustment.

The focused `field.spec.ts`, `form.spec.ts`, and `normalize-validation-result.spec.ts` run passed
512 tests. The signature experiments are compiler probes, not shipped behavioral changes.
