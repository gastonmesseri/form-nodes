---
title: Choosing a primitive
---

# Choosing between field(), form(), array(), and group()

Choose a primitive from the shape and lifecycle of the value you need to model:

- Use `field()` for one replaceable value.
- Use `form()` for the typed object tree that owns a submission workflow.
- Use `array()` for a dynamic ordered collection of repeated nodes.
- Use explicit `group()` when an object boundary needs its own configuration without submission; ordinary nested objects use shorthand.

Most application forms combine several primitives rather than choosing only one.

The container itself is optional. Independent fields may live in a normal JavaScript object. Use a
root `group()` when they should form one aggregate tree without submission, and use `form()` when
that tree owns a submission workflow.

For broader domain and UI design decisions after choosing a primitive, continue with
[Form modeling patterns](./form-modeling-patterns.md).

```ts
import { array, field, form, group, uniqueItems } from 'form-nodes';

const myForm = form({
  name: field(''),
  address: {
    city: field(''),
    country: field(''),
  },
  contacts: array({
    type: field<'email' | 'phone'>('email'),
    value: field(''),
  }, 2),
});
```

## At a glance

| Question | `field()` | `form()` | `array()` | `group()` |
| --- | --- | --- | --- | --- |
| Value shape | Any single value | Non-null object | Non-null array | Non-null object |
| Structure | Leaf | Fixed workflow tree | Dynamic repeated items | Fixed named children |
| Submission | No | Own `submit()` action | Inherited state only | Inherited state only |
| Nullable by default | Yes | No | No | No |
| Typical use | Name, selection, optional object | Registration, checkout, subflow | Contacts, line items | Exceptional configured object boundary |

## Plain object, root group, or form?

All three declarations are valid, but they provide different capabilities:

```ts
const independentFields = {
  query: field(''),
  category: field(''),
};

const filters = group({
  query: field(''),
  category: field(''),
});

const searchForm = form({
  query: field(''),
  category: field(''),
}, {
  submission: { action: runSearch },
});
```

| Declaration | What it adds |
| --- | --- |
| Plain object | Organization only; every field remains an independent root node |
| Root `group()` | Aggregate value, tree navigation, propagation, validation, configuration, updates, and reset |
| `form()` | All group-like structural behavior plus an owned submission workflow |

Choose the smallest capability boundary that matches the UI. A root group is particularly useful
for reusable editors, filters, and settings sections that need aggregate state without submission.

## Use field() for one replaceable value

A field is a leaf even when its value happens to be an object or an array. Choose it when the
application treats the complete value as one unit and does not need independently addressable
children.

```ts
type Coordinates = {
  latitude: number;
  longitude: number;
};

const myForm = form({
  displayName: field(''),
  birthDate: field<Date>(),
  location: field<Coordinates>(),
});

myForm.location.set({ latitude: 47.3769, longitude: 8.5417 });
```

Here, `location` has one value, one validation state, and one interaction state. There is no
`myForm.location.latitude` node.

Use a field for an object when:

- a custom control edits the object as one value;
- replacing the whole object is the natural update;
- the object itself must be nullable; or
- individual properties do not need their own errors, touched state, or bindings.

## Use array() for repeated dynamic nodes

An array owns a variable number of nodes cloned from one template or factory.

```ts
const myForm = form({
  contacts: array({
    id: field(''),
    type: field<'email' | 'phone'>('email'),
    value: field(''),
  }, {
    initialValue: [
      { id: 'primary', type: 'email', value: 'ada@example.com' },
    ],
    trackBy: 'id',
  }),
});

myForm.contacts.push({
  id: 'mobile',
  type: 'phone',
  value: '+41 00 000 00 00',
});
```

Choose `array()` when users or application code can add, remove, or reorder items. Each item is an
independent node tree with its own path, validation, touched state, and dirty state.

If the collection has a fixed number of semantically named positions, a group is usually clearer:

```ts
const period = group({
  start: field<Date>(),
  end: field<Date>(),
});
```

If it has a variable number of equivalent positions, use an array:

```ts
const milestones = array(field<Date>(), {
  initialValue: [new Date()],
});
```

## Object field or group?

The same TypeScript value shape can represent different UI behavior.

```ts
type Address = {
  city: string;
  country: string;
};

const asOneValue = form({
  address: field<Address>(),
});

const asChildNodes = form({
  address: {
    city: field(''),
    country: field(''),
  },
});
```

`asOneValue.address` can be `null`, is normally bound to one object-valued custom control, and is
replaced as a unit. `asChildNodes.address` always has an object value and exposes separately
bindable `city` and `country` nodes.

