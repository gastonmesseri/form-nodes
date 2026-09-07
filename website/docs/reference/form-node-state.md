---
title: useFormNodeState()
---

import CodeBlock from '@theme/CodeBlock';
import formNodeStateComponentSource from '!!raw-loader!../../examples/form-node-state-component.typecheck.ts';
import formNodeSource from '!!raw-loader!../../examples/form-node-state-form-node.typecheck.ts';
import formFieldSource from '!!raw-loader!../../examples/form-node-state-form-field.typecheck.ts';
import formControlSource from '!!raw-loader!../../examples/form-node-state-form-control.typecheck.ts';
import formControlNameSource from '!!raw-loader!../../examples/form-node-state-form-control-name.typecheck.ts';
import ngModelSource from '!!raw-loader!../../examples/form-node-state-ng-model.typecheck.ts';

# useFormNodeState()

`useFormNodeState()` gives a custom-control component one stable, signal-based view of the
form binding attached to its host.

:::tip One state implementation for every supported binding

**Supports `[formNode]`, `[formField]`, `[formControl]`, `[formControlName]`, and `[(ngModel)]`.**

**Implement your custom control's state UI once, regardless of which supported binding the caller uses.**
The hook automatically selects the binding on the component host. Read the same `disabled()`,
`touched()`, `dirty()`, `pending()`, and `errors()` signals, and call the same `markAsTouched()` method.
This makes it a reusable way to implement state in custom controls shared across Form Nodes,
Angular Signal Forms, Reactive Forms, and template-driven forms. Angular forms do not need to
use Form Nodes primitives.

Keep the value contract required by each forms API, such as a model or `ControlValueAccessor`.
State metadata depends on the source: Reactive Forms and `ngModel` expose common control state,
but required and constraint metadata use neutral defaults in this hook.

:::

:::info Optional convenience utility

Using `useFormNodeState()` is not required to create or bind a custom control. Value integration
continues to work through a signal `model()`, `FormValueControl`, or `ControlValueAccessor` without
this hook.

Use it when the component also needs convenient, source-neutral access to control state such as
`required`, `disabled`, `errors`, `touched`, or validation constraints. It avoids creating separate
state inputs or adapters for each supported forms API, but it does not participate in value binding
and does not replace the control's existing value contract.

:::

### FormValueControl without experimental input writes

Combine `value = model()` with `useFormNodeState()` to implement `FormValueControl` with value
binding and full access to the state exposed by a bound Form Nodes node. Keep `syncInputs` off:
the model carries values through public APIs, and the component reads state signals and applies
them to its own view. Use `markAsTouched()` to report blur. For checkboxes, use `checked = model()`.

