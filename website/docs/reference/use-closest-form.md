---
title: useClosestForm()
---

import CodeBlock from '@theme/CodeBlock';
import errorsSource from '!!raw-loader!../../examples/closest-form-errors.typecheck.ts';

# useClosestForm()

Returns a signal of the form owning the nearest injectable `[formNode]` binding. It lets descendant
components observe submission state without passing the form through inputs or subscribing to events.

## Signature

```ts
useClosestForm(): Signal<NavigationForm | null>;
```

`NavigationForm` is the same unspecified-children navigation type exposed by a field's `form()`.
It provides the form API, including `submitted()`, `submitting()`, and `submit()`. The function is
exported from `@ngblocks/form-nodes`. You normally infer its return type; use `$api` when child
names are unknown, since they may shadow direct methods such as `submitted`.

## Resolution and lifecycle

Call once in an Angular injection context, normally a component or directive field initializer.
The hook injects `FORM_NODE` with `optional: true`, starting on the current element and following
Angular's injector hierarchy. It then observes that binding's current node and its `form()` owner.

- Binding to a form: returns that form itself.
- Binding to a field, group, or array: returns its nearest explicit form in the model tree.
- No injectable binding, or a node without a form owner: returns `null`.
- Rebinding, attachment, detachment, and reparenting: the signal updates reactively.

A nearer binding without a form owner returns `null`; the hook does not skip it to find a farther
binding. The injected binding is chosen once. Moving DOM elements does not repeat DI resolution.
The hook does not search HTML ancestors, follow an input's `form` attribute, or discover Angular
`NgForm`/`FormGroupDirective`. A native `<form>` without `[formNode]` supplies no binding by itself.
Angular projection and custom injector boundaries follow normal DI visibility rules.

Do not eagerly read the result in a constructor before the binding's required input is initialized.
Reading from a template or a lazy `computed()` keeps initialization in the normal Angular lifecycle.
Calling the hook outside an injection context throws; an optional binding does not make DI optional.

## Submission-aware errors

The following block contains two suggested component files, identified by comments. The error
component receives its field explicitly and discovers its surrounding form through DI. The input
alone does not affect hook resolution: keep it within the intended form's binding scope.

<CodeBlock language="typescript">{errorsSource}</CodeBlock>

`submitted()` records an attempt, including one blocked by validation. A component created after
an attempt sees the current flag immediately. Resets propagate automatically; no event subscription,
manual copying, or subscription cleanup is needed. Without a form, this example falls back to touched.

With nested model forms, the hook follows the nearest **binding**. To observe an explicit nested
form, provide a binding in that component's scope, or read the supplied field's `form()` instead.
A sibling input's `[formNode]` is not an ancestor binding of the error component.

This hook does not make components that inject `NgForm` automatically compatible. Such components
must use this API or provide an explicit integration for the state they need.

See [submission history](../guides/submission.md#submission-history), [FORM_NODE](./form-node-token.md),
and [form()](./form.md#submitted).
