---
title: Your first form
description: Create a typed Angular form, bind its controls, read reactive state, and find the next guide for your application.
---

# Your first form {#your-first-form}

After [installing the package](./installation.md), define and bind a registration form in one
Angular component. This example introduces the model, control binding, and reactive value reads;
the guides at the end add error messages and submission.

```ts
import { Component } from '@angular/core';
import { email, FormNodeDirective, field, form, minLength, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-registration',
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="myForm.username" />
    <input type="email" [formNode]="myForm.email" />

    <p>Current username: {{ myForm.username() }}</p>
    <p>Current email: {{ myForm.email() }}</p>
  `,
})
export class RegistrationComponent {
  myForm = form({
    username: field('', [required, minLength(2)]),
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
myForm(); // { username: '', email: '' }
myForm.username(); // ''
myForm.email(); // ''
```

Validation state is exposed as signals too:

```ts
myForm.valid(); // false because username and email are required

myForm.allErrors();
// [
//   { kind: 'required', message: 'This field is required.', targetNode: myForm.username },
//   { kind: 'required', message: 'This field is required.', targetNode: myForm.email },
// ]
```

## ⚡ Reactive state signals {#reactive-state-signals}

If you already use Angular writable signals, a field follows the same basic value pattern:
`myForm.username()` reads its value and `myForm.username.set(value)` changes it. Unlike a plain
`signal()`, the field also owns form-specific state and behavior such as validation, touched,
dirty, disabled, reset, debounce, and control binding.

Fields, forms, and arrays expose their state as Angular signals, so templates and reactive code can
read it directly without subscriptions:

```ts
myForm.valid(); // false
myForm.disabled(); // false

myForm.username.invalid(); // true
myForm.username.touched(); // false
myForm.username.dirty(); // false
```

Angular tracks these reads automatically in templates:

```html
@if (myForm.username.touched() && myForm.username.invalid()) {
  <p>Please enter your username.</p>
}
```

Update a field programmatically with `set()`:

```ts
myForm.username.set('marco');
```

[`FormNodeDirective`](../reference/form-node-binding.md) is imported by the standalone component so `[formNode]` is available in its template.
Keep the bindings next to the model whenever a compact inline template remains readable.

If your application uses NgModules, you can import and re-export `FormNodeDirective` from a shared module instead:

```ts
import { NgModule } from '@angular/core';
import { FormNodeDirective } from '@ngblocks/form-nodes';

@NgModule({
  imports: [FormNodeDirective],
  exports: [FormNodeDirective],
})
export class SharedModule {}
```

Every NgModule or standalone component that imports `SharedModule` can then use `[formNode]` in its templates. Angular does not provide an application-wide import for template directives through `ApplicationConfig`; standalone components must import `FormNodeDirective` themselves, either directly or through a shared NgModule.

The [executable first-form example](../examples/executable-examples.mdx#first-form) is compiled and
run during documentation verification.

## Next steps {#next-steps}

Choose the next piece your form needs:

| I want to… | Continue with |
| --- | --- |
| Show validation messages below an input | [`form-node-errors`: native-input example](../reference/form-node-errors.md#native-input) |
| Save the form and show submission progress | [Form submission](../guides/submission.md) |
| Add repeatable rows | [Dynamic arrays](../guides/dynamic-arrays.md) |
| Use a custom input component | [Custom controls](../guides/custom-controls.md) |
| Load an existing record for editing | [Edit server data](../cookbook/edit-server-data.md) |

For a guided progression, follow the [customer profile tutorial](../tutorial/index.md). For a
larger example with the pieces already connected, explore the
[complete form example](../examples/complex-form.md).