Experimental `syncInputs` is needed only if you want `[formNode]` to automatically populate
optional state and constraint input properties. The hook does not populate those properties.
See the [complete component example and support comparison](../guides/custom-controls.md#create-a-signal-model-control).

:::tip Signal-based by design

`useFormNodeState()` is designed for modern signal-based Angular components. Call the hook once as
a component field; every state member it returns—such as `required`, `disabled`, `errors`, and
`touched`—is an Angular `Signal`.

Read those signals directly in the template or compose them with `computed()` and `effect()`.
Angular tracks the dependencies and updates an `OnPush` component without manual subscriptions or
`ChangeDetectorRef` calls.

```ts
formNodeState = useFormNodeState();

showErrors = computed(() =>
  this.formNodeState.touched() && this.formNodeState.invalid()
);
```

:::

Call it in the component's injection context. This custom input derives its required mark, native
state, accessibility attributes, and error list from whichever supported form API binds it.
`shouldDisplayRequiredAsterisk` and `isDisabled` reflect the bound state, while `visibleErrors`
shows validation errors only after the control is touched:

<CodeBlock language="ts" metastring="{10,18-21,23,26,28,38,40-46}">{formNodeStateComponentSource}</CodeBlock>

No provider or adapter selection is required.

## API map

| I want to… | Start with | Details |
| --- | --- | --- |
| Create the state facade | `useFormNodeState<TValue>()` | [Signature](#signature) |
| Support a binding API | Host binding | [Component integration styles](#component-integration-styles) |
| Identify the active binding | `connected()`, `source()` | [Connection properties](#connection-properties) |
| Read value or validation | `value()`, `errors()`, `invalid()`, `pending()` | [Value and validation properties](#value-and-validation-properties) |
| Mirror UI state | `disabled()`, `readonly()`, `hidden()`, `required()` | [Interaction and availability properties](#interaction-and-availability-properties) |
| Apply native constraints | `min()`, `max()`, lengths, `pattern()` | [Constraint properties](#constraint-properties) |
| Report blur interaction | `markAsTouched()` | [Method reference](#method-reference) |
| Understand source selection | Adapter priority | [Selection and lifecycle](#selection-and-lifecycle) |

## Signature

```ts
useFormNodeState<TValue = unknown>(): ControlState<TValue>;
```

The hook has no arguments or configuration object. `TValue` affects only the type returned by
`value()`; it does not select an adapter or change runtime behavior.

```ts
formNodeState = useFormNodeState<string | null>();

this.formNodeState.value(); // string | null | undefined
```

The additional `undefined` represents the disconnected state. Without a generic, `value()` is
`unknown`, while every state and constraint signal remains fully typed.

## Component integration styles

A signal custom control declares a `model()` and can optionally implement Angular's
`FormValueControl` interface. This is the natural shape for `formNode` and required by
`formField`:

```ts
export class DatePicker implements FormValueControl<string | null> {
  value = model<string | null>(null);

  formNodeState = useFormNodeState();
}
```

A `ControlValueAccessor` continues to own its normal value callbacks. `useFormNodeState()` adds
the source-neutral state signals; it does not replace `writeValue()` or the registered callbacks:

```ts {2}
export class DatePicker implements ControlValueAccessor {
  formNodeState = useFormNodeState();

  writeValue(value: string | null) { /* update the view */ }
  registerOnChange(callback: (value: string | null) => void) { /* retain callback */ }
  registerOnTouched(callback: () => void) { /* retain callback */ }
}
```

The generic is optional and only narrows the type returned by `value()`. Omit it when the
component only consumes state such as `required()`, `disabled()`, or `errors()`; specify it when
the component needs a typed bound value.

## Bind with formNode

`formNode` supports signal controls and CVAs. This reusable text input reads `required()` to show an
asterisk in its label and mirrors the same state to the native input. The component does not need a
separate `required` input:

<CodeBlock language="ts" metastring="{12,17-18,20,30}">{formNodeSource}</CodeBlock>

The adapter supplies the complete Form Nodes node state, including disabled reasons, visibility,
readonly state, constraints, and normalized errors.

## Bind with formField

Angular's `formField` binding expects a Signal Forms-compatible control such as
`FormValueControl`. This date control waits until it is touched, then reads `invalid()` and
`errors()` to render its own accessible error list. The parent creates an Angular Signal Forms
model; `useFormNodeState()` observes its state without converting it into Form Nodes:

<CodeBlock language="ts" metastring="{13,15,17,19,29}">{formFieldSource}</CodeBlock>

This source supplies Angular Signal Forms state, including constraints and disabled reasons,
through the same `ControlState` signals.

## Practical state patterns

Use the state signals to make the component adapt to whichever form owns it:

```html {1,6-9}
@if (formNodeState.required()) {
  <span aria-hidden="true">*</span>
}

<input
  [disabled]="formNodeState.disabled()"
  [readonly]="formNodeState.readonly()"
  [attr.aria-invalid]="formNodeState.invalid()"
  (blur)="formNodeState.markAsTouched()"
/>
```

Render validation feedback after interaction rather than coupling the component to one validation
engine:

```html {1,3}
@if (formNodeState.touched() && formNodeState.invalid()) {
  <ul aria-live="polite">
    @for (error of formNodeState.errors(); track $index) {
      <li>{{ errorMessage(error) }}</li>
    }
  </ul>
}
```

Applications remain responsible for translating a normalized error `kind` into their preferred
copy. The component can use a local mapper, an injected message service, or a translated message
already present on the error.

## Bind with formControl

Reactive Forms custom controls use `ControlValueAccessor`. The hook observes the same-host
`FormControlDirective` without changing the CVA value protocol:

<CodeBlock language="ts" metastring="{11,14,23,33}">{formControlSource}</CodeBlock>

## Bind with formControlName

Inside a reactive `FormGroup`, the component remains a normal CVA. The adapter additionally exposes
`name()` as `'birthDate'`:

<CodeBlock language="ts" metastring="{14,23,32}">{formControlNameSource}</CodeBlock>

## Bind with ngModel

Template-driven forms also use the CVA protocol. A named `ngModel` binding makes its declared name
available through `name()`:

<CodeBlock language="ts" metastring="{11,14,23}">{ngModelSource}</CodeBlock>

## State signals

Every state member is a signal and is safe to read while disconnected.

| Signal | Disconnected default | Meaning |
| --- | --- | --- |
| [`connected()`](#form-node-state-connected) | `false` | Whether a supported binding is attached. |
| [`source()`](#form-node-state-source) | `null` | Active binding API. |
| [`value()`](#form-node-state-value) | `undefined` | Current committed bound value. |
| [`disabled()`](#form-node-state-disabled) | `false` | Whether interaction is disabled. |
| [`disabledReasons()`](#form-node-state-disabledreasons) | `[]` | Source-neutral `{ message?: string }` reasons. |
| [`dirty()`](#form-node-state-dirty) | `false` | Whether the bound control changed through interaction. |
| [`errors()`](#form-node-state-errors) | `[]` | Source-neutral `{ kind: string; ... }` errors. |
| [`hidden()`](#form-node-state-hidden) | `false` | Whether form state hides the control. |
| [`invalid()`](#form-node-state-invalid) | `false` | Whether validation currently fails. |
| [`pending()`](#form-node-state-pending) | `false` | Whether asynchronous validation is pending. |
| [`touched()`](#form-node-state-touched) | `false` | Whether the user interacted with and left the control. |
| [`readonly()`](#form-node-state-readonly) | `false` | Whether editing is disallowed without disabling interaction. |
| [`required()`](#form-node-state-required) | `false` | Whether a non-empty value is required. |
| [`min()`](#form-node-state-min), [`max()`](#form-node-state-max) | `undefined` | Effective numeric or date limits. |
| [`minLength()`](#form-node-state-minlength), [`maxLength()`](#form-node-state-maxlength) | `undefined` | Effective length limits. |
| [`pattern()`](#form-node-state-pattern) | `[]` | Effective regular-expression constraints. |
| [`name()`](#form-node-state-name) | `undefined` | Generated or declared control name when available. |

`formNode` and `formField` can supply their richer state models. `formControl`, `formControlName`,
and `ngModel` supply the state available from `AbstractControl`; unsupported properties retain the
defaults above. `formControlName` and named `ngModel` bindings expose their directive name.

<div className="api-member-reference">

## Property reference

### Connection properties

#### connected {#form-node-state-connected}

**Signature:** `connected: Signal<boolean>`

Reports whether a supported binding currently owns the component host.

```ts
if (this.formNodeState.connected()) setupFormOnlyBehavior();
```

#### source {#form-node-state-source}

**Signature:** `source: Signal<ControlStateSource | null>`

Identifies the selected adapter as `'formNode'`, `'formField'`, `'formControl'`,
`'formControlName'`, or `'ngModel'`; returns `null` while disconnected.

```ts
this.formNodeState.source(); // 'formNode'
```

### Value and validation properties

#### value {#form-node-state-value}

**Signature:** `value: Signal<TValue | undefined>`

Reads the committed bound value. User-authored changes still travel through `model()` or the CVA
callbacks; this signal is readonly.

With `[formNode]`, it observes the latest internally committed node value even when `equal` retains
an older public value. For example, the node can still expose `'Marco'` while this form-node-state
signal reports a committed `'MARCO'`. Pending debounce input is separate: the component's `model()`
shows that input immediately, while `formNodeState.value()` changes when it commits. Reset restores
the latest internally committed value. Validation and errors continue following the node's public
validation rules.

The `[formField]` adapter reads Angular's committed field value, and Reactive Forms and `ngModel`
adapters read their own control values.

```ts
preview = computed(() => this.formNodeState.value() ?? 'No value');
```

#### errors {#form-node-state-errors}

**Signature:** `errors: Signal<readonly ControlStateError[]>`

Returns source-neutral errors with a required `kind`.

```ts
requiredError = computed(() =>
  this.formNodeState.errors().find(error => error.kind === 'required'),
);
```

#### invalid {#form-node-state-invalid}

**Signature:** `invalid: Signal<boolean>`

Reports whether validation currently fails.

```ts
showErrors = computed(() => this.formNodeState.touched() && this.formNodeState.invalid());
```

#### pending {#form-node-state-pending}

**Signature:** `pending: Signal<boolean>`

Reports unresolved asynchronous validation.

```ts
statusText = computed(() => this.formNodeState.pending() ? 'Checking…' : 'Ready');
```

### Interaction and availability properties

#### disabled {#form-node-state-disabled}

**Signature:** `disabled: Signal<boolean>`

Reports whether user interaction is disabled.

```html
<input [disabled]="formNodeState.disabled()" />
```

#### disabledReasons {#form-node-state-disabledreasons}

**Signature:** `disabledReasons: Signal<readonly ControlStateDisabledReason[]>`

Returns normalized reasons when the active API exposes them.

```ts
disabledMessage = computed(() => this.formNodeState.disabledReasons()[0]?.message);
```

#### dirty {#form-node-state-dirty}

**Signature:** `dirty: Signal<boolean>`

Reports whether user interaction changed the bound control.

```ts
hasUnsavedChange = computed(() => this.formNodeState.dirty());
```

#### hidden {#form-node-state-hidden}

**Signature:** `hidden: Signal<boolean>`

Reports form-owned visibility state. APIs without hidden state return `false`.

```html
@if (!formNodeState.hidden()) {
  <input [value]="value()" />
}
```

#### readonly {#form-node-state-readonly}

**Signature:** `readonly: Signal<boolean>`

Reports whether editing should be prevented without disabling interaction.

```html
<input [readonly]="formNodeState.readonly()" />
```

#### required {#form-node-state-required}

**Signature:** `required: Signal<boolean>`

Reports whether the effective validation rules require a non-empty value.

```html
@if (formNodeState.required()) {
  <span aria-hidden="true">*</span>
}
```

#### touched {#form-node-state-touched}

**Signature:** `touched: Signal<boolean>`

Reports whether the user interacted with and left the control.

```html
@if (formNodeState.touched() && formNodeState.invalid()) {
  <p>Please correct this value.</p>
}
```

### Constraint properties

#### min {#form-node-state-min}

**Signature:** `min: Signal<number | Date | undefined>`

Returns the effective minimum numeric or date constraint.

```ts
const minimum = this.formNodeState.min();
```

#### max {#form-node-state-max}

**Signature:** `max: Signal<number | Date | undefined>`

Returns the effective maximum numeric or date constraint.

```ts
const maximum = this.formNodeState.max();
```

#### minLength {#form-node-state-minlength}

**Signature:** `minLength: Signal<number | undefined>`

Returns the effective minimum-length constraint.

```html
<input [attr.minlength]="formNodeState.minLength()" />
```

#### maxLength {#form-node-state-maxlength}

**Signature:** `maxLength: Signal<number | undefined>`

Returns the effective maximum-length constraint.

```html
<input [attr.maxlength]="formNodeState.maxLength()" />
```

#### pattern {#form-node-state-pattern}

**Signature:** `pattern: Signal<readonly RegExp[]>`

Returns every effective regular-expression constraint.

```ts
accepts = computed(() =>
  this.formNodeState.pattern().every(pattern => pattern.test(this.previewValue())),
);
```

#### name {#form-node-state-name}

**Signature:** `name: Signal<string | undefined>`

Returns a generated or declared control name when the active binding exposes one.

```html
<input [attr.name]="formNodeState.name()" />
```

## Method reference

### markAsTouched()

**Signature:** `markAsTouched(): void`

Reports a touched interaction to the active binding and safely does nothing while disconnected.

```html
<input (blur)="formNodeState.markAsTouched()" />
```

</div>

## Normalized errors and disabled reasons

Errors always contain a `kind`, independently of their source:

```ts
formNodeState.errors();
// [{ kind: 'required' }, { kind: 'server', message: 'Unavailable' }]
```

Angular Reactive Forms object payloads are spread alongside their key. Boolean `true` becomes only
`{ kind }`, while a primitive payload is available as `value`. Source-owned references such as a
Form Nodes node or Angular `FieldTree` are not exposed.

Disabled reasons use `{ message?: string }`. An unnamed active reason is preserved as `{}` rather
than filtered out, so only `[]` means that no reason is known. APIs based on `AbstractControl` do
not expose individual reasons and therefore use `[]` even when `disabled()` is true.

## Report a blur interaction

Call `markAsTouched()` when the custom control loses focus:

```ts
markAsTouched() {
  this.formNodeState.markAsTouched();
}
```

It delegates to the active forms API and is a safe no-op while disconnected.

## Ownership boundary

The facade reads bound state and reports the touched interaction; it is not a second form-control
API. Send user-authored values through `model()`, `FormValueControl`, or `ControlValueAccessor`.
Programmatic writes, reset, availability, and validation remain owned by the forms API that created
the binding. `ControlState` intentionally has no `setValue()`, `reset()`, `disable()`, or `enable()`.

## Selection and lifecycle

If more than one supported source can be observed, selection is deterministic:

1. `formNode`
2. `formField`
3. `formControl`
4. `formControlName`
5. `ngModel`

Reactive Forms and `ngModel` changes normally arrive through `AbstractControl.events`. A replaced
control is detected after rendering, with the old subscription removed. Changes made with
`{ emitEvent: false }` become visible on the next render.

During server rendering, render-discovered Angular adapters safely expose disconnected defaults
and connect during the first browser render. `formNode` can connect synchronously through its host
registry. Always use `connected()` when behavior depends on an active source.

## Public types

| Type | Purpose |
| --- | --- |
| `ControlState<TValue>` | Complete facade returned by `useFormNodeState<TValue>()`. |
| `ControlStateSource` | Union of supported source names. |
| `ControlStateError` | Normalized error with a required `kind`. |
| `ControlStateDisabledReason` | Normalized disabled reason with an optional `message`. |

## Related guides and reference

- [Custom controls](../guides/custom-controls.md)
- [`FormNode` binding API](./form-node-binding.md)
- [Control binding](../guides/control-binding.md)
- [API overview](./api-overview.md)
