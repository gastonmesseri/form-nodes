---
title: Your first form
---

# Your first form

Define a form by composing fields:

```ts
import { email, field, form, minLength, required } from '@gem/ng-forms';

const registration = form({
  name: field('', [required, minLength(2)]),
  email: field('', [required, email]),
});
```

Every node is callable and exposes reactive/signal-based state:

```ts
registration.name();
registration.value();
registration.valid();
registration.allErrors();
```

Programmatic writes are immediate and do not mark a field dirty:

```ts
registration.name.set('Marco');
```

Bind fields in an Angular template with `[formNode]`:

```html
<input [formNode]="registration.name" />
<input type="email" [formNode]="registration.email" />
```

Import `FormNode` in the component or directive that owns the template:

```ts
import { Component } from '@angular/core';
import { FormNode, field, form, required } from '@gem/ng-forms';

@Component({
  selector: 'app-registration',
  imports: [FormNode],
  templateUrl: './registration.html',
})
export class RegistrationComponent {
  readonly registration = form({
    name: field('', [required]),
  });
}
```
