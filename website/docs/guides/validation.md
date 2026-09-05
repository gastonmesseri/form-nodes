---
title: Validation
---

# Validation

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
The normalized `validators()` signal always returns only the effective validator functions.

## Reading validation state

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

## Custom validators

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

## Form and cross-field validation

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

## Conditional validators

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

## Evaluation model

Synchronous validation is lazy. Signal changes invalidate its result, and validators rerun when
`errors()`, `valid()`, `invalid()`, or `validationStatus()` is next consumed. Templates and other
reactive consumers observe that recomputation automatically.

The context and its signal properties remain stable between executions. Reading application
signals directly inside the callback is sufficient; an extra `computed()` wrapper is unnecessary.

See [Advanced behavior and edge cases](../advanced/behavior-details.md#reactive-validation-execution)
for composition limits, execution timing, and async dependency details.

## Constraint metadata

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
