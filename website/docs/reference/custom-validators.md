---
title: Custom validators
---

# Custom validator reference

Attach a synchronous validator directly to a field, form, or array. The consuming node contextually
infers its value type:

```ts
const myForm = form({
  age: field<number>(null, [({ value }) => {
    const age = value();

    return age !== null && age < 18
      ? { kind: 'adult', minimumAge: 18, actual: age }
      : null;
  }]),
});
```

## `validator()`

Use `validator<TValue>()` when declaring a reusable validator separately from its consuming node:

```ts
import { field, form, validator } from '@gem/ng-forms';

export const adult = validator<number | null>(({ value }) => {
  const age = value();

  return age !== null && age < 18
    ? { kind: 'adult', minimumAge: 18, actual: age }
    : null;
});

const myForm = form({
  age: field<number>(null, [adult]),
});
```

The helper returns the original function. It adds typing, not a runtime wrapper, injection
requirement, eager execution, or different reactivity.

`TValue` must match the exact node value. Default fields normally include `null`; forms and arrays
use their non-null aggregate values. A validator declared as `validator<number>()` therefore fits a
field only when that field uses `{ nullable: false }`.

## Validator context

| Member | Description |
| --- | --- |
| `value()` | Current committed node value with its inferred type. |
| `field` | Real callable node being validated, including when it is a form or array. |
| `api` | Typed common API for validation, state, navigation, and node operations. |
| `form()` | Root aggregate that owns the node, or `null` for a standalone field. |
| `parent()` | Direct parent node, or `null` at the root. |
| `path()` | Reactive path from the root. |
| State signals | `touched`, `dirty`, `disabled`, `readonly`, `hidden`, `required`, `submitting`, and their complements. |

The context and its signals are stable. Any signal read while the validator executes becomes a
reactive dependency.

## Validation results

A synchronous validator may return:

| Result | Meaning |
| --- | --- |
| `null`, `undefined`, or `void` | Success |
| `{ kind, ...data }` | One validation error |
| `[{ kind, ... }, ...]` | Several errors, preserving their order |
| Another synchronous validator | Conditional composition |
| An array of synchronous validators | Conditional composition of several rules |

After nullish entries are removed, a returned array cannot mix validators and errors. Async
validators cannot be returned through this composition mechanism.

## Validator sources

Node options, positional validator arguments, and `setValidators()` accept one validator or a
readonly array. Nullish array entries are ignored:

```ts
myForm.age.setValidators([
  required,
  minimumAgeEnabled() ? min(18) : null,
]);
```

That boolean condition is evaluated when `setValidators()` runs. For a condition that follows a
signal over time, return validators from a reactive validator instead:

```ts
myForm.age.setValidators([
  () => minimumAgeEnabled() ? [required, min(18)] : null,
]);
```

`validators()` exposes the normalized readonly array. Replacing validators revalidates the current
value without changing dirty or touched state.

## Error ownership

Validators return errors without `targetNode`. Before exposure, the node assigns itself as the
target. `errors()` reads only errors owned by the current node; `allErrors()` additionally traverses
descendants.

```ts
const error = myForm.age.errors()[0];

error.kind;                       // 'adult'
error.targetNode === myForm.age; // true
```

Use `getError(kind)` for the first own error of a kind. Applications and reusable packages can
augment `ValidationErrorMap` so custom kinds expose strongly typed data. See
[Errors and validation status](../guides/errors-and-status.md#typed-lookup).

## Relevant public types

| Type | Purpose |
| --- | --- |
| `ValidationError` | Base `{ kind, message? }` error shape. |
| `ValidationResult` | Synchronous success, one error, or an error array. |
| `ValidatorContext<TValue>` | Complete synchronous callback context. |
| `Validator<TValue>` | Basic synchronous validation function. |
| `ComposableValidator<TValue>` | Validator that can return other validators conditionally. |
| `ValidatorSource<TValue>` | One validator or a readonly validator array with nullish entries. |
| `ValidationErrorMap` | Extensible registry used by typed `getError()`. |

See [Validation](../guides/validation.md), [Built-in validators](./built-in-validators.md), and
[`asyncValidator()`](./async-validator.md).
