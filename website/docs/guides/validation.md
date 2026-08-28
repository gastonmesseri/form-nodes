---
title: Validation
---

# Validation

The [executable validation example](../examples/executable-examples.mdx#validation-ownership) checks
field and form error ownership through both failing and valid states.

Pass validators in a node's options or as the positional validator argument:

```ts
import { field, minLength, required } from '@gem/ng-forms';

const myForm = form({
  name: field('', {
    validators: [required, minLength(2)],
  }),
  alias: field('', [required]),
});
```

Validators may be a single validator or an array. `null` and `undefined` array entries are ignored.

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

## Custom validators

A synchronous validator receives a stable context containing the node's value and readonly state signals:

```ts
import { field, validator } from '@gem/ng-forms';

const adult = validator<number | null>(({ value }) => {
  const age = value();

  return age !== null && age < 18
    ? { kind: 'adult', minimumAge: 18, actual: age, message: 'You must be 18 or older.' }
    : null;
});

const age = field<number>(null, [adult]);
```

Return `null`, `undefined`, or nothing for success; return one error or an array of errors for failure. `validator()` only provides a typed reusable authoring context—it does not add runtime behavior.

Validators can inspect `value`, `field`, `api`, `form`, `parent`, `path`, and node-state signals. Signals read by a synchronous validator become dependencies, so external constraints are naturally reactive:

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
