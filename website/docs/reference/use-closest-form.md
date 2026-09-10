---
title: useClosestForm()
---

import CodeBlock from '@theme/CodeBlock';
import errorsSource from '!!raw-loader!../../examples/closest-form-errors.typecheck.ts';

# useClosestForm()

Returns a signal of the callable, collision-safe API of the form owning the nearest injectable [`[formNode]`](./form-node-binding.md) binding. It lets descendant
components observe submission state without passing the form through inputs or subscribing to events.

## Signature

```ts
useClosestForm(): Signal<CallableNodeApi<FormApi<any>> | null>;
```

The function is exported from `@ngblocks/form-nodes`. Its result is the owning form's `$api`,
not the node with its direct child properties. `closestForm()?.submitted()` always reads state,
even when a child is named `submitted`. `closestForm()?.()` reads the exposed aggregate value.
Use `closestForm()?.children` to inspect children. The signal follows ownership changes, while
both it and the returned API retain normal Angular signal semantics.

## Resolution and lifecycle

Call once in an Angular injection context, normally a component or directive field initializer.
The hook injects [`FORM_NODE`](./form-node-token.md) with `optional: true`, starting on the current element and following
Angular's injector hierarchy. It then observes that binding's current node and its [`form()`](./field.md#form) owner.

- Binding to a form: returns that form's API.
- Binding to a field, group, or array: returns the API of its nearest explicit form in the model tree.
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

## Dialogs and overlays

The overlay's DOM position does not determine form ownership. For a Material dialog, pass
`viewContainerRef` from a component inside the intended `[formNode]` binding scope to
`MatDialog.open()`. Its injected form context then follows that view's injector hierarchy,
and `useClosestForm()` observes submission and reset without an event subscription.
A dialog opened from the root injector without that context normally receives `null`.
If you supply a custom dialog injector, its provider hierarchy determines visibility instead.

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

## Migrating earlier hook usage

The hook now returns the callable API directly. Replace `closestForm()?.$api.submitted()` with
`closestForm()?.submitted()`, and `closestForm()?.$api.value()` with `closestForm()?.()` or
`closestForm()?.value()`. Direct child access becomes `closestForm()?.children.childName`.
The result is not a node declaration and must not be passed to `[formNode]` or [`isFormNode()`](./is-form-node.md)
as though it were one.
