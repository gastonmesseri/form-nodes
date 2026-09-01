---
title: form()
---

# `form()`

`form()` creates a fixed, typed object tree from named fields, nested forms, and arrays. It is the
usual root primitive for application forms.

Not sure which node shape fits a value? See [Choosing a primitive](../guides/choosing-a-primitive.md).

```ts
import { array, field, form } from '@gem/ng-forms';

const myForm = form({
  name: field(''),
  address: {
    city: field(''),
    country: field(''),
  },
  tags: array(field('')),
});
```

## Signatures

```ts
form(definitions, options?);
form(definitions, validators, options?);
```

Nested object definitions are normalized to nested forms. Use an explicit `form()` when that
level needs validators, options, validator messages, or submission behavior.

```ts
const myForm = form({
  name: field(''),
  address: form({
    city: field(''),
    country: field(''),
  }, {
    disabled: () => !canEditAddress(),
  }),
});
```

## Options

| Option | Accepted value | Purpose |
| --- | --- | --- |
| `validators` | validator, validator array, or reactive source | Validates the complete object value |
| `injector` | Angular `Injector` | Owns asynchronous validation cleanup |
| `validatorMessages` | catalog or reactive catalog source | Overrides messages for this subtree |
| `debounce` | number, `'blur'`, or asynchronous function | Default control debounce inherited by descendants |
| `disabled` | boolean, string, or reactive function | Disables this form subtree |
| `readonly` | boolean or reactive function | Makes this form subtree readonly |
| `hidden` | boolean or reactive function | Hides this form subtree |
| `submission` | `{ action, onInvalid?, ignoreValidators? }` | Configures `submit()` |

Forms always have a non-null object value. To represent an optional object as a whole, use an
object-valued `field()` instead.

## Reading values and children

Calling the form returns its committed aggregate value. Named children are exposed directly and
retain their precise inferred types.

```ts
myForm(); // { name: '', address: { city: '', country: '' }, tags: [] }
myForm.name(); // ''
myForm.address.city(); // ''
myForm.children;          // stable readonly child map
```

Prefer direct child calls for individual values and `myForm()` for the complete object.
`controlValue()` exists for control integration and can differ while a descendant value is
debouncing.

## Setting and patching values

`set()` requires the complete shape. `patch()` recursively updates only supplied branches.
Neither operation marks the form dirty.

```ts
myForm.set({
  name: 'Ada',
  address: { city: 'London', country: 'UK' },
  tags: ['angular'],
});

myForm.patch({
  address: { city: 'Zurich' },
});

myForm.update(value => ({
  ...value,
  name: value.name?.trim() ?? null,
}));
```

`reset()` keeps the current value when called without arguments, clears interaction state
recursively, and cancels pending control debounce. `reset(value)` first applies a complete value.

## Validation and errors

Form validators receive the complete object value. Descendant failures affect aggregate validity,
but `errors()` contains only errors owned by the form itself; use `allErrors()` for the subtree.

```ts
const credentials = form({
  password: field(''),
  confirmation: field(''),
}, [({ value }) => value().password === value().confirmation
    ? null
    : { kind: 'passwordMismatch' }]);

credentials.errors();
credentials.allErrors();
credentials.getError('passwordMismatch');
```

See [Validation](../guides/validation.md), [Errors and status](../guides/errors-and-status.md), and
[Built-in validators](./built-in-validators.md).

## Submission

```ts
const profile = form({
  name: field(''),
  email: field(''),
}, {
  submission: {
    action: async (_form, value) => saveProfile(value),
    onInvalid: invalidForm => invalidForm.focus(),
  },
});

const submitted = await profile.submit();
```

Submission flushes pending control values, marks the tree touched, evaluates validation, and runs
the configured callback when allowed. `submitting()` remains true while an asynchronous action is
running. See [Submission](../guides/submission.md).

## Name collisions and generic code

Use form operations directly by default. The [Tree navigation and API access](../concepts/tree-and-api.md)
guide documents the exceptional cases where a child name collides with an operation or generic
infrastructure needs the uniform `.api` surface.
