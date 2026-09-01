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
    <input [formNode]="myForm.fullName" />
    <input type="email" [formNode]="myForm.email" />

    <p>Current full name: {{ myForm.fullName() }}</p>
    <p>Current email: {{ myForm.email() }}</p>
  `,
})
export class RegistrationComponent {
  myForm = form({
    fullName: field('', [required, minLength(2)]),
    email: field('', [required, email]),
  });
}
```

This already provides a fully inferred aggregate value, independently addressable field nodes,
reactive validation state, and two-way Angular control binding. No `FormGroup`, `FormControl`,
`formControlName`, string path, or manual subscription is required. The form model can also be
created and used outside an Angular injection context; Angular is needed only when binding it to
the view.

Every node is callable. Calling it is the preferred way to read its committed value:

```ts
myForm(); // { fullName: '', email: '' }
myForm.fullName(); // ''
myForm.email(); // ''
```

Validation state is exposed as signals too:

```ts
myForm.valid(); // false because fullName and email are required

myForm.allErrors();
// [
//   { kind: 'required', message: 'This field is required.', targetNode: myForm.fullName },
//   { kind: 'required', message: 'This field is required.', targetNode: myForm.email },
// ]
```

## Reactive state signals

Fields, forms, and arrays expose their state as Angular signals, so templates and reactive code can
read it directly without subscriptions:

```ts
myForm.valid(); // false
myForm.disabled(); // false

myForm.fullName.invalid(); // true
myForm.fullName.touched(); // false
myForm.fullName.dirty(); // false
```

Angular tracks these reads automatically in templates:

```html
@if (myForm.fullName.touched() && myForm.fullName.invalid()) {
  <p>Please enter your full name.</p>
}
```

Update a field programmatically with `set()`:

```ts
myForm.fullName.set('Marco Polo');
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
