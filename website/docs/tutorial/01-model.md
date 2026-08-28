---
title: 1. Declare the model
---

# 1. Declare the model

Start with a component-owned form tree. `field()` creates leaf values and `form()` infers their combined object shape.

```ts
import { Component } from '@angular/core';

import { field, form } from '@gem/ng-forms';

@Component({
  selector: 'app-profile-editor',
  template: `
    <p>{{ myForm.name() }}</p>
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

Fields are nullable by default. The inferred value is equivalent to:

```ts
type ProfileValue = {
  name: string | null;
  age: number | null;
  email: string | null;
};
```

You do not need to maintain that interface separately. TypeScript derives it from the declaration.

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

At this point, the form works without any Angular template integration. Next, connect it to native controls.

Continue with [Step 2: Bind native controls](./02-bind-controls.md).
