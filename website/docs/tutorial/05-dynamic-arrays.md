---
title: 5. Manage a dynamic array
---

# 5. Manage a dynamic array

Start with a small form-object template:

```ts
myForm = form({
  contacts: array({
    label: field(''),
    email: field(''),
  }),
});
```

The array starts empty. Each item added later gets an independent copy of the template.

Add `array` to the package import.

## Start with initial items

Pass an initial count when the form should start with ready-to-edit items:

```ts
myForm = form({
  contacts: array({
    label: field(''),
    email: field(''),
  }, 2),
});
```

Passing `2` as the second argument uses the initial-count shorthand and creates two
independent contact nodes from the template defaults. Basic structural operations act
directly on the array:

```ts
this.myForm.contacts.push({
  label: 'Personal',
  email: 'me@example.com',
});
this.myForm.contacts.removeAt(0);
this.myForm.contacts();
// Expected output:
// [
//   { label: '', email: '' },
//   { label: 'Personal', email: 'me@example.com' },
// ]
```

## Start with existing data

Use `initialValue` when the array should start with complete domain values:

```ts
myForm = form({
  contacts: array({
    label: field(''),
    email: field(''),
  }, {
    initialValue: [
      { label: 'Work', email: 'work@example.com' },
      { label: 'Personal', email: 'me@example.com' },
    ],
  }),
});
```

Each value initializes an independent item node created from the same template.

## Add identity and collection validation

Once the basic collection is clear, add stable domain identity and array-level validation:

```ts
myForm = form({
  // Existing profile and address branches...

  contacts: array({
    id: field(''),
    label: field('Work', [required]),
    email: field('', [required, email]),
    primary: field(false),
  }, {
    initialValue: [{ id: 'primary', label: 'Primary', email: '', primary: true }],
    trackBy: 'id',
    validators: [uniqueItems('email')],
  }),
});
```

Add `uniqueItems` to the package import.

The template is cloned into independent item nodes. `trackBy: 'id'` preserves those nodes—and their touched, dirty, and pending state—when complete values arrive in a different order.

## Render and change the collection

Track each node instance in Angular so structural moves retain their DOM and bindings:

```html
<section>
  <h2>Contacts</h2>

  @for (contact of myForm.contacts; track contact; let index = $index) {
    <input [formNode]="contact.label" />
    <input type="email" [formNode]="contact.email" />

    <button type="button" (click)="myForm.contacts.moveUp(index)">
      Move up
    </button>
    <button type="button" (click)="myForm.contacts.removeAt(index)">
      Remove
    </button>
  }

  <button type="button" (click)="myForm.contacts.push()">
    Add contact
  </button>
</section>
```

Operations preserve the array's programmatic dirty state. New items use template defaults and start pristine and untouched.

```ts
this.myForm.contacts.push({
  id: crypto.randomUUID(),
  label: 'Personal',
  email: '',
  primary: false,
});

this.myForm.contacts.swap(0, 1);
```

## Related guides and reference

- [Dynamic arrays](../guides/dynamic-arrays.md) covers templates, factories, identity,
  reconciliation, patching, and every structural operation.
- [`array()` reference](../reference/array.md) lists signatures, options, state, and edge cases.
- [Build a reorderable array](../cookbook/reorderable-arrays.md) shows movement controls and
  server reconciliation with `trackBy`.
- [Choosing a primitive](../guides/choosing-a-primitive.md) compares an `array()` node with an
  array-valued `field()`.

Continue with [Step 6: Validate asynchronously](./06-async-validation.md).
