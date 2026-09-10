---
title: Form submission
---

import CodeBlock from '@theme/CodeBlock';
import historySource from '!!raw-loader!../../examples/submission-history.example.ts';

# Form submission {#form-submission}

The [executable submission example](../examples/executable-examples.mdx#submission) runs both the
invalid callback and the successful asynchronous action.

Configure submission on the root [`form()`](../reference/form.md):

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

Import [`FormNodeDirective`](../reference/form-node-binding.md) once and use it for both the native form and its controls:

```ts
@Component({
  imports: [FormNodeDirective],
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

On a native `<form>`, `FormNodeDirective` prevents native navigation, disables native constraint submission
with `novalidate`, and maps native reset to the bound object node's `reset()`. With `form()`, submit
runs the configured action. Binding a [`group()`](../reference/group.md) is intentionally tolerated: submit still marks and
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

## Submission history {#submission-history}

`form.submitted()` is a readonly signal recording whether `submit()` has been called on this
specific form since its last reset. It starts false and becomes true synchronously before guards,
including attempts blocked by validation, missing `onSubmit`, or an already running action.
Native submission through `<form [formNode]>` uses the same operation.

| State or result | Meaning |
| --- | --- |
| `submitted()` | An attempt occurred since reset, regardless of success |
| `submitting()` | An action on this form or an ancestor is currently running |
| `await submit()` | True when the action completed; false when skipped; rejects when the action fails |

Editing, `set()`, `patch()`, touching/untouching, and action completion leave history intact.
`reset()`, `reset(value)`, and `resetToInitial()` clear it. A native reset through `[formNode]`
clears it too. Resetting a field preserves its owner's history. If a reset occurs while an action
is running, the flag remains false when the action settles; reset does not cancel that action.
A new submit attempt after that reset sets the flag again, even if concurrency prevents its action.

Each explicit nested `form()` owns its history: submitting a parent does not set a child's flag,
and submitting a child does not set its parent's flag. Ancestor resets clear all descendant forms,
including forms within groups and arrays. New forms and newly created array items start unsubmitted.
Unlike `submitting()`, submission history is not inherited. It does not itself change validation,
dirty/touched state, debounce, or the submission policy; existing `submit()` interaction rules remain.

<CodeBlock language="typescript" title="submission-history.ts">{historySource}</CodeBlock>

For an error component, combine field invalidity with `field.touched()` or its owner's `submitted()`.
This also covers fields created after an attempt. [useClosestFormState()](../reference/use-closest-form-state.md)
observes the owning form through the nearest binding, including components created after submission.
Its `submitted()` signal also supports Reactive Forms and `NgForm`, without manually copying submission events.

## Observe submission in the template

Use `(formNodeSubmit)` for native submission attempts and `(formNodeSubmitBlocked)` for attempts
rejected by `submitWhen`. Both provide `{ value, form, event }`. Attempt notifications happen after
pending input is flushed and before validation gating, even without a declared action. Keep async
saving in `onSubmit` when you need managed `submitting()` state and concurrency protection.

See [submission outputs](../reference/form-node-binding.md#submission-outputs) for signatures,
ordering, template-only usage, and the difference from programmatic `submit()`.
