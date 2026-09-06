---
title: Form submission
---

# Form submission

The [executable submission example](../examples/executable-examples.mdx#submission) runs both the
invalid callback and the successful asynchronous action.

Configure submission on the root `form()`:

```ts
const registration = form({
  name: field('', [required]),
  email: field('', [required, email]),
}, {
  submission: {
    action: async (form, value) => {
      await api.register(value);
      form.reset();
    },
    onInvalid: form => form.focus(),
  },
});
```

Call `submit()` programmatically:

```ts
const submitted = await registration.submit();
```

Submission marks the form subtree touched, which also commits pending control values, before deciding whether validation allows the action. It returns `true` when the action completes and `false` when validation blocks it or another action is already running. A rejected action rejects the returned promise and still clears submission state.

## Native form elements

Import `FormNode` once and use it for both the native form and its controls:

```ts
@Component({
  imports: [FormNode],
  template: `
    <form [formNode]="registration">
      <input [formNode]="registration.name" />
      <input type="email" [formNode]="registration.email" />
      <button type="submit" [disabled]="registration.submitting()">
        Create account
      </button>
    </form>
  `,
})
export class RegistrationPage {}
```

On a native `<form>`, `FormNode` prevents native navigation, disables native constraint submission
with `novalidate`, and maps native reset to the bound object node's `reset()`. With `form()`, submit
runs the configured action. Binding a `group()` is intentionally tolerated: submit still marks and
flushes the tree but runs no action. This makes an accidental group/form choice non-destructive
while keeping submission configuration exclusive to `form()`.

Controls may instead use Angular Signal Forms' `FormField`. Keep `[formNode]` on the native form so
Form Nodes remains the only form root:

```ts
import { Component } from '@angular/core';
import { FormField } from '@angular/forms/signals';

import { FormNode, field, form, required } from 'form-nodes';

@Component({
  imports: [FormNode, FormField],
  template: `
    <form [formNode]="myForm">
      <input [formField]="myForm.email.$field" />
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>
  `,
})
export class EmailEditor {
  myForm = form({
    email: field('', [required]),
  }, {
    submission: {
      action: (_form, value) => save(value),
      onInvalid: invalidForm => invalidForm.allErrors()[0]?.targetNode.$api.focus(),
    },
  });
}
```

The adapted control contributes its value, interaction state, and parse errors to the Form Nodes tree, so
the normal invalid-submission path still applies. Do not place Angular's separate form-root
directive on the same `<form>`. See [Control binding](./control-binding.md#native-form-root-with-formfield-controls)
for the complete composition rule and reset semantics.

## Submission state

`submitting()` is true while an asynchronous action is running and is inherited by descendants. Repeated submissions do not start overlapping actions.

By default, invalid validation blocks submission while pending validation alone does not. Configure `ignoreValidators` when a workflow needs different behavior:

```ts
submission: {
  action: saveDraft,
  ignoreValidators: 'pending', // 'none' | 'pending' | 'all'
}
```

- `'none'` respects invalid and pending validation.
- `'pending'` is the default behavior: it permits submission while validation is pending unless an error already makes the form invalid.
- `'all'` runs the action regardless of validation state.

Use `onInvalid` for UI behavior such as focusing the first invalid rendered control.
