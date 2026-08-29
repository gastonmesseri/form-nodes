---
title: group()
description: Reference for fixed object groups without an independent submission workflow.
---

# `group()`

`group()` creates a fixed, typed object aggregate. It provides named children, value aggregation,
validation, state propagation, configuration, and the common node operations. It deliberately has
no `submission` option and no `submit()` method.

Plain nested objects in `form()`, `group()`, and object templates in `array()` are shorthand for
groups. Prefer shorthand until a branch needs its own options or validators.

A group can also be the root of a node tree. `form()` is not required when the model needs aggregate
structure and state but does not own a submission workflow.

```ts
import { field, form, group, required } from '@gem/ng-forms';

const myForm = form({
  displayName: field(''),
  address: group({
    city: field('', [required]),
    country: field(''),
  }, {
    disabled: () => !canEditAddress(),
  }),
});
```

## Signatures

```ts
group(definitions, options?);
group(definitions, validators, options?);
```

`GroupOptions` accepts `validators`, `injector`, `validatorMessages`, `debounce`, `disabled`,
`readonly`, and `hidden`. It does not accept `submission`.

## Value and children

The group is callable, and direct child access is preferred:

```ts
myForm.address();             // { city: '', country: '' }
myForm.address.city();        // ''
myForm.address.children.city; // the same field node, through the explicit child map
```

Groups always expose a non-null object value. Model an atomic or nullable object with `field()`
instead. Use `array()` when the structure has a dynamic number of independently addressable items.

## API

A group exposes the same structural API as `form()` except for submission:

| Area | Properties and methods |
| --- | --- |
| Values | `value()`, `controlValue()`, `set()`, `update()`, `patch()`, `reset()` |
| Tree | direct children, `children`, `form()`, `parent()`, `path()`, `keyInParent()` |
| Validation | `validators()`, `setValidators()`, `errors()`, `allErrors()`, `getError()`, `valid()`, `invalid()`, `pending()` |
| Interaction | `touched()`, `untouched()`, `markAsTouched()`, `markAsUntouched()`, `dirty()`, `pristine()`, `markAsDirty()`, `markAsPristine()` |
| Availability | `disabled()`, `disabledReasons()`, `enabled()`, `disable()`, `enable()`, `readonly()`, `writable()`, `markAsReadonly()`, `markAsWritable()`, `hidden()`, `visible()`, `hide()`, `show()` |
| Controls | `debouncing()`, `flush()`, `focus()` |
| Workflow context | `submitting()` reflects an ancestor form's active submission but cannot start one |

Child names take precedence over direct API members. Use `api` for explicit API access and `$api`
when a child named `api` creates a collision. See [Tree navigation and API access](../concepts/tree-and-api.md).

## Group or form?

Use `group()` for structure and `form()` for a submission boundary:

```ts
const checkout = form({
  shippingAddress: {
    city: field(''), // shorthand Group
  },
  payment: form({
    cardNumber: field(''),
  }, {
    submission: { action: savePayment },
  }),
}, {
  submission: { action: placeOrder },
});
```

A group may be bound to a native `<form [formNode]>` without breaking its controls. Native submit
is prevented and marks and flushes the group tree, while native reset delegates to `group.reset()`.
Because a group has no submission action, use `form()` when the element must execute application
submission behavior.

## Group or plain object?

A normal object containing standalone fields is also valid:

```ts
const filters = {
  query: field(''),
  category: field(''),
};
```

Use that minimal structure when the nodes are genuinely independent. Choose a root `group()` when
you need an aggregate callable value, parent and path relationships, recursive updates and reset,
aggregate validity and interaction state, inherited availability or debounce, or validators for the
complete object. The plain object itself has none of those node capabilities.
