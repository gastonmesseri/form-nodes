---
title: Validation
---

# Validation {#validation}

import CodeBlock from '@theme/CodeBlock';
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

Parameterless callbacks have an intentionally unchecked return type, both as direct sources and
inside these helpers. Context-taking callbacks retain checked context and result types. The
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

Error objects need a readable string `kind`; an empty string is allowed. Malformed objects,
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

`[formNode]` forwards applicable metadata to native and compatible custom controls.

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
