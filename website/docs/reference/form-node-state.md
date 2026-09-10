---
title: useFormNodeState()
---

import CodeBlock from '@theme/CodeBlock';
import controlErrorsSource from '!!raw-loader!../../examples/form-node-state-errors.typecheck.ts';
import validatorQueriesSource from '!!raw-loader!../../examples/form-node-state-validator-queries.typecheck.ts';
import constraintSource from '!!raw-loader!../../examples/form-node-state-constraints.typecheck.ts';
import formNodeStateComponentSource from '!!raw-loader!../../examples/form-node-state-component.typecheck.ts';
import formNodeSource from '!!raw-loader!../../examples/form-node-state-form-node.typecheck.ts';
import formFieldSource from '!!raw-loader!../../examples/form-node-state-form-field.typecheck.ts';
import formControlSource from '!!raw-loader!../../examples/form-node-state-form-control.typecheck.ts';
import formControlNameSource from '!!raw-loader!../../examples/form-node-state-form-control-name.typecheck.ts';
import ngModelSource from '!!raw-loader!../../examples/form-node-state-ng-model.typecheck.ts';

# useFormNodeState() {#useformnodestate}

`useFormNodeState()` gives a custom-control component one stable, signal-based view of the
form binding attached to its host. With `[formNodeValue]`, it observes the automatically created
field, or the explicit `[formNode]` when both are supplied. Error contributions and cleanup use
the same lifecycle in either mode.

:::tip One state implementation for every supported binding

**Supports [`[formNode]`](./form-node-binding.md), `[formField]`, `[formControl]`, `[formControlName]`, and `[(ngModel)]`.**

**Implement your custom control's state UI once, regardless of which supported binding the caller uses.**
The hook automatically selects the binding on the component host. Read the same `disabled()`,
`touched()`, `dirty()`, `pending()`, and `errors()` signals, and call the same `markAsTouched()` method.
This makes it a reusable way to implement state in custom controls shared across Form Nodes,
Angular Signal Forms, Reactive Forms, and template-driven forms. Angular forms do not need to
use Form Nodes primitives.

Keep the value contract required by each forms API, such as a model or `ControlValueAccessor`.
State metadata depends on the source: Reactive Forms and `ngModel` expose common control state,
including required-rule detection and constraints declared through standard Angular validator
directives. Constraints hidden inside validator functions cannot be inferred.

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

### ◆ FormValueControl without experimental input writes {#formvaluecontrol-without-experimental-input-writes}

Combine `value = model()` with `useFormNodeState()` to implement `FormValueControl` with value
binding and full access to the state exposed by a bound Form Nodes node. Keep `syncInputs` off:
the model carries values through public APIs, and the component reads state signals and applies
them to its own view. Use `markAsTouched()` to report blur. For checkboxes, use `checked = model()`.

