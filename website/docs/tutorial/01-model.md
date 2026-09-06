---
title: 1. Declare the model
---

# 1. Declare the model

Start with a component-owned form tree. `field()` creates leaf values and `form()` infers their combined object shape.

```ts
import { Component } from '@angular/core';

import { field, FormNode, form } from 'form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `
    <label>
      Name
      <input [formNode]="myForm.name" />
    </label>

    <p>Current name: {{ myForm.name() }}</p>
  `,
})
export class ProfileEditor {
  myForm = form({
    name: field(''),
    age: field<number>(null),
    email: field(''),
  });
}
```

Fields are nullable by default. Use `field.strict('')` when a field should be non-nullable;
its value type is `string` rather than `string | null`. See [Field nullability](../reference/field.md#nullability).

For the declaration above, the inferred value is equivalent to:

```ts
type ProfileValue = {
  name: string | null;
  age: number | null;
  email: string | null;
};
```

You do not need to maintain that interface separately. TypeScript derives it from the declaration.

:::tip Let the form declaration infer the value

Start from fields and let `form()` derive the aggregate type. Add an explicit domain type only
where it communicates a boundary or constrains a nullable/union value more precisely.

:::

## Read and update values

Call nodes directly to read their committed values:

```ts
this.myForm(); // { name: '', age: null, email: '' }
this.myForm.name(); // ''
this.myForm.age(); // null
```

Use methods directly on fields and forms:

```ts
this.myForm.name.set('Ada');
this.myForm.age.update(age => (age ?? 0) + 1);

this.myForm.patch({
  email: 'ada@example.com',
});
```

The model itself also works outside Angular and does not require dependency injection. The first
field is already connected to a native input; next, bind the remaining fields and examine the
control interaction behavior.

## Related guides and reference

- [Creating nodes](../concepts/creating-nodes.md) covers every `field()`, `form()`, nested-object,
  and `array()` declaration shape.
- [Values and state](../concepts/values-and-state.md) explains callable values, `set()`, `update()`,
  `patch()`, and `reset()`.
- [`field()` reference](../reference/field.md) documents nullability, options, state, and validation.
- [`form()` reference](../reference/form.md) documents aggregate values, children, and operations.

Continue with [Step 2: Bind controls](./02-bind-controls.md).
