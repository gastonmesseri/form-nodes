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

## Instance shape

A form node is both a callable value reader and an object whose named children take precedence over
API members:

| Member | Description |
| --- | --- |
| `myForm()` | Returns the current committed object value. This is the preferred complete-value read. |
| `myForm.child` | Direct access to a named child node with its precise inferred type. This is the preferred child access. |
| `children` | Stable readonly map containing every named child. Useful when code needs to be explicit or iterate generically. |
| `api` | Complete form API unless the form declares a child named `api`; that child takes precedence. |
| `$api` | Always exposes the complete form API, even when child names collide. Prefer direct members or `api` normally. |

When a child has the same name as an API member, the child remains available directly and the
operation remains available through `$api`:

```ts
const myForm = form({
  reset: field('Not the reset method'),
});

myForm.reset();      // 'Not the reset method'
myForm.$api.reset(); // resets the form
```

See [Tree navigation and API access](../concepts/tree-and-api.md) for collision and generic-code
patterns.

## Value and tree properties

Signals must be called to read their current values. `children` is the exception: it is a stable
readonly node map rather than a signal.

| Property | Description |
| --- | --- |
| `value()` | Current committed object value. Equivalent to calling the form, but the callable form is preferred. |
| `controlValue()` | Complete value received from a control bound directly to this form. Pending descendant control values are not aggregated into it. |
| `children` | Readonly map of named live child nodes. Direct child properties are preferred. |
| `form()` | Root form that owns this form, or this form itself when it is the root. |
| `parent()` | Direct parent node, or `null` at the root. |
| `path()` | Reactive property path from the root. Array indexes appear as string segments. |
| `keyInParent()` | Property name or array index under which this form is stored, or `null` at the root. |

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

## Value update methods

| Method | Description |
| --- | --- |
| `set(value)` | Assigns a complete value to every child. The supplied object must have the full form shape. |
| `update(updater)` | Passes the current plain value to `updater`, then assigns its complete result. |
| `patch(value)` | Recursively updates only the supplied child branches. It does not replace omitted values. |
| `reset()` | Keeps the current value and recursively clears interaction state. |
| `reset(value)` | Applies a complete value, then recursively clears interaction state. |

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

`reset()` keeps the current value, clears interaction state recursively, and cancels
pending control debounce. `reset(value)` first applies a complete value.

## Validation properties and methods

Form validators receive the complete object value. Descendant failures affect aggregate validity,
but `errors()` contains only errors owned by the form itself; use `allErrors()` for the subtree.

| Member | Description |
| --- | --- |
| `validators()` | Current normalized validator collection. |
| `setValidators(source)` | Replaces the validator source and re-evaluates validation. The source can be static or reactive. |
| `errors()` | Errors owned directly by this form; descendant errors are excluded. |
| `allErrors()` | Errors owned by this form and all descendants. Each error identifies its `targetNode`. |
| `getError(kind)` | Returns the first form-owned error with `kind`, or `undefined`. Known built-in kinds retain their inferred error type. |
| `valid()` | Whether this form and all descendants are valid. |
| `invalid()` | Whether this form or any descendant is invalid. |
| `pending()` | Whether asynchronous validation is pending in this form subtree. |
| `validationStatus()` | Current status: `'valid'`, `'invalid'`, or `'unknown'` while validation is pending without an existing error. |
| `required()` | Whether an active form validator marks the complete object as required. Forms remain non-nullable. |

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

## Interaction properties and methods

| Member | Description |
| --- | --- |
| `touched()` | Whether the form itself or any descendant is touched. |
| `untouched()` | Inverse of `touched()`. |
| `markAsTouched()` | Marks the form and its descendants as touched and flushes pending control values. |
| `markAsTouched({ skipDescendants: true })` | Marks only the form's own stored state as touched. |
| `markAsUntouched()` | Clears only the form's own stored touched state. Touched descendants can keep the aggregate form touched. |
| `dirty()` | Whether the form itself or any descendant is dirty. |
| `pristine()` | Inverse of `dirty()`. |
| `markAsDirty()` | Marks the form's own stored state as dirty. |
| `markAsPristine()` | Clears only the form's own stored dirty state. Dirty descendants can keep the aggregate form dirty. |

Programmatic value updates do not mark nodes dirty. `reset()` is the recursive operation for
clearing touched and dirty state throughout the tree.

## Availability properties and methods

| Member | Description |
| --- | --- |
| `disabled()` | Whether the form is disabled by its own state, configuration, or an ancestor. |
| `disabledReasons()` | Active local and inherited disabled causes, including source nodes and optional messages. |
| `enabled()` | Inverse of `disabled()`. |
| `disable(message?)` | Disables this form subtree and optionally records a user-facing reason. |
| `enable()` | Removes the imperative disabled state; configured or inherited causes can keep it disabled. |
| `readonly()` | Whether the form is readonly through its own state, configuration, or an ancestor. |
| `writable()` | Inverse of `readonly()`. |
| `markAsReadonly()` | Marks this form subtree as readonly. |
| `markAsWritable()` | Removes the imperative readonly state; other causes can keep it readonly. |
| `hidden()` | Whether the form is hidden through its own state, configuration, or an ancestor. |
| `visible()` | Inverse of `hidden()`. |
| `hide()` | Hides this form subtree. |
| `show()` | Removes the imperative hidden state; other causes can keep it hidden. |

## Control integration

| Member | Description |
| --- | --- |
| `debouncing()` | Whether this form or a descendant has a pending debounced control value. |
| `flush()` | Immediately commits every pending control value in the form subtree. |
| `focus(options?)` | Focuses the first bound control in the subtree, following DOM order. Accepts standard `FocusOptions`. |
| `submitting()` | Whether this form or an ancestor form is currently running a submission action. |

## Submission

| Member | Description |
| --- | --- |
| `submit()` | Flushes pending values by touching the tree, checks the configured validation policy, and runs `submission.action` when allowed. Resolves to `true` when the action runs successfully and `false` when submission is blocked or already running. It throws when no submission action is configured. |
| `submitting()` | Remains `true` while this form's asynchronous action runs and is inherited by descendants. |

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