Experimental `syncInputs` is needed only if you want `[formNode]` to automatically populate
optional state and constraint input properties. The hook does not populate those properties.
See the [complete component example and support comparison](../guides/custom-controls.md#create-a-signal-model-control).

:::tip Signal-based by design

`useFormNodeState()` is designed for modern signal-based Angular components. Call the hook once as
a component field; its control state properties—such as `required`, `disabled`, `errors`, and
`touched`—are Angular signals. The `form` property groups the nearest form's state signals.

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

## 🧭 API map {#api-map}

| I want to… | Start with | Details |
| --- | --- | --- |
| Create the state facade | `useFormNodeState<TValue>(options?)` | [Signature](#signature) |
| Contribute component errors | `useFormNodeState({ errors })` | [Error contributions](#contribute-errors) |
| Enable Signal Forms CVA errors | `provideFormNodeStateErrors()` | [Error contributions](#contribute-errors) |
| Support a binding API | Host binding | [Component integration styles](#component-integration-styles) |
| Read form submission history | `formSubmitted()` or `form.submitted()` | [Nearest form state](#nearest-form-state) |
| Identify the active binding | `connected()`, `source()` | [Connection properties](#connection-properties) |
| Read value or validation | `value()`, `errors()`, `invalid()`, `pending()` | [Value and validation properties](#value-and-validation-properties) |
| Mirror UI state | `disabled()`, `readonly()`, `hidden()`, `required()` | [Interaction and availability properties](#interaction-and-availability-properties) |
| Apply native constraints | `min()`, `max()`, lengths, `pattern()` | [Constraint properties](#constraint-properties) |
| Check or inspect an error | `hasError(kind)`, `getError(kind)` | [Error queries](#haserrorkind) |
| Inspect a validator or known rule | `hasValidator(validator)` | [Validator queries](#hasvalidatorvalidator) |
| Report blur interaction | `markAsTouched()` | [Method reference](#method-reference) |
| Understand source selection | Adapter priority | [Selection and lifecycle](#selection-and-lifecycle) |

## 📐 Signature {#signature}

```ts
useFormNodeState<TValue = unknown>(options?: FormNodeStateOptions): ControlState<TValue>;
```

The hook has no arguments or configuration object. `TValue` affects only the type returned by
`value()`; it does not select an adapter or change runtime behavior.

```ts
formNodeState = useFormNodeState<string | null>();

this.formNodeState.value(); // string | null | undefined
```

The additional `undefined` represents the disconnected state. Without a generic, `value()` is
`unknown`, while every state and constraint signal remains fully typed.

## 💡 Component integration styles {#component-integration-styles}

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

## 🔌 Bind with formNode {#bind-with-formnode}

`formNode` supports signal controls and CVAs. This reusable text input reads `required()` to show an
asterisk in its label and mirrors the same state to the native input. The component does not need a
separate `required` input:

<CodeBlock language="ts" metastring="{12,17-18,20,30}">{formNodeSource}</CodeBlock>

The adapter supplies the complete Form Nodes node state, including disabled reasons, visibility,
readonly state, constraints, and normalized errors.

## 🔌 Bind with formField {#bind-with-formfield}

Angular's `formField` binding expects a Signal Forms-compatible control such as
`FormValueControl`. This date control waits until it is touched, then reads `invalid()` and
`errors()` to render its own accessible error list. The parent creates an Angular Signal Forms
model; `useFormNodeState()` observes its state without converting it into Form Nodes:

<CodeBlock language="ts" metastring="{13,15,17,19,29}">{formFieldSource}</CodeBlock>

This source supplies Angular Signal Forms state, including constraints and disabled reasons,
through the same [`ControlState`](./types/control-state.md) signals.

## ✅ Practical state patterns {#practical-state-patterns}

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

## 🔌 Bind with formControl {#bind-with-formcontrol}

Reactive Forms custom controls use `ControlValueAccessor`. The hook observes the same-host
`FormControlDirective` without changing the CVA value protocol:

<CodeBlock language="ts" metastring="{11,14,23,33}">{formControlSource}</CodeBlock>

## 🔌 Bind with formControlName {#bind-with-formcontrolname}

Inside a reactive `FormGroup`, the component remains a normal CVA. The adapter additionally exposes
`name()` as `'birthDate'`:

<CodeBlock language="ts" metastring="{14,23,32}">{formControlNameSource}</CodeBlock>

## 🔌 Bind with ngModel {#bind-with-ngmodel}

Template-driven forms also use the CVA protocol. A named `ngModel` binding makes its declared name
available through `name()`:

<CodeBlock language="ts" metastring="{11,14,23}">{ngModelSource}</CodeBlock>

## ⚡ State signals {#state-signals}

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

## 📖 Property reference {#property-reference}

### ◆ Connection properties {#connection-properties}

#### – connected {#form-node-state-connected}

**Signature:** `connected: Signal<boolean>`

Reports whether a supported binding currently owns the component host.

```ts
if (this.formNodeState.connected()) setupFormOnlyBehavior();
```

#### – source {#form-node-state-source}

**Signature:** `source: Signal<ControlStateSource | null>`

Identifies the selected adapter as `'formNode'`, `'formField'`, `'formControl'`,
`'formControlName'`, or `'ngModel'`; returns `null` while disconnected.

```ts
this.formNodeState.source(); // 'formNode'
```

### ◆ Value and validation properties {#value-and-validation-properties}

#### – value {#form-node-state-value}

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

#### – errors {#form-node-state-errors}

**Signature:** `errors: Signal<readonly ControlStateError[]>`

Returns source-neutral errors with a required `kind`.

```ts
requiredError = computed(() =>
  this.formNodeState.errors().find(error => error.kind === 'required'),
);
```

#### – invalid {#form-node-state-invalid}

**Signature:** `invalid: Signal<boolean>`

Reports whether validation currently fails.

```ts
showErrors = computed(() => this.formNodeState.touched() && this.formNodeState.invalid());
```

#### – pending {#form-node-state-pending}

**Signature:** `pending: Signal<boolean>`

Reports unresolved asynchronous validation.

```ts
statusText = computed(() => this.formNodeState.pending() ? 'Checking…' : 'Ready');
```

### ◆ Interaction and availability properties {#interaction-and-availability-properties}

#### – disabled {#form-node-state-disabled}

**Signature:** `disabled: Signal<boolean>`

Reports whether user interaction is disabled.

```html
<input [disabled]="formNodeState.disabled()" />
```

#### – disabledReasons {#form-node-state-disabledreasons}

**Signature:** `disabledReasons: Signal<readonly ControlStateDisabledReason[]>`

Returns normalized reasons when the active API exposes them.

```ts
disabledMessage = computed(() => this.formNodeState.disabledReasons()[0]?.message);
```

#### – dirty {#form-node-state-dirty}

**Signature:** `dirty: Signal<boolean>`

Reports whether user interaction changed the bound control.

```ts
hasUnsavedChange = computed(() => this.formNodeState.dirty());
```

#### – hidden {#form-node-state-hidden}

**Signature:** `hidden: Signal<boolean>`

Reports form-owned visibility state. APIs without hidden state return `false`.

```html
@if (!formNodeState.hidden()) {
  <input [value]="value()" />
}
```

#### – readonly {#form-node-state-readonly}

**Signature:** `readonly: Signal<boolean>`

Reports whether editing should be prevented without disabling interaction.

```html
<input [readonly]="formNodeState.readonly()" />
```

#### – required {#form-node-state-required}

**Signature:** `required: Signal<boolean>`

Returns true when a required rule is detected **or the bound control currently has an own error
whose normalized `kind` is exactly `'required'`**.

**Works with every supported binding, including Angular Reactive Forms and `[(ngModel)]`.**

- `[formNode]` reads the node's required metadata; `[formField]` reads Angular Signal Forms state.
- `[formControl]`, `[formControlName]`, and `[(ngModel)]` recognize a directly registered
  `Validators.required` / `Validators.requiredTrue` or an active Angular `required` / `[required]` validator directive on the
  same host. An empty `required` attribute enables it; `[required]="false"` disables the directive.

A detected required rule keeps the flag true when the value satisfies it and while the control is disabled. Removing
one required source leaves it true if another remains active. Call `updateValueAndValidity()` after
changing Angular validators as usual. Normal control events update the hook; silent changes
(`emitEvent: false`) and directive input changes are reconciled after the next render.

The error fallback works with every supported binding, including custom, composed, asynchronous,
and manually assigned errors. It reads only the existing own errors, not descendant errors.
For Angular error maps, the `required` key counts regardless of its payload, consistently with
`hasError('required')`. When that error disappears, the flag becomes false unless a required rule
is also detected. This means an error-only indicator can disappear once the value is valid.

The hook does not execute validators to discover rules. Wrapped or composed validators are not inspected. Direct `Validators.requiredTrue` registration
also counts as required, so an acceptance checkbox can display the same indicator. Angular's checkbox required directive is recognized through its public
`RequiredValidator` contract. A disconnected hook returns false.

```html
@if (formNodeState.required()) {
  <span aria-hidden="true">*</span>
}
```

#### – touched {#form-node-state-touched}

**Signature:** `touched: Signal<boolean>`

Reports whether the user interacted with and left the control.

```html
@if (formNodeState.touched() && formNodeState.invalid()) {
  <p>Please correct this value.</p>
}
```

### ◆ Constraint properties {#constraint-properties}

**Reactive Forms and `ngModel` expose constraints from standard Angular validator directives on
the same host**, even when the current value is valid. No experimental configuration is needed.

| State signal | Angular directive input |
| --- | --- |
| `min()` / `max()` | `min` / `max` on `input[type=number]` hosts |
| `minLength()` / `maxLength()` | `minlength` / `maxlength` |
| `pattern()` | `pattern` |

Angular's numeric directive selectors require an actual number-input host; adding `min` or `max`
to an arbitrary custom-component tag does not install those directives. Length and pattern
selectors support custom-control hosts directly. Import `ReactiveFormsModule` or `FormsModule`
in the template that declares the binding and validators.

Directive input changes are reconciled after rendering. Absent or invalid numeric bounds return
`undefined`; zero remains a valid bound. Numeric strings use Angular's parsing rules. An empty
pattern produces `[]`; string patterns receive missing `^` / `$` anchors, while `RegExp` objects
retain their identity and flags. If multiple directives contribute, lower bounds use the largest
value, upper bounds the smallest, and all patterns are retained. Disabled controls retain declared
constraints; disconnected controls return neutral values.

Functions such as `Validators.min(3)` and `Validators.minLength(2)` do not expose their parameters
publicly. The hook does not execute validators or inspect private fields to discover them.

This reusable control reads required and length metadata from its caller's Reactive Forms binding.
Comments identify the suggested files; imports are shared by this combined example.

<CodeBlock language="ts" title="Custom control and Reactive Forms editor">{constraintSource}</CodeBlock>

#### – min {#form-node-state-min}

**Signature:** `min: Signal<number | Date | undefined>`

Returns the effective minimum numeric or date constraint.

```ts
const minimum = this.formNodeState.min();
```

#### – max {#form-node-state-max}

**Signature:** `max: Signal<number | Date | undefined>`

Returns the effective maximum numeric or date constraint.

```ts
const maximum = this.formNodeState.max();
```

#### – minLength {#form-node-state-minlength}

**Signature:** `minLength: Signal<number | undefined>`

Returns the effective minimum-length constraint.

```html
<input [attr.minlength]="formNodeState.minLength()" />
```

#### – maxLength {#form-node-state-maxlength}

**Signature:** `maxLength: Signal<number | undefined>`

Returns the effective maximum-length constraint.

```html
<input [attr.maxlength]="formNodeState.maxLength()" />
```

#### – pattern {#form-node-state-pattern}

**Signature:** `pattern: Signal<readonly RegExp[]>`

Returns every effective regular-expression constraint.

```ts
accepts = computed(() =>
  this.formNodeState.pattern().every(pattern => pattern.test(this.previewValue())),
);
```

#### – name {#form-node-state-name}

**Signature:** `name: Signal<string | undefined>`

Returns a generated or declared control name when the active binding exposes one.

```html
<input [attr.name]="formNodeState.name()" />
```

## 📖 Method reference {#method-reference}

### ◆ hasError(kind) {#haserrorkind}

**Signature:** `hasError(kind: string): boolean`

Returns true when `errors()` contains an entry with that exact, case-sensitive `kind`.
**Works with every supported binding** and tracks changes when called in a template, `computed()`,
or `effect()`. It returns false when the error is absent or the component is disconnected.

```ts
showRequiredError = computed(() =>
  this.formNodeState.touched() && this.formNodeState.hasError('required')
);
```

This checks an existing error, not whether a validator is configured. Use `required()` to decide
whether to show a required asterisk even when the value is valid.

### ◆ getError(kind) {#geterrorkind}

**Signature:** `getError(kind: string): ControlStateError | undefined`

Returns the **first matching normalized error object**, including `kind` and its details, or
`undefined` when absent or disconnected. It is the same object found in `errors()`; treat it as
read-only. Additional payload properties have type `unknown` and can be narrowed before using them.

```ts
minimumLengthError = computed(() => this.formNodeState.getError('minlength'));
// Angular error example: { kind: 'minlength', requiredLength: 3, actualLength: 1 }
```

Both queries observe only the current `errors()` list. They do not walk child paths, gather extra
descendant errors, or explicitly run validation. Multiple errors of the same kind retain their
existing order. Error names are preserved: Angular uses `minlength`, while Form Nodes uses
`minLength`. Read `errors()` to see the names supplied by the active forms API.

Unlike `AbstractControl.getError()`, this method returns the full normalized object rather than
just Angular's payload. Unlike Angular's payload-truthiness check, `hasError()` returns true for
an existing normalized entry even if its original payload was false, zero, or null. This gives
all five supported bindings the same query semantics.

Queries follow control replacement and disconnection. Angular control events update them normally;
silent Angular changes are reconciled after rendering, just like `errors()`. See the
[complete custom-control example](#constraint-properties) for template use with error details.

### ◆ hasValidator(validator) {#hasvalidatorvalidator}

**Signature:** `hasValidator(validator: unknown, options?: { resolve?: boolean }): boolean | undefined`

**The exported Form Nodes `required` and Angular `Validators.required` are equivalent queries.**
Both ask whether the connected control is currently required, using the same state as `required()`.
This includes active own `required` errors, conditional required rules, Angular required directives, and `requiredTrue` obligations,
even when the current value is valid. It is a semantic check, not a claim that both functions were registered.

For other functions, the active binding determines what can be answered:

| Binding | Other validator functions |
| --- | --- |
| `[formNode]` | Checks direct references in the node's configured validators, including async validators. |
| `[formControl]`, `[formControlName]`, `[(ngModel)]` | Checks direct synchronous and asynchronous Angular validator registrations. |
| `[formField]` | Returns `undefined`: Angular Signal Forms has no general public reference query. |

The result means:

- `true`: the known rule is active, or the exact function is registered.
- `false`: the known rule is inactive, or a supported reference query found no match.
- `undefined`: no binding, a non-function argument, or an unsupported reference query.

<CodeBlock language="ts" title="control-validator-state.ts">{validatorQueriesSource}</CodeBlock>

Only the two required exports receive this equivalence. Results of factories such as `required('Message')`,
`requiredIf(...)`, or `Validators.min(3)` follow exact-reference semantics: keep the function that
you registered instead of creating another one for the query. A function from the wrong forms
library normally returns false on a source that supports reference queries. `Validators.requiredTrue`
is also an ordinary reference query; it is not equivalent to the two required exports.

Direct-reference checks report registration even if a conditional validator is currently inactive.
For the active required state, query one of the required exports or use `required()` directly.
By default, compositions are not resolved and validators are not executed by the query.
**With `[formNode]`, pass `{ resolve: true }` to inspect the final validator references
returned by synchronous compositions**, following the node's own
[`hasValidator` resolution semantics](../guides/validation.md).
Resolution may execute synchronous validators; it shares their evaluation with validation and
tracks reactive composition dependencies. Async validators can be found without starting their work.

Angular Reactive Forms and template-driven bindings retain direct-reference behavior even with
`resolve: true`: Angular does not publicly expose the contents of composed validators.
For `[formField]`, arbitrary reference queries still return `undefined`.
The two required exports always use the semantic required-state check, regardless of this option.
Angular directive instances and strings such as `'required'` return `undefined`.

`hasError()`, `getError()`, and `hasValidator()` memoize their queries in bounded caches.
The current internal limits are 20 entries for each error query and 32 for validator queries,
shared with the node implementations. Limits apply per function and instance, not per application.
Entries are created on demand; repeated calls with the same arguments do not consume extra slots.
Repeated calls reuse the computation, and unchanged results avoid recomputing dependent consumers.
Error queries are keyed by kind; validator queries use the function reference and the normalized
`resolve` boolean, so fresh options objects reuse the same query.
`getError()` compares errors by reference and always returns the current matching object from `errors()`.

Queries track changes in `computed()`, `effect()`, and templates, including binding replacement.
Angular control events refresh them; silent changes to synchronous or asynchronous registrations
are reconciled after rendering using public validator references. Call `updateValueAndValidity()`
after modifying Angular validators as usual to update validation results. Merely querying async
registrations does not start asynchronous validation.

### ◆ markAsTouched() {#markastouched}

**Signature:** `markAsTouched(): void`

Reports a touched interaction to the active binding and safely does nothing while disconnected.

```html
<input (blur)="formNodeState.markAsTouched()" />
```

</div>

## 🚨 Normalized errors and disabled reasons {#normalized-errors-and-disabled-reasons}

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

## 👆 Report a blur interaction {#report-a-blur-interaction}

Call `markAsTouched()` when the custom control loses focus:

```ts
markAsTouched() {
  this.formNodeState.markAsTouched();
}
```

It delegates to the active forms API and is a safe no-op while disconnected.

## 🔌 Ownership boundary {#ownership-boundary}

The facade reads bound state and reports the touched interaction; it is not a second form-control
API. Send user-authored values through `model()`, `FormValueControl`, or `ControlValueAccessor`.
Programmatic writes, reset, availability, and validation remain owned by the forms API that created
the binding. `ControlState` intentionally has no `setValue()`, `reset()`, `disable()`, or `enable()`.

## 🔌 Selection and lifecycle {#selection-and-lifecycle}

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

## 📐 Public types {#public-types}

| Type | Purpose |
| --- | --- |
| `ControlState<TValue>` | Complete facade returned by `useFormNodeState<TValue>()`. |
| [`ControlStateSource`](./types/control-state-source.md) | Union of supported source names. |
| [`ControlStateError`](./types/control-state-error.md) | Normalized error with a required `kind`. |
| [`ControlStateDisabledReason`](./types/control-state-disabled-reason.md) | Normalized disabled reason with an optional `message`. |

## 🔗 Related guides and reference {#related-guides-and-reference}

- [Custom controls](../guides/custom-controls.md)
- [`FormNodeDirective` binding API](./form-node-binding.md)
- [Control binding](../guides/control-binding.md)
- [API overview](./api-overview.md)


## Contribute component errors {#contribute-errors}

Pass `errors` to contribute a reactive validation result from your component. A signal is also
accepted because it is callable. `options.errors()` describes only local errors; `state.errors()`
continues to return the binding's combined errors. Read local input or parsing state in the callback,
never `state.errors()` or `state.invalid()`, which would create a validation cycle.

```ts
state = useFormNodeState({
  errors: () => this.parseError() ? 'Enter a valid date.' : null,
});
```

| Callback result | Meaning |
| --- | --- |
| `{ kind: 'invalidDate', message: 'Enter a valid date.' }` | One structured error; `message` is optional. |
| `'Enter a valid date.'` | One error with `kind: 'custom'` and that message. An empty string is also an error. |
| `['First problem', { kind: 'invalidDate' }]` | Several errors or messages, including readonly arrays. |
| `null`, `undefined`, `void`, or `[]` | No errors from this callback. |

The callback is synchronous and tracks signal dependencies even when the CVA's value stays `null`.
Promises are not supported. If the component wraps an Angular `FormControl`, its plain `errors`
property is not reactive: convert `statusChanges` to a signal with `toSignal()`, read that signal
in the callback, and map the Angular error dictionary to `{ kind, ...details }` objects. Errors belong to the current host binding and cannot target another
node. Returning no errors removes only this hook's contribution. Other validators and other
hook instances retain their errors. Destroying the component or changing its binding releases the
old contribution. Without a binding the callback is not evaluated and state remains neutral.

For Form Nodes, these errors participate in normal node validity, ancestor validity, `allErrors()`,
and submission checks. They are suppressed while the node is disabled, readonly, or hidden.
Contributing an error does not mark a node dirty or touched or restart its asynchronous validators.
An existing asynchronous validation can remain pending while the node is invalid from a local
error; its completion does not remove that local error. Resetting the node writes its value
back through the CVA; `writeValue()` must update the local state from which errors are derived.
A reset does not blindly erase a still-active local error condition.

Reactive Forms and `ngModel` register an independently removable synchronous validator and rerun
validation when the callback changes. Angular's normal disabled and asynchronous-validation rules
apply. As with Angular's own validator-change callbacks, revalidation can emit control events.
Avoid replacing all validators with `setValidators()` while the contribution is attached; use
`addValidators()` and `removeValidators()` to preserve other registrations. Angular represents
errors as a map, so the last error with a given kind wins; use distinct kinds when all errors must
remain visible. Form Nodes retains all error entries.

### CVA example

<CodeBlock language="ts" title="appointment-editor.component.ts">{controlErrorsSource}</CodeBlock>

The input accepts date text understood by JavaScript's `Date` parser; use your date adapter for
locale-specific or strict calendar parsing. Validation and rendering share the same local text.

### Angular Signal Forms provider

```ts
provideFormNodeStateErrors(): Provider[];
```

For a CVA used with **Angular 22+ `[formField]`**, add `provideFormNodeStateErrors()` to the
component's `providers` alongside `NG_VALUE_ACCESSOR`, as in the example. This installs the
`NG_VALIDATORS` bridge without requiring `validate()` or `registerOnValidatorChange()` on your CVA.
It is safe to keep this provider on reusable CVAs used with the other bindings; those bindings
register the hook contribution directly. Existing CVA validators remain registered separately.
Angular Signal Forms may expose the structured payload under an error's `context` property;
`kind` remains available at the top level.

The provider is unnecessary for `[formNode]`, `[formControl]`, `[formControlName]`, and `ngModel`.
`[formNode]` also supports this option on signal-model custom controls. The Signal Forms bridge
requires a CVA and Angular 22 or newer: Angular 21 Signal Forms and Signal Forms model controls
cannot consume this bridge. Unsupported Signal Forms hosts throw an explanatory error instead
of silently leaving the form valid. The hook's existing observation API remains supported on
all its existing bindings and versions when `errors` is omitted.


## Nearest form state {#nearest-form-state}

Use **`state.formSubmitted()`** when you only need to know whether the nearest form has recorded
a submission attempt. It is the same readonly `Signal<boolean>` as `state.form.submitted`, so
both reads track the same state, including invalid attempts, resets, and changes of owning form.
It returns `false` without a supported form and adds no subscriptions or independent history.

For custom presentation logic, a component can derive visibility with:

```ts
state = useFormNodeState();

showErrors = computed(() => this.state.touched() || this.state.formSubmitted());
```

The name `formSubmitted` refers to the owning form, not a separate submission state on the control.
`state.form: ClosestFormState` still includes the complete
[`useClosestFormState()`](./use-closest-form-state.md) facade:

| Member | Meaning |
| --- | --- |
| `state.form.connected()` | Whether a supported owning form exists |
| `state.form.source()` | `'formNode'`, `'formGroup'`, `'ngForm'`, or `null` |
| `state.form.submitted()` | Whether that form recorded a submission attempt, even if invalid |
| `state.form.formNode()` | Owning Form Nodes callable API, or `null` |

The nearest form's connection is independent of `state.connected()`, which describes the
binding attached to the current component host. A presentation component can observe its form
without being a control itself. Lookup priority, nested-form ownership, rebinding, reparenting,
Angular reset reconciliation, and cleanup match the standalone helper. An unowned Form Nodes
binding can fall back to the surrounding Angular form. Without a supported form, flags are false
and source/API are null. Angular Signal Forms relies on touched state after submission; it does
not supply persistent submission history here.

Pass the complete state to [`<form-node-errors [state]="state">`](./form-node-errors.md) for
accessible messages with default touch-or-submit visibility and optional height animation.
