---
title: "[formNode] directive"
---

import CodeBlock from '@theme/CodeBlock';
import basicBindingSource from '!!raw-loader!../../examples/form-node-binding-basic.typecheck.ts';
import templateActionsSource from '!!raw-loader!../../examples/form-node-template-actions.typecheck.ts';
import bindingQuerySource from '!!raw-loader!../../examples/form-node-query.typecheck.ts';
import submitSource from '!!raw-loader!../../examples/form-node-submit.typecheck.ts';
import valueOutputsSource from '!!raw-loader!../../examples/form-node-value-outputs.typecheck.ts';
import nativeInputHandlerSource from '!!raw-loader!../../examples/native-input-handler.typecheck.ts';

# [formNode] directive {#formnode-directive}

`FormNodeDirective` connects a control to a form node. Import it in your component and pass the
field to `[formNode]`; typing updates the field and its displayed value automatically.

<CodeBlock language="ts" title="profile-page.component.ts">{basicBindingSource}</CodeBlock>

Read the value with `form.username()` and update it from component code with
`this.form.username.set('Grace')`. The control stays in sync without an event handler.

## Template API at a glance {#template-api}

Bind a node, listen to control edits, or attach the directive to `<form>` for submission and reset.

| Template API | Example | What it does |
| --- | --- | --- |
| [`[formNode]`](#directive-input) | `[formNode]="form.username"` | Binds an existing field or aggregate node to a compatible control. |
| [`(formNodeChange)`](#value-outputs) | `(formNodeChange)="saveDraft($event)"` | Receives the committed value after debounce. |
| [`(formNodeControlValueChange)`](#value-outputs) | `(formNodeControlValueChange)="preview($event)"` | Receives the parsed control value immediately, before debounce. |
| [`(formNodeSubmit)`](#submission-outputs) | `(formNodeSubmit)="recordAttempt($event)"` | Reports a native submission attempt on a bound `form()`, before the validation gate. |
| [`(formNodeSubmitBlocked)`](#submission-outputs) | `(formNodeSubmitBlocked)="showErrors($event)"` | Reports an attempt rejected by `submitWhen`. |

`formNodeChange` carries the field or aggregate **value** in `$event`.
See [Value outputs](#value-outputs) for timing and the equivalent `formNodeValueChange` alias.

### Template references, methods, and state {#template-reference-api}

Export the binding with `#control="formNode"` to act on one rendered control or inspect its node
and visible errors.

| Reference API | Example | What it does |
| --- | --- | --- |
| [`#control="formNode"`](#binding-instance) | `<input #control="formNode" [formNode]="form.username" />` | Exposes this concrete binding in the template. |
| [`focus()`](#focus) | `(click)="control.focus()"` | Focuses that rendered control. |
| [`flush()`](#flush) | `(click)="control.flush()"` | Commits its pending control edit. |
| [`reset()`](#reset) | `(click)="control.reset()"` | Clears interaction and parsing state, retaining the committed value. |
| [`node()`](#node), [`errors()`](#errors) | `control.node().touched()`, `control.errors()` | Reads the bound node and errors visible to this binding. |

### React to committed and pending control edits {#template-value-events}

The field below waits 300 ms before committing an edit. `formNodeControlValueChange` updates the
draft length immediately; `formNodeChange` receives the committed description. You can replace
`formNodeChange` with `formNodeValueChange` without changing its behavior. Programmatic writes
such as `this.form.description.set(...)` do not emit these control events.

<CodeBlock language="ts" title="description-editor.component.ts">{valueOutputsSource}</CodeBlock>

### Observe submission attempts and blocked forms {#template-submission-events}

Bind the root form on `<form>` and its fields on the controls. Both submission events receive
`{ value, form, event }`. `formNodeSubmit` reports every attempt, including invalid attempts;
`formNodeSubmitBlocked` reports rejection by the validation policy. Put the save operation in
`onSubmit` so validation and concurrent submission handling apply to it.

<CodeBlock language="ts" title="profile.component.ts">{submitSource}</CodeBlock>

A native `<button type="reset">` inside the bound form calls the node's `reset()`. It clears
interaction state while retaining committed values. See [native form submission and reset](#native-form-submission).

### Call binding methods from the template {#template-binding-actions}

Export the directive with `#username="formNode"` to focus that control, flush pending input, or
clear interaction state. This field buffers input for one second; `flush()` commits it early.
`username.node()` returns the field; `username.node()()` reads its value.
`reset()` keeps the committed value. To restore the declared initial value instead, call
`username.node().resetToInitial()`.

<CodeBlock language="ts" title="username-editor.component.ts">{templateActionsSource}</CodeBlock>

## 🧭 API map {#api-map}

Import [`FormNodesModule`](./form-nodes-module.md) instead when you prefer one import point
for the library's Angular template features. [`FormNode<TChildren>`](./types/form-node.md) is the form model type;
use `FormNodeDirective<TNode>` or [`FormNodeBinding<TNode>`](./types/form-node-binding.md) for a rendered binding.

Import neither `_FormNode` nor internal package paths. `_FormNode` is exported only for Angular AOT
and linker infrastructure.

| I want to… | Start with | Details |
| --- | --- | --- |
| Query or inspect one concrete binding | `FormNodeDirective<TNode>`, `FormNodeBinding<TNode>` | [Binding instance](#binding-instance) |
| Inject the binding on its host | `FORM_NODE` | [`FORM_NODE` reference](./form-node-token.md) |
| Apply reactive CSS classes | [`provideFormNodesConfig()`](./provide-form-nodes-config.md) | [Automatic CSS classes](#automatic-css-classes) |
| Delegate through a wrapper | [`provideFormNodePassThrough()`](./provide-form-node-pass-through.md) | [Pass-through wrappers](#pass-through-wrappers) |
| Bind submit and reset on `<form>` | The same `FormNodeDirective` import | [Native form submission](#native-form-submission) |

## 🔌 Directive input {#directive-input}

Import `FormNodeDirective` in the component and bind a Form Nodes node to the `formNode` input,
as in the [opening example](#formnode-directive).

**Binding:** `[formNode]="node"`

The directive accepts a field, form, group, or array node. Native controls require a [`field()`](./field.md);
native `<form>` elements require a [`form()`](./form.md) or [`group()`](./group.md). Aggregate nodes can also bind to a
recognized custom component that models their complete value.

| Host | Accepted node | Purpose |
| --- | --- | --- |
| Native input, select, or textarea | `field()` | Two-way value and state synchronization |
| Signal custom-control component | Compatible field or aggregate node | Synchronizes its `value` or `checked` model |
| CVA component | Compatible field or aggregate node | Uses `ControlValueAccessor` interoperability |
| Native `<form>` | `form()` or `group()` | Handles submit and reset |
| Pass-through wrapper | Any delegated node | Leaves synchronization to an inner binding |

## 🔔 Value outputs {#value-outputs}

:::info Control edits and programmatic changes

These outputs report edits from the bound control. Programmatic `set()`, `patch()`, `update()`,
and reset calls do not emit them. To observe committed value changes from both control edits and
programmatic writes, use [`onValueChange` in the node options](../guides/configuring-nodes.md#value-changes),
such as [`field('', { onValueChange })`](./field.md#onvaluechange).
Both `onValueChange` and `(formNodeChange)` / `(formNodeValueChange)` wait for control input to commit under the debounce
rules; `(formNodeControlValueChange)` reports the control value immediately, before debounce.

:::

Prefer `(formNodeChange)` over native `(input)` or `(change)` when your handler needs
an updated node value. The selected adapter handles the appropriate native events, parsing,
CVA callback, or custom control output. `$event` is the value, not a DOM event.

| Output | Payload | Timing |
| --- | --- | --- |
| `formNodeControlValueChange` | `NodeValue<TNode>` | Immediately after the control value and dirty state are updated. |
| `formNodeChange` | `NodeValue<TNode>` | After the control-originated value is committed, respecting debounce. |
| `formNodeValueChange` | `NodeValue<TNode>` | The same committed event as `formNodeChange`. |

See the [control-edit example](#template-value-events) for both draft and committed events.

`formNodeChange` and `formNodeValueChange` share one output instance, including programmatic
subscriptions through a binding reference. Each registered listener receives the committed event
once. Registering handlers under both names creates two subscriptions; use one name per handler.
Unsubscribing one subscription leaves the others active. Neither name is deprecated.

### Commit timing {#commit-timing}

With a 300 ms debounce, typing several characters emits each parsed draft through
`formNodeControlValueChange`, then emits the final committed value through `formNodeChange` (or `formNodeValueChange`).
Touch, blur, submission, or `flush()` can confirm pending input early under the existing
[debounce rules](../guides/value-flow-and-debounce.md). Asynchronous debounce emits the committed
output only on successful completion or an explicit flush.

Without debounce, the control and committed outputs are synchronous and the node is already updated in both handlers.
The control-value output runs first. The committed output follows with the exposed value returned
by `node()`, including any configured value equality. Parent values and synchronous validation are
current; asynchronous validation can still be pending. If the first handler replaces the value,
the superseded committed notification is suppressed.

These outputs belong to the concrete control binding. Programmatic `set()`, `patch()`, `update()`,
`reset()`, and `value.control.set()` calls do not emit them. A flush can emit a previously pending
control edit. Replaced or cancelled debounce work does not emit a committed notification, and a
binding does not emit a pending notification after it is destroyed or rebound to a different node.
Native `<form>` bindings and pass-through wrappers do not aggregate or forward descendants' outputs;
listen on the binding that owns the control transport.

For native controls, unchanged parsed values are ignored, so an `input` followed by `change`, or
`compositionend` followed by `input`, does not duplicate the notification or restart debounce.
Composition is buffered, and invalid native input does not emit the previous value as a new value.
Native validity-monitor notifications do not emit either output.

For a CVA, these events originate in the callback registered with `registerOnChange`.
Call that callback to communicate a view-to-model edit; `writeValue` must not call it as feedback.
Signal controls use their selected `value` or `checked` model output; enabled input/output pairs
use the corresponding output. Repeated custom callbacks are preserved even if their payloads are
equal. The library cannot guarantee a physical user interaction: a custom control can emit from code.

These binding outputs do not participate in `value/valueChange` or `checked/checkedChange`
discovery. Avoid declaring a component output with either of these same
names on the binding host, since Angular can subscribe to both outputs.

Both outputs also expose `OutputRef<NodeValue<TNode>>` on `FormNodeBinding<TNode>` for programmatic
subscriptions. Consumers can subscribe and unsubscribe but cannot emit through that public view.

## 🔌 Binding instance {#binding-instance}

Use `#emailBinding="formNode"` in the template and `viewChild()` when component code needs the
same binding. Its methods act on that rendered control, while `node()` returns the form node.

<CodeBlock language="ts" title="email-editor.component.ts">{bindingQuerySource}</CodeBlock>


| Member | Description |
| --- | --- |
| [`formNodeChange`](#value-outputs) | Short name for the committed control-originated value output. |
| [`formNodeValueChange`](#value-outputs) | An alias of the same committed-value output. |
| [`formNodeControlValueChange`](#value-outputs) | Immediate control value output. |
| [`formNodeSubmit`](#submission-outputs) | Native submission attempt before validation policy and action. |
| [`formNodeSubmitBlocked`](#submission-outputs) | Attempt rejected by the validation policy. |
| [`node()`](#node) | Reactive reference to the node currently bound to the host. |
| [`errors()`](#errors) | Node errors visible to this binding, excluding errors owned by another concrete binding. |
| [`element`](#element) | Host `HTMLElement`. |
| [`injector`](#injector) | Injector belonging to the host element. |
| [`focus(options?)`](#focus) | Focuses this concrete native or custom control. |
| [`flush()`](#flush) | Commits pending control-originated values for the bound node. |
| [`reset()`](#reset) | Resets node interaction state and control-specific parsing state. |

`FormNodeBinding<TNode>` is the structural version of this instance type for provider callbacks and
generic configuration code.

<div className="api-member-reference">

## 🔌 Binding property reference {#binding-property-reference}

### ◆ node {#node}

**Signature:** `node: Signal<TNode>`

Returns the node currently attached to this concrete host. It updates when a dynamic binding is
reassigned.

```ts
const binding = this.emailBinding();

binding.node() === this.form.email; // true
```

### ◆ errors {#errors}

**Signature:** `errors: Signal<readonly ValidationErrorWithTargetNode<TNode>[]>`

Returns errors visible to this binding. Node errors without a concrete binding are included;
binding-specific errors belonging to another rendered control are excluded.

```ts
const firstError = this.emailBinding().errors()[0];

firstError?.targetNode === this.form.email; // true
```

This distinction matters when the same field is rendered by multiple controls and one binding has
a native parsing error.

### ◆ element {#element}

**Signature:** `element: HTMLElement`

The host DOM element carrying `[formNode]`.

```ts
this.emailBinding().element.focus();
```

Prefer `focus()` on the binding when a custom control may provide specialized focus behavior.

### ◆ injector {#injector}

**Signature:** `injector: Injector`

The Angular injector belonging to the host element. It is primarily useful to integration and
configuration infrastructure.

```ts
const locale = this.emailBinding().injector.get(LOCALE_ID);
```

## 🔌 Binding method reference {#binding-method-reference}

### ◆ focus() {#focus}

**Signature:** `focus(options?: FocusOptions): void`

Focuses the concrete binding. Native controls use `HTMLElement.focus()`; recognized custom
controls can expose their own focus channel.

```ts
this.emailBinding().focus({ preventScroll: true });
```

This differs from `node.focus()`, which selects one registered binding for a node. Calling the
binding directly targets this exact rendered control.

### ◆ flush() {#flush}

**Signature:** `flush(): void`

Immediately commits a control-originated value waiting for debounce or blur.

```ts
this.emailBinding().flush();

this.form.email(); // latest control value
```

Programmatic `set()` calls are already immediate and do not require a flush.

### ◆ reset() {#reset}

**Signature:** `reset(): void`

To restore declared values, call `binding.node().$api.resetToInitial()`; see
[Reset and restore initial values](../guides/reset-and-restore.md). The binding method itself keeps
the existing value-preserving reset behavior.

Resets node interaction state and control-specific parsing state. It also restores the rendered
control from the node when a rejected native value was being displayed.

```ts
this.emailBinding().reset();
```

</div>

## 🔌 FORM_NODE {#form_node}

[`FORM_NODE`](./form-node-token.md) is the injection token for the binding on the current host. Most application code uses
a template reference and `viewChild()` instead. Inject the token only when a directive or service
co-located with the host genuinely needs the concrete binding.

```ts
@Directive({
  selector: '[focusInvalidNode]',
  host: {
    '(click)': 'focusWhenInvalid()',
  },
})
export class FocusInvalidNode {
  private binding = inject(FORM_NODE, { self: true });

  focusWhenInvalid() {
    if (this.binding.node().$api.invalid()) this.binding.focus();
  }
}
```

Use `{ self: true }` when the directive must share the same host rather than accidentally resolving
an ancestor binding.

## 🔌 Binding lifecycle and rebinding {#binding-lifecycle-and-rebinding}

`[formNode]` may receive a computed or otherwise changing node. When it changes, the directive
disconnects the previous node, releases its binding ownership, connects the new node, and updates
`node()` reactively:

```ts
@Component({
  imports: [FormNodeDirective],
  template: `<input [formNode]="selectedField()" />`,
})
export class DynamicEditor {
  firstName = field('');
  lastName = field('');
  selectedField = signal(this.firstName);
}
```

Destroying the host removes listeners, class effects, external control errors, and its temporary
injector ownership. A node can then remain in use or bind somewhere else.

## 💡 Automatic CSS classes {#automatic-css-classes}

For the common application-wide setup, register `provideFormNodesConfig()` in the standalone
application configuration. Its predicates apply to `[formNode]` controls:

```ts
import type { ApplicationConfig } from '@angular/core';
import { provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      classes: {
        'is-invalid': binding => binding.node().$api.invalid(),
        'is-touched': binding => binding.node().$api.touched(),
      },
    }),
  ],
};
```

Each predicate tracks its own signal dependencies independently. The nearest provider applies.
Register the provider in a route, component, or NgModule instead when the configuration should
apply only to that injector subtree.

[`ANGULAR_FORMS_STATUS_CLASSES`](./angular-forms-status-classes.md) is an optional compatibility preset for applications, component
libraries, and existing styles that expect Angular Forms status classes. It maps the node's reactive
state to the following classes:

| Node state | Applied class |
| --- | --- |
| Valid | `ng-valid` |
| Invalid | `ng-invalid` |
| Async validation in progress | `ng-pending` |
| Pristine | `ng-pristine` |
| Dirty | `ng-dirty` |
| Untouched | `ng-untouched` |
| Touched | `ng-touched` |

Opposite classes are updated together as state changes. For example, a binding moves from
`ng-pristine` to `ng-dirty`; it does not retain both classes. No status classes are installed by
default, so applications that do not need Angular-compatible CSS incur no class-management work.

```ts
import type { ApplicationConfig } from '@angular/core';
import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      classes: ANGULAR_FORMS_STATUS_CLASSES,
    }),
  ],
};
```

The preset is an ordinary class map. Spread it when Angular-compatible classes and application
classes should coexist:

```ts
provideFormNodesConfig({
  classes: {
    ...ANGULAR_FORMS_STATUS_CLASSES,
    'has-visible-error': binding => binding.node().invalid() && binding.node().touched(),
  },
});
```

These classes reflect state only. Adding or removing them does not change validation, interaction
state, or submission behavior.

The binding options in `provideFormNodesConfig()` configure `[formNode]` only; its `validatorMessages` option configures node messages. Angular's `provideSignalFormsConfig()`
configures Angular `[formField]` independently, so both providers can share an injector.

## 🔌 Custom-control components {#custom-control-components}

Components exposing `value = model<T>()`, `checked = model<boolean>()`,
or a CVA are normally discovered automatically. Separate `value`/`valueChange` and
`checked`/`checkedChange` pairs are recognized too, but their value transport requires
experimental `bindInputOutputPairs: true` (including `[]` for value transport without optional state writes).

For `FormValueControl`, value binding through `model()` works without experimental options.
Full automatic state/constraint input synchronization requires experimental `syncInputs: 'all'`;
`'signal-controls'` also synchronizes all supported inputs for model controls, while excluding CVAs and paired input/output controls. Other modes select fewer inputs. Alternatively, a component can combine its value model with
[`useFormNodeState()`](./form-node-state.md) for full bound-state access and render that state itself without input writes.
Standard CVA value, touch, and disabled-state integration does not require `syncInputs`.
See [FormValueControl support and a complete example](../guides/custom-controls.md#create-a-signal-model-control).


Signal custom controls are discovered from their compiled component metadata and require no
library-specific provider. The integration intentionally applies to components: `getDebugNode()`
does not expose arbitrary directive or host-directive instances. Use a component wrapper or
`ControlValueAccessor` for those cases.

```ts
import { Component, input, model, output } from '@angular/core';
import { FormNodeDirective, field, form, type FormNodeValueControl } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-date-picker',
  template: `
    <input
      type="date"
      [value]="value() ?? ''"
      [disabled]="disabled()"
      (input)="select($any($event.target).value)"
      (blur)="touch.emit()"
    >
  `,
})
export class DatePicker implements FormNodeValueControl<string | null> {
  value = model<string | null>(null);
  disabled = input(false);
  touch = output<void>();

  select(value: string) {
    this.value.set(value || null);
  }
}

@Component({
  selector: 'app-appointment-editor',
  imports: [FormNodeDirective, DatePicker],
  template: `
    <app-date-picker [formNode]="form.date" />
    <p>Selected date: {{ form.date() ?? 'None' }}</p>
  `,
})
export class AppointmentEditor {
  form = form({
    date: field<string | null>(null),
  });
}
```

`[formNode]` initializes `value`, receives subsequent `value` changes, supplies `disabled`, and
marks the field touched when the component emits `touch`. No registration provider is required.

The related public types are:

| Type | Purpose |
| --- | --- |
| [`FormNodeValueControl<T>`](./types/form-node-value-control.md) | Signal control whose primary model is `value`. |
| [`FormNodeCheckboxControl`](./types/form-node-checkbox-control.md) | Boolean signal control whose primary model is `checked`. |
| [`FormNodeControl<T>`](./types/form-node-control.md) | Union of recognized value and checkbox control contracts. |
| `FormNodeUiControl<T>` | Common optional UI state and node-integration surface. |

These contracts are declared by Form Nodes using Angular core signal types. They keep the same
value/checked models, typed constraints, `touch` output, and `focus()`/`reset()` hooks on Angular
21 and 22; implementing Angular's version-specific `FormUiControl` is not required.

## 🔌 Pass-through wrappers {#pass-through-wrappers}

A component with a public `formNode` input can delegate the node to an inner control and is detected
automatically. A directive or host directive doing the same must install
`provideFormNodePassThrough()` so the outer `[formNode]` remains passive:

```ts
@Directive({
  providers: [provideFormNodePassThrough()],
})
export class FormNodeWrapperDirective {}
```

## Native interaction handlers {#native-interaction-handlers}

Prefer the [value outputs](#value-outputs) for value-dependent application handlers. Use a native
DOM event when you also need its event-specific information.

For native inputs, textareas, and selects, `[formNode]` processes `input`, `change`, `blur`,
and composition events before your Angular template handler for the same event. With immediate
updates, reading the node in `(input)` returns the newly parsed value; dirty state, synchronous
validation, and the parent form value are already updated. This also applies to a native textarea
with `matInput` when it uses the native binding adapter.

<CodeBlock language="ts" title="description-editor.component.ts">{nativeInputHandlerSource}</CodeBlock>

A configured debounce still delays the committed value: use `value.control()` to read the parsed
pending value. With `debounce: 'blur'`, the committed value and touched state are updated before
`(blur)` runs. IME composition keeps input buffered until composition ends. Failed parsing keeps
the last valid node value and exposes a parse error before the handler runs.

These DOM handlers do not run for programmatic node updates. Custom controls using a CVA, model,
or value/output pair retain their own value transport. For custom output ordering, see
[Reading node state inside output handlers](../guides/custom-controls.md#output-handler-order). Native value listeners
are active only for the native adapter on `input`, `textarea`, and `select`; custom component
outputs named `input`, `change`, or `blur` do not become native value or touch callbacks.
Importing `FormNodeDirective` alone remains sufficient.

## 📨 Native form submission {#native-form-submission}

Use `FormNodeDirective` as the single root binding. Its controls may use either `[formNode]` or Angular's
`[formField]` adapter:

```ts
import { Component } from '@angular/core';
import { FormNodeDirective, field, form } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <form [formNode]="form">
      <input [formNode]="form.email" />
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>
  `,
})
export class EmailEditor {
  form = form({
    email: field(''),
  }, {
    onSubmit: value => save(value),
  });
}
```

On a native `<form>`, the directive prevents native navigation and applies `novalidate`. A bound
`form()` delegates submit to `form.submit()`. A bound `group()` is also accepted: submit marks and
flushes its tree without running an action. Native reset delegates to either node's `reset()`.
Fields and arrays remain invalid native-form roots.
Do not combine `[formNode]` with Angular's separate form-root directive on the same element.

See [Control binding](../guides/control-binding.md), [Custom controls](../guides/custom-controls.md),
and [Form submission](../guides/submission.md).


## 🧪 Custom-control input synchronization (experimental) {#custom-control-input-synchronization}

Optional custom-control input synchronization is experimental and disabled by default.
Use `syncInputs: 'declared'` for initial declarations or `'all'` for all supported state inputs.
Use `provideFormNodesConfig({ syncInputs: false })` when your component or template
should own inputs such as `disabled`, `readonly`, or `name`; value/checked bindings keep working.
Native controls and CVA `setDisabledState()` remain connected.
See [the simple example](../guides/custom-controls.md#keep-control-of-your-components-inputs)
and [all configuration details](./provide-form-nodes-config.md#custom-control-inputs).


## 🔌 Direct NgControl accessors {#direct-ngcontrol-accessors}

Hooks that assign `inject(NgControl).valueAccessor` during component construction work with
`[formNode]` without an `NG_VALUE_ACCESSOR` provider. The direct accessor takes precedence;
value/change and touched callbacks follow rebinding and stop changing nodes after destruction.
See [the complete example and compatibility boundaries](../guides/custom-controls-advanced.md#hooks-that-assign-ngcontrolvalueaccessor).

## Submission outputs {#submission-outputs}

### `formNodeSubmit`

Signature: `OutputRef<FormNodeSubmitEvent<TNode>>`.

Emits every native submission attempt on `<form [formNode]="form">` when the node was declared
with `form()`. The handler sees `submitted() === true` and exposed values after pending input is
flushed. Interactive descendants are marked touched on a new attempt. The notification precedes
the `submitWhen` gate and declared `onSubmit` action, so it also fires for invalid forms and forms
without an action. It is an attempt notification, not a successful-save event.

### `formNodeSubmitBlocked`

Signature: `OutputRef<FormNodeSubmitEvent<TNode>>`.

Emits after `formNodeSubmit` when `submitWhen` rejects the attempt: `'not-invalid'` rejects invalid
forms, `'valid'` also rejects pending validation, and `'always'` never rejects for validation.
Validation is not awaited. Unlike the declaration's `onSubmitBlocked`, this template notification
also works without a declared `onSubmit`. When both exist, the output precedes the callback.
Concurrent attempts still emit `formNodeSubmit`, but neither run the action again nor emit
`formNodeSubmitBlocked`. Concurrency is not a validation failure.

### Payload and lifecycle

Both outputs receive `{ value, form, event }`, exported as `FormNodeSubmitEvent<TNode>`:

- `value`: the exposed value snapshot captured after flushing, respecting custom equality.
- `form`: the bound form node; `$api` gives collision-safe access to its state and operations.
- `event`: the original native `Event`; narrow to `SubmitEvent` to access `submitter`.

The outputs do not form a two-way binding pair with `[formNode]`. Calling `form.submit()` directly
does not emit them. They do not emit from group bindings or non-form control hosts. Native submit
prevents browser navigation; this includes synthetic submit events, not just physical user actions.

Async template handlers are not awaited and do not hold `submitting()` active. Put asynchronous
saving in the declaration's `onSubmit` to use its validation gate and concurrency management.
Avoid saving in both places. A synchronous attempt listener may change values or validation before
the gate is evaluated; the payload remains the snapshot captured before that listener. Calling
`submit()` again from a listener does not start a second action. A reset in the declared action
runs after the attempt notification, and can clear `submitted()` normally.

See the [submission example](#template-submission-events) for both attempt and blocked handlers.

See [custom control contracts](./custom-control-contracts.md) to choose a component or binding type, and [Public types](./types/index.md) for individual declarations.


## Native file values {#native-file-values}

`<input type="file" [formNode]="upload.file">` binds to a `field<File>(null)`;
adding `multiple` binds to a `field<File[]>([])`. Empty user selections produce `null` and `[]`
respectively. Read filenames reactively with `upload.file()?.name`.

Selection participates in normal validation, interaction, debounce, and output semantics.
Programmatic values and resets synchronize `input.files`; strings cannot select local paths.
Populated programmatic selections require browser `DataTransfer` support. Selecting a file does
not upload it. See [File inputs](../guides/control-binding.md#file-inputs) for complete examples,
reset semantics, and `FormData` payloads.
