---
title: Your first form
---

# Your first form

Define and bind the form in an Angular component:

```ts
import { Component } from '@angular/core';

import { email, FormNode, field, form, minLength, required } from '@gem/ng-forms';

@Component({
  selector: 'app-registration',
  imports: [FormNode],
  template: `
    <input [formNode]="myForm.name" />
    <input type="email" [formNode]="myForm.email" />

    <p>Current name: {{ myForm.name() }}</p>
    <p>Current email: {{ myForm.email() }}</p>
  `,
})
export class RegistrationComponent {
  myForm = form({
    name: field('', [required, minLength(2)]),
    email: field('', [required, email]),
  });
}
```

Every node is callable. Calling it is the preferred way to read its committed value:

```ts
myForm(); // { name: '', email: '' }
myForm.name(); // ''
myForm.email(); // ''
```

Validation state is exposed as signals too:

```ts
myForm.valid(); // false because name and email are required

myForm.allErrors();
// [
//   { kind: 'required', message: 'This field is required.', targetNode: myForm.name },
//   { kind: 'required', message: 'This field is required.', targetNode: myForm.email },
// ]
```

## Reactive state signals

Fields, forms, and arrays expose their state as Angular signals, so templates and reactive code can
read it directly without subscriptions:

```ts
myForm.valid(); // false
myForm.disabled(); // false

myForm.name.invalid(); // true
myForm.name.touched(); // false
myForm.name.dirty(); // false
```

Angular tracks these reads automatically in the template:

```html
@if (myForm.name.touched() && myForm.name.invalid()) {
  <p>Please enter your name.</p>
}
```

Update a field programmatically with `set()`:

```ts
myForm.name.set('Marco');
```

`FormNode` is imported by the standalone component so `[formNode]` is available in its template.
Keep the bindings next to the model whenever a compact inline template remains readable.

If your application uses NgModules, you can import and re-export `FormNode` from a shared module instead:

```ts
import { NgModule } from '@angular/core';
import { FormNode } from '@gem/ng-forms';

@NgModule({
  imports: [FormNode],
  exports: [FormNode],
})
export class SharedModule {}
```

Every NgModule or standalone component that imports `SharedModule` can then use `[formNode]` in its templates. Angular does not provide an application-wide import for template directives through `ApplicationConfig`; standalone components must import `FormNode` themselves, either directly or through a shared NgModule.

When you are ready to see the same syntax at application scale, continue with the [complete form example](../examples/complex-form.md).
The [executable first-form example](../examples/executable-examples.mdx#first-form) is compiled and
run during documentation verification.
