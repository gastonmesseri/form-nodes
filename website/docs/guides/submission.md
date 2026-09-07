---
title: Form submission
---

# Form submission {#form-submission}

The [executable submission example](../examples/executable-examples.mdx#submission) runs both the
invalid callback and the successful asynchronous action.

Configure submission on the root `form()`:

```ts
const registration = form({
  name: field('', [required]),
  email: field('', [required, email]),
}, {
  onSubmit: async (value, form) => {
    await api.register(value);
    form.reset();
  },
  onSubmitBlocked: form => form.focus(),
});
```

Call `submit()` programmatically:

```ts
const submitted = await registration.submit();
```

Submission marks the form subtree touched, which also commits pending control values, before deciding whether validation allows the action. It returns `true` when the action completes and `false` when validation blocks it or another action is already running. A rejected action rejects the returned promise and still clears submission state.

## 🧩 Native form elements {#native-form-elements}

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

## 📨 Submission state {#submission-state}

`submitting()` is true while an asynchronous action is running and is inherited by descendants. Repeated submissions do not start overlapping actions.

By default, invalid validation blocks submission while pending validation alone does not. Configure `submitWhen` when a workflow needs different behavior:

```ts
onSubmit: saveDraft,
submitWhen: 'not-invalid', // 'valid' | 'not-invalid' | 'always'
```

These properties belong directly in the second `form()` argument.

- `'valid'` requires `valid()` to be true; errors and pending validation block the attempt immediately.
- `'not-invalid'` is the default: pending validation permits submission unless errors make the form invalid.
- `'always'` runs the action regardless of validation state, without disabling validators or clearing errors.

`onSubmit(value, form)` receives the exposed value snapshot first and the submitted form second.
It may return `void` or a promise-like value; submission waits for it and propagates failures.

Use `onSubmitBlocked(form)` for synchronous UI feedback when validation blocks an attempt. It also
runs for pending validation with `'valid'`; submission does not wait for validation or retry automatically.
It does not run for concurrent attempts or when `onSubmit` is absent. Without `onSubmit`, `submit()`
still marks and flushes the subtree and returns `false`.

Submission callbacks run without reactive dependency tracking. Options belong to the form where
specified; nested forms retain their own callbacks and policy while inheriting `submitting()` state.
