---
title: Form submission
---

import CodeBlock from '@theme/CodeBlock';
import errorsSource from '!!raw-loader!../../examples/submission-errors.example.ts';
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
- `'always'` runs the action regardless of validation state, without disabling validators. Previous submission errors are cleared before every non-concurrent attempt with an action.

`onSubmit(value, form)` receives the exposed value snapshot first and the submitted form second.
It may return an error, a readonly error array, `null`, or `void`, directly or through a promise-like value.
Submission waits for the result; thrown or rejected failures propagate.

Use `onSubmitBlocked(form)` for synchronous UI feedback when validation blocks an attempt. It also
runs for pending validation with `'valid'`; submission does not wait for validation or retry automatically.
It does not run for concurrent attempts or when `onSubmit` is absent. Without `onSubmit`, `submit()`
still marks and flushes the subtree and returns `false`.

Submission callbacks run without reactive dependency tracking. Options belong to the form where
specified; nested forms retain their own callbacks and policy while inheriting `submitting()` state.

## Server rejection errors {#server-errors}

Return `{ kind, message?, targetNode? }` from `onSubmit` when the server rejects the submitted data.
An omitted `targetNode` assigns the error to the submitted form. Return a readonly array to report
multiple errors. `null`, `undefined`, implicit fallthrough, and an empty array indicate success.
The application maps its backend response to this format; Form Nodes does not interpret HTTP responses.

<CodeBlock language="typescript" title="submission-errors.ts">{errorsSource}</CodeBlock>

Returned errors appear in the target's `errors()` and `getError()`, propagate through `allErrors()`,
and affect normal validity. Targets can be fields, groups, forms, or arrays captured within the
submitted subtree. Errors for foreign nodes or nodes added after the action starts are ignored.
A nonempty returned error list always makes `submit()` resolve to `false`, even if all its targets
became obsolete. `onSubmitBlocked` reports local validation gating, not a server rejection.

Submission errors are separate from validator and control-owned errors:

- Changing a target's committed value or pending control value invalidates its submission errors.
  An unrelated sibling edit leaves a field error intact. Aggregate errors depend on the aggregate's
  committed value and descendant pending inputs; use an aggregate target for a rejection involving several fields.
- Resetting a subtree clears its submission errors, including when values do not change, and makes
  in-flight errors for those reset nodes obsolete. Reset does not cancel the request.
- Before a non-concurrent attempt with an action checks validity, it clears previous submission
  errors throughout that subtree. Normal validator and control errors still enforce `submitWhen`.
  This permits retrying a global rejection without inventing a value change.
- Responses are checked against captured node identities and reactive revisions, using committed
  and control values rather than exposed-value equality. Changed/reset/detached targets are ignored.
  Retained array rows keep their errors when reordered; removed rows lose them. A newer admitted
  parent submission supersedes an older nested submission for their shared targets.
- Disabled, readonly, and hidden nodes suppress these errors through the existing non-interactive
  rules. Suppression does not itself erase a stored error. Normal signal identity rules apply:
  mutating an object in place without a notifying write cannot invalidate a response.

Use thrown/rejected failures for technical problems such as a disconnected request. They continue
rejecting `submit()` and clear `submitting()` in `finally`; they do not become validation errors.
When an API returns a response object on success, consume that response in `onSubmit` and return
nothing, rather than returning the response as an error result.

## Submission history {#submission-history}

`form.submitted()` is a readonly signal recording whether `submit()` has been called on this
specific form since its last reset. It starts false and becomes true synchronously before guards,
including attempts blocked by validation, missing `onSubmit`, or an already running action.
Native submission through `<form [formNode]>` uses the same operation.

| State or result | Meaning |
| --- | --- |
| `submitted()` | An attempt occurred since reset, regardless of success |
| `submitting()` | An action on this form or an ancestor is currently running |
| `await submit()` | True when the action completed without returned errors; false when skipped or rejected by returned errors; rejects on thrown/rejected failures |

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
