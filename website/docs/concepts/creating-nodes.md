---
title: Creating nodes
---

# Creating nodes

Gem Forms models a form as a tree of `field()`, `form()`, and `array()` nodes. TypeScript infers the complete value shape from that tree.

## Fields

Use `field()` for a leaf value. Fields normally appear inside a form definition:

```ts
import { field, required } from '@gem/ng-forms';

const myForm = form({
  name: field('Marco', {
    validators: [required],
  }),
});
```

Fields are nullable by default. `myForm.name` is therefore `Field<string | null>`, even though its initial value is a string. Opt out when null is not a valid business value:

```ts
const name = field('', { nullable: false });

name.set('Lia');
// name.set(null); // TypeScript error
```

A field created without an initial value starts at `null`:

```ts
const nickname = field<string>();
```

A standalone field is fully supported, but a form tree provides the typed parent, path, aggregate value, and state propagation used by most applications.

## Forms

Use `form()` to combine named nodes into an object:

```ts
import { field, form } from '@gem/ng-forms';

const profile = form({
  name: field(''),
  age: field<number>(),
});

profile(); // { name: '', age: null }
profile.name(); // ''
profile.age(); // null
```

Nested objects are shorthand for nested forms:

```ts
const profile = form({
  name: field(''),
  address: {
    city: field(''),
    country: field(''),
  },
});

profile.address.city(); // ''
```

Use an explicit nested `form()` when that level needs validators, state options, submission behavior, or validator messages:

```ts
const profile = form({
  address: form({
    city: field(''),
    country: field(''),
  }, {
    disabled: () => !canEditAddress(),
  }),
});
```

Forms always have a non-null object value. Use a field containing an object when the object itself must be nullable.

## Arrays

Use `array()` for a dynamic collection. Its first argument is a node template cloned for every item:

```ts
import { array, field, form } from '@gem/ng-forms';

const myForm = form({
  people: array({
    name: field(''),
    age: field(18),
  }, {
    initialValue: [{ name: 'Mark', age: 50 }],
  }),
});

myForm.people(); // [{ name: 'Mark', age: 50 }]
myForm.people[0]?.name(); // 'Mark'
```

Use a field template when each item is a primitive value:

```ts
const myForm = form({
  tags: array(field(''), ['angular', 'signals']),
});

myForm.tags(); // ['angular', 'signals']
myForm.tags[0]?.set('typescript');
```

Arrays always expose an array value. Passing `null` or `undefined` to `set()` or `reset(value)` clears the array.

## Node options

Fields, forms, and arrays accept options for validators, debounce, and initial or reactive state:

```ts
const account = form({
  email: field(''),
  loginName: field(''),
}, {
  disabled: () => !permissions().canEdit,
  hidden: () => !featureFlags().account,
  readonly: false,
  debounce: 250,
});
```

The closest configured node provides inherited `disabled`, `readonly`, `hidden`, and debounce behavior to its descendants. A descendant can define its own option to override the inherited debounce or add another state cause.

## Using nodes outside Angular

Node creation, synchronous validation, state transitions, and explicitly triggered asynchronous validation work without dependency injection:

```ts
const counter = field(0);

counter.update(value => (value ?? 0) + 1);
console.log(counter()); // 1
```

Provide an Angular `Injector` only when you want its `DestroyRef` to own asynchronous validation cleanup deterministically.

## Declaring a form in a component

In an Angular application, the form is commonly a component property:

```ts
import { Component } from '@angular/core';

import { field, FormNode, form } from '@gem/ng-forms';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `
    <label>
      Name
      <input [formNode]="myForm.name" />
    </label>

    <label>
      Hair color
      <input [formNode]="myForm.hairColor" />
    </label>

    <p>Current name: {{ myForm.name() }}</p>
    <p>Current hair color: {{ myForm.hairColor() }}</p>
  `,
})
export class ProfileEditor {
  myForm = form({
    name: field(''),
    hairColor: field(''),
  });
}
```

## Current structural boundaries

The named children of a `form()` are fixed by its definition. Use `array()` when items must be added or removed at runtime. The library does not currently generate form trees from JSON schema definitions.

See the [complete form example](../examples/complex-form.md) for a larger Angular component combining nested forms, dynamic arrays, validation, state, and submission.
