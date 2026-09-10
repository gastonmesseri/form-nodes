---
title: useClosestFormState()
---

import CodeBlock from '@theme/CodeBlock';
import source from '!!raw-loader!../../examples/closest-form-state.typecheck.ts';
import errorsSource from '!!raw-loader!../../examples/closest-form-errors.typecheck.ts';

# useClosestFormState()

Observe submission history through one interface for Form Nodes, Angular Reactive Forms, and
Angular template-driven forms. The hook returns a stable object whose properties are signals.
It is independent of the forms API used by the caller, but requires Angular dependency injection.

## Signature

```ts
useClosestFormState(): ClosestFormState;
```

| Property | Signal value | Meaning |
| --- | --- | --- |
| `connected` | `boolean` | A supported form is available. |
| `source` | `'formNode' \| 'formGroup' \| 'ngForm' \| null` | The API supplying the state. |
| `submitted` | `boolean` | The active form has recorded a submission attempt, including an invalid attempt. |
| `formNode` | `CallableNodeApi<FormApi<any>> \| null` | The Form Nodes form's callable API, when available. |

Without a form, `connected()` and `submitted()` are false; `source()` and `formNode()` are null.
`formNode` is always a signal property. Its **value** is null for Reactive Forms and `NgForm`;
it never contains an Angular `FormGroup` or directive.

## One component for three forms APIs

The comments below identify two suggested component files. The same status component works
under all three forms. Its optional Form Nodes-specific button uses the original callable API.

<CodeBlock language="ts">{source}</CodeBlock>

`formState.formNode()?.()` reads the Form Nodes form's exposed value; use its API methods for
operations such as `formState.formNode()?.reset()`. The API is collision-safe: a child called `submitted` does not shadow
`formState.formNode()?.submitted()`. Access children through `.children`.

For reusable custom controls, combine this hook's `submitted()` with
[`useFormNodeState()`](./form-node-state.md)'s `touched()` and `invalid()` signals.

## Resolution and priority

Call once in a component or directive initializer. Resolution follows Angular's injector tree,
starting on the current element, rather than searching DOM ancestors or an HTML `form` attribute.

1. The nearest injectable `FORM_NODE` binding resolves its model's owning `form()`. If present,
   **Form Nodes wins**, even when an Angular form is also visible.
2. Otherwise, the nearest Angular `ControlContainer` resolves its owning `FormGroupDirective` or
   `NgForm`. Nested `formGroupName`, `formArrayName`, and `ngModelGroup` containers retain their root
   form's submission history. A nested Angular form selects its own root.
3. Without either supported source, the facade exposes its neutral defaults.

Bindings and Angular containers are selected once by DI. Form Nodes ownership remains reactive:
rebinding or model reparenting updates `formNode()`, `source()`, and `submitted()`. A bound node
without a model form owner falls back to Angular; it does not skip to a farther `FORM_NODE` binding.
Angular Signal Forms and a plain native form without an Angular directive are not sources for this hook.
Dialogs follow their supplied injector or `viewContainerRef`, as described below.

## Submission and reset timing

Form Nodes delegates directly to the owning form's `submitted()` signal. Angular directives are
adapted from their current public `submitted` flag, submission events, and control events.
A component created after submission sees the current history immediately.

Angular submissions update the facade during `ngSubmit`. Angular `resetForm()` clears its flag
after resetting the controls, so the facade reconciles control events in a microtask. It also
reconciles after rendering to observe silent resets and replaced Reactive Forms models.
Use the directive's `resetForm()` or the native reset button to reset Angular submission history;
resetting a `FormGroup` alone does not clear its directive's submitted flag.
Subscriptions and queued updates stop when the consuming component or directive is destroyed.

Avoid eagerly reading `formNode()` before a binding's required input is initialized; templates
and lazy computed expressions follow the normal Angular lifecycle.

## Dialogs and overlays {#dialogs-and-overlays}

The overlay's DOM position does not determine form ownership. For a Material dialog, pass
`viewContainerRef` from a component inside the intended form binding scope to `MatDialog.open()`.
The dialog then inherits that injector context, and its facade observes submission and reset.
A dialog opened from the root injector without that context normally receives neutral state.
A custom dialog injector determines visibility through its own provider hierarchy.

## Submission-aware errors

These two suggested component files show an error component receiving a field while discovering
submission state through DI. Keep it inside the intended binding scope; a sibling input's
`[formNode]` binding does not supply an ancestor context to the component.

<CodeBlock language="ts">{errorsSource}</CodeBlock>

With nested model forms, the nearest binding determines the owner. Bind the nested form in the
component's scope when it should supply submission history. The field input alone does not change
which binding the hook resolves.

## Migration

`useClosestFormState()` replaces `useClosestForm()`. Replace the old hook call with the new one,
read common history through `formState.submitted()`, and use `formState.formNode()` for optional
Form Nodes-specific values and operations. See the [migration guide](../project/migrations.md#closest-form-state).