Prefer the group for ordinary groups of HTML inputs. Prefer the object field when the UI and
domain genuinely treat the object atomically.

## Use form() for a workflow boundary

`form()` has the same object-node behavior as a group and additionally exposes `submission` and
`submit()`. Use it at the root of an application workflow. An explicit nested `form()` is useful
only when that branch is independently submittable; ordinary nested structure should remain a
group or shorthand object. Binding a group to a native `<form [formNode]>` is tolerated and retains
touch, flush, and reset behavior, but only a form can configure and run a submission action.

## Use explicit group() for an exceptional object boundary

Ordinary fixed child structures should use the object shorthand. It already creates a group node,
gives every property independent controls and state, and aggregates them into a typed object:

```ts
const myForm = form({
  address: {
    city: field(''),
    country: field(''),
  },
});
```

Use explicit `group({...}, options)` only when that object boundary itself needs validators, state
options, or validator messages without owning an independent submission workflow:

```ts
const filters = group({
  query: field(''),
  category: field(''),
}, {
  disabled: () => !canEditFilters(),
  validators: [({ value }) => {
    return value().query || value().category
      ? null
      : { kind: 'emptyFilters', message: 'Enter a query or choose a category.' };
  }],
});
```

Here the explicit boundary owns both its reactive disabled state and a validator that considers the
complete `{ query, category }` value. The object shorthand remains preferable when the boundary
does not need configuration of its own.

## Array field or array()?

An array value does **not** require `array()`. A normal field can hold an array—or any other
JavaScript value. Choose between them based on the controls and state the UI needs, not only on the
TypeScript value shape.

```ts
const myForm = form({
  selectedIds: field<string[]>([]),
  attendees: array({
    name: field(''),
  }, {
    initialValue: 2,
  }),
});
```

Use the field when one control owns the complete collection. A native multi-select is a common
example: the select reads and writes one `string[]` value, so no item nodes are needed.

```ts
import { Component } from '@angular/core';

import { field, form, FormNode } from 'form-nodes';

@Component({
  selector: 'app-role-picker',
  imports: [FormNode],
  template: `
    <label for="roles">Roles</label>
    <select id="roles" multiple [formNode]="myForm.selectedRoles">
      <option value="admin">Administrator</option>
      <option value="editor">Editor</option>
      <option value="viewer">Viewer</option>
    </select>

    <p>Selected roles: {{ (myForm.selectedRoles() ?? []).join(', ') }}</p>
  `,
})
export class RolePicker {
  myForm = form({
    selectedRoles: field<string[]>([]),
  });
}
```

`selectedRoles` is one leaf node with one touched, dirty, pending, and validation state. Update the
whole selection with `selectedRoles.set([...])`; it intentionally has no `push()`, `removeAt()`,
numeric child indexes, or per-role errors.

Use `array()` when every item needs its own node or the UI performs structural operations. An
`array()` gives each item an independent path, value, binding, validation state, touched state, and
dirty state, and exposes operations such as `push()`, `insert()`, `removeAt()`, and `move()`.

Unlike `field<string[]>()`, an `array()` value is never null. Passing `null` or `undefined` to its
complete-value operations clears it to `[]`.

## Where should validation live?

Place a validator on the smallest node that owns the rule:

- Field validator: one value, such as email syntax.
- Form validator: a relationship between named children, such as password confirmation.
- Array validator: the collection as a whole, such as uniqueness or minimum item count.

```ts
const registration = form({
  credentials: form({
    password: field(''),
    confirmation: field(''),
  }, [({ value }) => value().password === value().confirmation
      ? null
      : { kind: 'passwordMismatch' }]),
  aliases: array(field(''), {
    validators: [uniqueItems],
  }),
});
```

Errors remain owned by the node that runs the validator. Aggregate `valid()` includes descendant
failures; `errors()` does not. Use `allErrors()` when a summary needs the complete subtree.

## Quick decision sequence

1. Does the value need independently addressable child controls? If not, use `field()`.
2. Are heterogeneous children identified by meaningful names? Use `form()` or `group()`; dynamic
   names can be managed with `add()` and `remove()`.
3. Can equivalent ordered items be added, removed, or reordered? Use `array()`.
4. Is an object or collection edited by one custom control as an atomic value? Go back to
   `field()` even though its value is structured.

Continue with the dedicated [`field()`](../reference/field.md),
[`form()`](../reference/form.md), and [`array()`](../reference/array.md) references for complete
signatures and operations. The [executable primitive example](../examples/executable-examples.mdx#choosing-primitives)
verifies the three shapes together.
