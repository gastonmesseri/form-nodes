---
title: 5. Manage a dynamic array
---

# 5. Manage a dynamic array

Add repeated contacts with a readable form-object template:

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

Add `array` and `uniqueItems` to the package import.

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

Continue with [Step 6: Validate asynchronously](./06-async-validation.md).
