---
title: Validation
---

# Validation {#validation}

import CodeBlock from '@theme/CodeBlock';
import declarationResultsSource from '!!raw-loader!../../examples/declaration-validator-results.example.ts';
import selfReferenceInferenceSource from '!!raw-loader!../../examples/self-reference-inference.typecheck.ts';
import whenSelfReferenceSource from '!!raw-loader!../../examples/when-self-reference.example.ts';
import stringValidationSource from '!!raw-loader!../../examples/string-validation.example.ts';
import invalidValidationResultsSource from '!!raw-loader!../../examples/invalid-validation-results.example.ts';
import validatorResolutionSource from '!!raw-loader!../../examples/validator-resolution.example.ts';
import selfReferencingHelpersSource from '!!raw-loader!../../examples/self-referencing-validation-helpers.typecheck.ts';
import selfReferencingValidationSource from '!!raw-loader!../../examples/self-referencing-validation.example.ts';

The [executable validation example](../examples/executable-examples.mdx#validation-ownership) checks
field and form error ownership through both failing and valid states.

Pass validators in a node's options or as the positional validator argument:

```ts
import { field, minLength, required } from '@ngblocks/form-nodes';

const myForm = form({
  name: field('', {
    validators: [required, minLength(2)],
  }),
  alias: field('', [required]),
});
```

Validators may be a single validator or an array. `null` and `undefined` array entries are ignored.
The `validators()` signal returns the normalized list of directly registered functions. It does not
execute those functions or expand returned compositions by default.

## Validator arguments and return values {#validator-results}

The same [`ValidatorSource<TValue, TNode>`](../reference/types/validator-source.md) contract applies to these inputs:

| Primitive | Positional validators | Options |
| --- | --- | --- |
| [`field()`](../reference/field.md) | `field(initialValue, validators, options?)` | `field(initialValue, { validators })` |
| [`form()`](../reference/form.md) | `form(definition, validators, options?)` | `form(definition, { validators })` |
| [`group()`](../reference/group.md) | `group(definition, validators, options?)` | `group(definition, { validators })` |
| [`array()`](../reference/array.md) | `array(template, validators, options?)` or `array(template, initialValue, validators, options?)` | `array(template, { initialValue, validators })` |

The argument itself accepts one callback or a readonly list of callbacks, including registered
[`asyncValidator()`](../reference/async-validator.md) functions. Nullish list entries are ignored. `setValidators()` accepts this
same source. This also applies to strict/nullable fields and configured primitives.

A synchronous callback receives a typed [`ValidatorContext<TValue, ValidatorApi<TValue>, TNode>`](../reference/types/validator-context.md).
Its supported result contract is [`ComposableValidationResult<TValue, TNode>`](../reference/types/composable-validation-result.md):

| Returned value | Meaning |
| --- | --- |
| `null`, `undefined`, or implicit fallthrough (`void`) | No errors |
| `string`, including `''` | An error with `kind: 'custom'` and that message |
| [`ValidatorError`](../reference/types/validator-error.md) | An error with `kind: string \| number`, optional `message: string`, and optional `targetNode` |
| A readonly array of message strings and error objects | Several errors in order; an empty array succeeds |
| A synchronous validator | Evaluate that validator using the same context |
| A readonly array of synchronous validators and nullish entries | Evaluate those validators using the same context |

[`ValidationResult`](../reference/types/validation-result.md) describes the first four rows; `ComposableValidationResult<TValue, TNode>`
also includes the composition rows. Returned arrays must not mix validators and errors.
A bare number or boolean is not an error result. A raw Promise or Observable is not a synchronous
result: register `asyncValidator()` to handle asynchronous work and its lifecycle.

:::info Typed context, flexible declaration return

**Declaration callbacks have an `any` return type in TypeScript** to allow reads from their own
initializing form or group. The context, sibling fields, node methods, and model values remain typed.
`any` does not make other runtime results valid, and it means malformed returns may compile.

For explicit result checking, annotate the callback with `: ValidationResult`, or with
`: ComposableValidationResult<TValue, TNode>` when composing validators. The context-taking
[`validator()`](../reference/validator.md) helper also checks results. For returned inline validators, wrapping the outer
callback in `validator()` restores their contextual parameter types. A checked self-referencing
callback may still need the return annotation to break TypeScript's inference cycle.

:::

<CodeBlock language="ts" title="declaration-validator-results.ts">{declarationResultsSource}</CodeBlock>

### Numeric error identifiers

An input error such as `{ kind: 123, message: 'Missing' }` becomes an exposed error with
`kind: '123'`. Use `getError('123')` and `hasError('123')`; public error kinds remain strings.
The conversion uses JavaScript `String(kind)`, including `0`, negative/decimal numbers, `NaN`,
and infinities. Numeric errors are shallow-copied with their enumerable data, message, and target;
the original numeric object is not mutated. Existing string-kind errors retain their identity.
This normalization also applies to asynchronous validation results.

## ✅ Reading validation state {#reading-validation-state}

```ts
name.valid();
name.invalid();
name.pending();
name.validationStatus(); // 'valid', 'invalid', or 'unknown'
name.errors();
name.getError('minLength');
```

`errors()` contains errors owned directly by the current node. `allErrors()` includes the complete descendant subtree, which matters for forms and arrays:

```ts
profile.errors(); // profile-level errors only
profile.allErrors(); // profile and descendant errors
```

Every exposed error contains `kind` and `targetNode`; built-in errors also contain a default or configured `message` and constraint-specific data. `getError()` infers known built-in error data from its kind.

See [Errors and validation status](./errors-and-status.md) for ownership, aggregate ordering, typed custom kinds, binding errors, and the exact status table.

Built-in validators can replace their normal structured error through `error`. The option accepts
one error, several errors, or a reactive function receiving the validator context:

```ts
const age = field(16, [
  min(18, { error: ({ value }) => ({ kind: 'minimumAge', actual: value(), minimum: 18 }) })
]);
```

The replacement is evaluated only while the built-in rule fails. It cannot be combined with
`message`; return an empty array, `null`, or `undefined` when the failed rule should currently
contribute no error. See [Built-in validator custom errors](../reference/built-in-validators.md#custom-errors).

## ✅ Custom validators {#custom-validators}

A synchronous validator receives a stable context with its value signal and access to the validated node:

```ts
import { field, validator } from '@ngblocks/form-nodes';

const adult = validator<number | null>(({ value }) => {
  const age = value();

  return age !== null && age < 18
    ? { kind: 'adult', minimumAge: 18, actual: age, message: 'You must be 18 or older.' }
    : null;
});

const age = field<number>(null, [adult]);
```

Return `null`, `undefined`, or nothing for success; return one error or an array of errors for failure. `validator()` only provides a typed reusable authoring context—it does not add runtime behavior.

Validators can inspect `value`, `node`, `field`, `parent`, and `path`. Read state through the node,
such as `ctx.node().touched()` or `ctx.field().dirty()`. These reads become reactive dependencies,
as do external constraints:

```ts
const minimumAge = signal(18);

const age = field<number>(null, [({ value }) => {
  const actual = value();
  return actual !== null && actual < minimumAge()
    ? { kind: 'minimumAge', actual, min: minimumAge() }
    : null;
}]);
```

## ✅ Form and cross-field validation {#form-and-cross-field-validation}

Attach a validator to a form to validate its aggregated value:

```ts
const passwords = form({
  password: field(''),
  confirmation: field(''),
}, {
  validators: [({ value }) => value().password === value().confirmation
    ? null
    : { kind: 'passwordMismatch', message: 'Passwords must match.' }],
});
```

For a field-level confirmation rule, `equalTo()` accepts a reactive source:

```ts
const password = field('');
const myForm = form({
  password,
  confirmation: field('', [equalTo(() => password())]),
});
```

## 🔗 Referencing the form from its own validators {#self-referencing-validators}

A validator declared on a class property can read `this.myForm`, including sibling fields,
without a return annotation or an explicit form type. Block and expression callbacks may return
errors directly, a validator, or an array of synchronous validators. Both positional validators and the
`validators` option support this pattern, including strict fields and configured primitives.
Editors also suggest configuration keys when you start an options object such as `field('', {})`.

This signup form checks that both passwords match. Changing the password revalidates its
confirmation. Keep the sibling read inside the callback so it runs after `myForm` is assigned.

<CodeBlock language="ts" title="self-referencing-validation.example.ts">{selfReferencingValidationSource}</CodeBlock>

The same syntax works inside `validator()` and the callback signature of `asyncValidator()`:

<CodeBlock language="ts" title="self-referencing-validation-helpers.typecheck.ts">{selfReferencingHelpersSource}</CodeBlock>

Declaration callbacks have an intentionally unchecked return type, with or without a context.
Inside the helpers, parameterless callbacks are unchecked and context-taking callbacks retain
checked context and result types. The
runtime contract still applies: synchronous callbacks return errors, successful results, or
synchronous validators; asynchronous callbacks return Promise-like or Observable-like results.
An asynchronous callback must return the validation result, not merely test whether a validator
function exists.

Mixing synchronous and asynchronous rules is safe during class initialization. Initial asynchronous
setup waits until construction finishes, or until you read validation state. Synchronous errors
prevent asynchronous execution, including unconditional errors such as `() => ({ kind: '' })`.

This exception includes overloaded functions callable without arguments. For example,
`uniqueItems()` returns a validator whose array-value compatibility is checked, while passing
`uniqueItems` directly can match the unchecked parameterless branch. A deferred callback's
returned validator is likewise not checked against the consuming field's value type.

## 💬 Returning messages {#returning-messages}

Return a string for a simple error message. Form Nodes converts it to
`{ kind: 'custom', message }`, so error queries keep their usual object shape.

<CodeBlock language="ts" title="string-validation.example.ts">{stringValidationSource}</CodeBlock>

This works in inline validators, `validator()`, asynchronous validators, and `onError`.
Arrays can mix message strings and error objects; order and duplicate kinds are preserved.
`getError('custom')` returns the first matching error. Return an object with a specific `kind`
when you need to identify a particular rule or target another node.

Every string, including `''` and whitespace-only messages, represents an error. Messages are
preserved exactly; return `null` or `undefined` for success.

## 🛡️ Malformed validator results {#malformed-validator-results}

Error objects need a readable string or numeric `kind`; an empty string is allowed and numeric kinds become strings. Malformed objects,
non-string primitives, and returned form nodes are ignored with a warning in Angular development mode.
`null` and `undefined` remain silent success results.
Arrays retain valid errors and discard invalid entries. This applies to synchronous results,
resolved asynchronous results, and asynchronous `onError` results.

<CodeBlock language="ts" title="invalid-validation-results.example.ts">{invalidValidationResultsSource}</CodeBlock>

Ignored results do not block the form. The warning identifies a mistake in the validator, not
an error in the user's input. Nodes returned accidentally, such as `ctx.parent()`, are ignored
without being called as composed validators. Exceptions thrown by your callback and the existing
composition guards still follow their normal error handling.

## ✅ Conditional validators {#conditional-validators}

A validator may return another synchronous validator or an array of validators. This supports reactive conditions without rebuilding the node:

```ts
const requireName = signal(false);

const myForm = form({
  name: field('', {
    validators: [() => requireName() ? [required, minLength(2)] : null],
  }),
});
```

Use `setValidators()` when the configured validator collection itself must be replaced.

Returned validators can be nested and all receive the same stable context. Signals read by the
outer condition or any returned validator remain reactive dependencies. A returned array must
contain validators or validation errors after nullish entries are removed; mixing both is rejected
as ambiguous.

Configure `asyncValidator()` directly in the node's validator list. It cannot be returned from a
synchronous validator because the node must establish its cancellation and ownership lifecycle
without executing arbitrary synchronous callbacks.

## 🧩 Evaluation model {#evaluation-model}

Synchronous validation is lazy. Signal changes invalidate its result, and validators rerun when
`errors()`, `valid()`, `invalid()`, or `validationStatus()` is next consumed. Templates and other
reactive consumers observe that recomputation automatically.

The context and its signal properties remain stable between executions. Reading application
signals directly inside the callback is sufficient; an extra `computed()` wrapper is unnecessary.

See [Advanced behavior and edge cases](../advanced/behavior-details.md#reactive-validation-execution)
for composition limits, execution timing, and async dependency details.

## ✅ Constraint metadata {#constraint-metadata}

Built-in constraints expose metadata for UI bindings:

```ts
age.min();
age.max();
name.minLength();
name.maxLength();
name.pattern();
name.required();
```

[`[formNode]`](../reference/form-node-binding.md) forwards applicable metadata to native and compatible custom controls.

See [Built-in validators](../reference/built-in-validators.md) and [Validator messages](./validator-messages.md).
For reusable helpers, context types, result shapes, and conditional composition, see the
[`validator()` reference](../reference/validator.md).

## ✅ Inspect resolved validators {#inspect-resolved-validators}

Use `validators({ resolve: true })` to inspect the final function references reached through
synchronous compositions. Use `hasValidator(validator, { resolve: true })` to query the same list.
Omitting the options, or passing `{ resolve: false }`, keeps the directly registered list.
`validators` remains an Angular `Signal` whose ordinary call returns that registered list.

<CodeBlock language="ts">{validatorResolutionSource}</CodeBlock>

Resolution follows returned functions and arrays of functions recursively, preserving declaration
order and duplicates. A composing function is replaced by the leaves it returns. A function
returning errors, `null`, `undefined`, or an empty array is itself a leaf and remains in the list,
even when successful or conditionally skipped. This API describes resolved references, not which
constraints are active; for example, use `required()` for active required metadata.

Resolution cannot discover calls hidden inside a wrapper. `() => required` exposes `required`,
whereas `context => required(context)` exposes only the wrapper. Factory-created validators still
compare by reference: retain the returned function when you need to query it later.

Resolving executes synchronous validator functions with the node's normal validation context.
Queries and synchronous validation share a cached evaluation, including errors and metadata, so
reading both does not duplicate executions for unchanged dependencies. Signals read during that
evaluation participate in tracking. Resolved queries can therefore surface the same exceptions as
validation, including invalid or circular compositions.

An explicit resolved query also evaluates a disabled, hidden, or readonly node on demand. It does
not enable validation for that node: its reported errors, validity, and interaction state retain
the normal suppression rules. Ordinary queries do not execute validators. Directly registered
async validators remain references in the resolved list; inspection does not start or restart their
async work. Returning an async validator from a synchronous composition remains unsupported.
Neither mode searches descendants or validators belonging to external controls.

## Self-referencing `when` conditions

Built-in validators and `asyncValidator` accept parameterless `when` callbacks referencing the
form being declared, including through computed signals declared later in the class. The form and
computed retain their inferred types without return annotations.

<CodeBlock language="ts" title="profile-model.ts">{whenSelfReferenceSource}</CodeBlock>

Parameterless conditions intentionally have unchecked return types; always return a boolean.
Callbacks receiving a context, such as `when: ({ value }) => value() !== null`, keep a typed context
and a checked boolean result. This change applies to `when`; reactive bounds, dates, lists, and
message callbacks retain their existing signatures.

Async validators with `when` defer their initial automatic condition evaluation until the class
initializer finishes. Reading validation state or explicitly calling `validate()` can start that
work sooner; do so only after initialization. Disabling a condition cancels its pending work and
releases dependency tracking. Reenabling it starts a fresh execution even when the field value
has not changed. These rules apply inside and outside Angular injection contexts.

## Troubleshooting circular type inference {#circular-type-inference}

A class form can refer to a validator or condition that refers back to the same form. TypeScript
may then report **TS7022**, **TS7023**, or **TS7024**: a property or function implicitly has type
`any` because it is referenced directly or indirectly in its own initializer or return expression.
A common cycle is `form → condition callback → computed → form`. Moving the computed above the
form does not necessarily resolve a type-inference cycle.

### What the library handles

Inline declaration validators (with or without a context), parameterless callbacks passed to `validator()` and
`asyncValidator()`, `requiredIf` conditions, and parameterless `when` conditions support these
self-references without explicit return annotations. Their callback return types are intentionally
unchecked. The expected runtime result still applies: conditions should return booleans, synchronous
validators should return supported validation results, and async validators should return supported
Promise-like or Observable-like results. Context-taking helper callbacks retain their checked contracts.

A custom helper with its own strict callback signature can reintroduce the cycle. Reactive numeric
limits, date limits, allowed-value lists, and message callbacks also retain their existing checked
signatures; they are not covered by the parameterless-condition relaxation.

### Fix application code with an explicit result type

Prefer an accurate return annotation at one point in the cycle. For example:

- Annotate the computed callback: `computed((): boolean => ...)`.
- Annotate the condition: `requiredWhen((): boolean => ...)`.
- For a custom method, declare its actual result, such as `isTypeVisible(): boolean`.

Use the actual result type for other callbacks: a numeric constraint may return `number | undefined`,
a message may return `string | undefined`, and a synchronous custom validator can declare
`ValidationResult`. Such annotations provide a type boundary while keeping return-value checking.
Avoid annotating the entire form as `any`, since that discards useful child and value types.

### Context-taking validators that read their owning group

Direct declaration callbacks now support the sibling-reading ternary with either `null` or
`undefined`, without annotating the callback or group. The [result contract](#validator-results)
explains the typed context and deliberately unchecked return. A strict callback passed through
`validator()` or another checked helper can still encounter TS7022/TS7024; annotate its result
as `ValidationResult` in that case. Do not depend on changing a ternary into an `if` to control
inference: implicit fallthrough and explicit undefined have the same runtime outcome.

### Design a custom helper that permits unannotated consumers

If you own the helper and deliberately accept the same tradeoff as the library, declare its
parameterless callback parameter as `() => any`, and keep the helper's own return type precise.
This removes contextual return checking for the callback while preserving the type of the returned
validator. Merely wrapping the callback in `validator()` inside the helper does not change the
helper's public signature. `() => unknown` is not an equivalent fix for this inference cycle.

The following checked example compares both strict annotations and the permissive helper signature:

<CodeBlock language="ts" title="self-reference-inference.ts">{selfReferenceInferenceSource}</CodeBlock>

If you cannot change a helper, annotating just the callback as `(): any` is another localized
escape hatch, shown in the final class. Prefer `(): boolean` when the result is known: it breaks
the cycle while retaining return checking. An `as any` cast on the whole form would lose much more.

Here, `any` describes the callback's accepted return type; it is not a value to return. Document the
expected runtime result and the lost checking when publishing such a helper. A condition returning
a string can now compile, so the convenience has a real cost. Do not widen checked helper callbacks
or unrelated options unless their own use case requires a separately tested change.

### Distinguish inference errors from early execution

An error such as `this.isTypeVisible is not a function` at runtime has a different cause: something
called the condition before the class finished initializing. A type annotation cannot delay execution.
Pass the callback to the validation pipeline rather than invoking it while constructing a helper,
and avoid reading validation state or explicitly starting validation from unfinished initializers.
Automatic startup for async validators with `when` is deferred, but explicit reads can start it sooner.

Finally, `required` does not narrow a nullable field's TypeScript value type. Handle `null` explicitly
in comparisons, as the examples do with `?? 0`, or use `field.strict()` when null is not allowed.
