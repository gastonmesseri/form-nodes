---
title: 2. Bind native controls
---

# 2. Bind native controls

Expand the initial name binding to every field with `[formNode]`.

```ts
import { Component } from '@angular/core';

import { FormNode, field, form } from '@gem/ng-forms';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `
    <label>
      Name
      <input [formNode]="myForm.name" />
    </label>

    <label>
      Age
      <input type="number" [formNode]="myForm.age" />
    </label>

    <label>
      Email
      <input type="email" [formNode]="myForm.email" />
    </label>

    <p>Current name: {{ myForm.name() }}</p>
    <p>Current age: {{ myForm.age() }}</p>
    <p>Current email: {{ myForm.email() }}</p>
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

The directive handles both directions:

- Programmatic `set()` calls update the rendered control.
- User input updates the field and aggregated form value.
- User input marks the field dirty.
- Blur marks it touched.
- Numeric inputs produce numbers rather than raw strings.

The model remains the source of truth; no `FormControl`, `formControlName`, or string path is required.

Continue with [Step 3: Add validation](./03-validation.md).
