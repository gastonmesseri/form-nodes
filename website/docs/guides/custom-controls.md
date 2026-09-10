---
title: Custom controls
---

import CodeBlock from '@theme/CodeBlock';
import customEventOrderSource from '!!raw-loader!../../examples/custom-control-event-order.typecheck.ts';
import pairedControlSource from '!!raw-loader!../../examples/paired-control-inputs.typecheck.ts';
import selectedInputsSource from '!!raw-loader!../../examples/selected-control-inputs.typecheck.ts';
import syncInputsSource from '!!raw-loader!../../examples/experimental-sync-inputs.typecheck.ts';
import customInputsSource from '!!raw-loader!../../examples/custom-control-inputs.typecheck.ts';
import formNodeStateSource from '!!raw-loader!../../examples/form-node-state-form-node.typecheck.ts';

# Custom controls {#custom-controls}

Bind a custom component with [`[formNode]`](../reference/form-node-binding.md), just as you would a native input. For a new
component, expose a `value = model(...)`. Existing `ControlValueAccessor` components
can use the same binding.

:::tip Already binding disabled or readonly?
Optional input synchronization is [experimental and off by default](#keep-control-of-your-components-inputs). Your template or
component should manage them.
:::

## 🔌 FormValueControl: value models and state {#create-a-signal-model-control}

A component implementing Angular's `FormValueControl<T>` can use `[formNode]` without
experimental input synchronization. The integration has two separate responsibilities:

| Component design | Value and state integration |
| --- | --- |
| `value = model()` with [`useFormNodeState()`](../reference/form-node-state.md) | Value binding and full access to the bound Form Nodes state without experimental input writes. The component renders the state itself. |
| `value = model()` with state/constraint `input()` properties | Value binding works by default. Automatically populating those inputs requires experimental `syncInputs`; use `'all'` for every supported input. |
| `ControlValueAccessor` / `NG_VALUE_ACCESSOR` | Values, change/touch callbacks, and `setDisabledState()` use the normal CVA contract, independently of `syncInputs`. |

**Full automatic `FormValueControl` input synchronization is experimental; using the
`FormValueControl` value contract is not.** Merely implementing the interface does not enable
input writes. A component designed around `useFormNodeState()` can use the bound node's state,
constraints, errors, and interaction operations without enabling them.

This complete example implements `FormValueControl<string>` with `value = model('')` and reads
state through `useFormNodeState()`. It applies disabled, readonly, required, and minimum length
to its native input, renders validation messages, and reports blur. The parent explicitly keeps
`syncInputs` off, including when a surrounding provider enables it:

<CodeBlock language="ts" title="Text input and profile editor">{formNodeStateSource}</CodeBlock>

`[formNode]` discovers the value model automatically. Detection requires a declared signal input
and matching change output that refer to the same model property. Public aliases are supported,
such as `actualValue = model('', { alias: 'value' })`. An internal `value = signal('')` is not a
value model and is left untouched. Updating `value` from the component
sends the user's input to the field; updating the field updates the component. No custom
provider, base class, or Form Nodes interface is required.

**`useFormNodeState()` supports `[formNode]`, `[formField]`, `[formControl]`, `[formControlName]`,
and `[(ngModel)]`: implement state UI once for every supported binding.** Keep the value contract
required by the caller's forms API. See [source-specific state support](../reference/form-node-state.md).

`useFormNodeState()` reads state; it does not apply attributes to the DOM or populate the
component's own `disabled = input()` properties. An existing control that reads those properties
must adopt the hook in its implementation, receive explicit bindings, or opt into experimental
synchronization. Focus and reset integration still use the optional `focus()` and `reset()` hooks.

The component has three responsibilities:

- Render the model value and update it when the user edits the control.
- Apply the state it needs, such as `formNodeState.disabled()`, to its interactive element.
- Call `formNodeState.markAsTouched()` when the user leaves the control.

Initialize the value model with a default, such as `model('')`, instead of `model.required()`.
The bound field supplies its value during setup. For a checkbox-style component, expose
`checked = model(false)` instead of `value`.

## 🧪 Keep control of your component's inputs {#keep-control-of-your-components-inputs}

Optional custom-control input synchronization is **experimental and disabled by default**.
This concerns the state and constraint inputs used by Angular's `FormValueControl` and
`FormCheckboxControl` contracts. Value/checked models remain connected through their public APIs;
`markAsTouched()`, the `touch` output, focus, reset, and normal node validation still work.

Opt in per node with `syncInputs: 'declared'`. This example synchronizes disabled because it is
an explicit initial option. Required and minLength still validate the node without populating
the component's constraint inputs:

<CodeBlock language="ts" title="Text control and profile component">{syncInputsSource}</CodeBlock>

`'declared'` selects initial disabled, readonly, and hidden options (including false values), plus
disabledReasons with disabled. Validators never select inputs in this preset.

Use `'signal-controls'` for all supported inputs on actual value/checked model controls. CVAs take
precedence even when they also expose a model; this preset does not write their additional inputs.
Use `'all'` for all inputs on any active custom-control adapter, including CVAs and enabled pairs.
Native controls and standard CVA disabled callbacks remain connected in every mode.

### ◆ Select inputs and target controls {#select-inputs-and-target-controls}

Lists select exactly those inputs. Objects separate the input selection from its target:

<CodeBlock language="ts" title="Selected inputs and profile component">{selectedInputsSource}</CodeBlock>

The object accepts `{ inputs: 'declared' | 'all' | readonly SyncInputName[], target?: 'all' |
'signal-controls' | 'cva' }`. Target defaults to all; it filters the selected adapter rather than
changing priority. An active paired control only matches all. Empty lists write nothing and never
enable value binding. Selecting disabled in a list does not also select disabledReasons.

Selections update reactively, including validator constraints, and can replace authored input
bindings. Missing component inputs are ignored; inputs no longer selected retain their last values.
Options work independently on nodes, factory defaults, providers, and global configuration. Node
options override inherited settings for their own binding, not descendants. See the
[full configuration reference](../reference/provide-form-nodes-config.md#custom-control-inputs).

## 🧪 Separate input/output pairs (experimental) {#separate-input-output-pairs}

Components with `value`/`valueChange` or `checked`/`checkedChange` pairs require
**`bindInputOutputPairs: true`**. This experimental option enables value writes, change/touch outputs,
optional focus/reset hooks, and an optional writable node reference. Signal and decorator inputs
and public aliases are supported. Models and CVAs do not require this option.

<CodeBlock language="ts" title="Paired text input and profile component">{pairedControlSource}</CodeBlock>

Use `syncInputs` separately to select state inputs. For example, `{ bindInputOutputPairs: true,
syncInputs: ['disabled'] }` connects the pair plus disabled state. Neither `syncInputs: 'all'` nor
an empty list activates a pair. Targets signal-controls and cva exclude paired controls.

False/null (including the default) pauses the complete pair connection: no value or state-input
writes, no processing of change/touch outputs, no calls to its focus/reset hooks, and no retained
writable node reference. Existing input values remain unchanged. Returning to an enabled node
resynchronizes its current value. Values, debounce, validation, and dirty/touched transitions
follow normal node behavior while connected. Use initialized inputs rather than required inputs.

`bindInputOutputPairs` inherits independently from `syncInputs` through node/factory, provider, and global
configuration. See [pair configuration and rebinding](../reference/provide-form-nodes-config.md#bind-input-output-pairs).

## 🔌 ControlValueAccessor {#controlvalueaccessor}

If your component already implements Angular's `ControlValueAccessor`, bind it directly.
Both `NG_VALUE_ACCESSOR` providers and hooks that assign `inject(NgControl).valueAccessor`
during construction are supported:

```html
<app-existing-date-picker [formNode]="myForm.appointment" />
```

Import `FormNodeDirective` in the parent component. `[formNode]` writes values, registers change and
touch callbacks, and forwards disabled state through the normal CVA contract. These standard
CVA operations do not require `syncInputs`. Automatically writing additional state or constraint
inputs on a CVA component remains subject to the same experimental option.

For utility-based components, see [direct NgControl registration](./custom-controls-advanced.md#hooks-that-assign-ngcontrolvalueaccessor).

See the [Angular Material](../integrations/angular-material.md) and
[PrimeNG](../integrations/primeng.md) guides for library-specific examples.

## 🔗 Go further {#go-further}

The optional [`FormNodeValueControl<T>`](../reference/types/form-node-value-control.md) and [`FormNodeCheckboxControl`](../reference/types/form-node-checkbox-control.md) types can document a
component's contract consistently on Angular 21 and 22. Runtime discovery does not require them.

The [advanced custom-controls guide](./custom-controls-advanced.md) covers aggregate models,
object and array values, optional state inputs and hooks, wrapper components, Angular
`[formField]`, and detailed CVA integration, including validation and parsing errors.

## 🔗 Related guides and reference {#related-guides-and-reference}

- [Build a custom rating control](../cookbook/custom-rating-control.md) shows a button-based control.
- [`useFormNodeState()`](../reference/form-node-state.md) documents the available state signals.
- [Control binding](./control-binding.md) covers native elements and shared binding behavior.
- [Advanced custom controls](./custom-controls-advanced.md) documents the full compatibility contract.

## Reading node state inside output handlers {#output-handler-order}

With immediate updates, `[formNode]` processes a custom control's `valueChange` or `checkedChange`
before your template handler for that output. The node value, parent value, dirty state, and
synchronous validation are already updated. A `touch` handler likewise sees the updated touched
state and any value committed by blur debounce. This applies to models (including aliases) and
[enabled input/output pairs](#keep-control-of-your-components-inputs).

<CodeBlock language="ts" title="description-editor.component.ts">{customEventOrderSource}</CodeBlock>

Debounce still delays the committed value; `value.control()` exposes pending control input.
Programmatic writes to a component model can emit its output too, so `valueChange` alone does not
identify user interaction. Construction-time emissions before binding initialization are not user
interaction and do not have this ordering guarantee.

For a CVA, call the registered `onChange` callback before emitting a separate event whose consumers
need the updated node. Call `onTouched` before emitting a corresponding interaction event. Form Nodes
updates synchronously within those callbacks (subject to configured debounce); it cannot update
from a value that the CVA has not delivered yet. The same limitation applies to Reactive Forms.

The same ordering holds when your component injects [`FORM_NODE`](../reference/form-node-token.md) or `FormNodeDirective` during
construction. The injected token still identifies the concrete binding; no deferred injection or
manual microtask is needed.

## Observing values from a bound custom control

Consumers can listen to `(formNodeControlValueChange)` for the immediate value received from the
control and `(formNodeValueChange)` for its committed value after debounce. The outputs follow the
selected model, enabled input/output pair, or CVA transport. They do not react to programmatic node
writes or model-to-view rendering. A CVA should call its registered `onChange` callback for
view-to-model edits, and must not call it from `writeValue` as feedback. Custom code can invoke
callbacks or emit model outputs, so these events do not certify a physical user interaction.
See [value outputs](../reference/form-node-binding.md#value-outputs) for the full contract.


## CVA initialization and update timing {#cva-timing}

When `[formNode]` connects a `ControlValueAccessor`, it calls `writeValue()` with the current control value and calls `setDisabledState()` when implemented, synchronously during directive initialization. These calls happen before registering change and touch callbacks and before child controls run their initialization hooks. This lets controls such as Material radio groups select preloaded values, including when a parent CVA initializes an inner form or an `@if` creates a new group. The first reactive synchronization does not repeat an unchanged initial write.

This matches Reactive Forms' initialization order. It does **not** make every later model-to-view update synchronous: `node.set()`, form patches, and disabled-state changes update node state immediately, while existing CVAs receive changed state during Angular's reactive synchronization. A CVA must accept `writeValue()` before its view is initialized and during later updates. Reactive Forms' `FormControl.setValue()` instead invokes the registered model-to-view callback synchronously.

Form Nodes requests a view check after writing a CVA value or disabled state. This also supports controls whose `setDisabledState()` only assigns a plain property, such as ng-bootstrap rating and timepicker. Rendering still follows Angular's change detection cycle.

After initialization, value and disabled state are synchronized together. Enabling happens before
writing the value; disabling happens after it. Enabling also resends the current value, so a control
that ignored a write while disabled catches up. This covers `node.enable(); node.set(nextValue)`
in the same turn and enable followed by reset. A control that rejects writes while disabled may
keep its previous display until enabled; Form Nodes does not temporarily enable it to force a write.

CVA user input remains synchronous: call the callback supplied to `registerOnChange()` for user edits. Form Nodes receives that value immediately; configured debounce can defer its commit. Prefer `(formNodeControlValueChange)` for immediate control values and `(formNodeValueChange)` for committed values. Programmatic `writeValue()` calls must not emit user changes; Form Nodes also guards against synchronous feedback from an accessor.


Reset is an explicit exception to ordinary model-to-view deduplication: `reset()` and `resetToInitial()` synchronously call the bound CVA's `writeValue()` even when the value stays the same. This clears provisional control text that was never emitted to the node. Resetting an ancestor applies this to its bound descendants, and pending debounced input is discarded. Reset-driven writes do not emit [`formNodeValueChange`](../reference/form-node-binding.md#value-outputs) or `formNodeControlValueChange`.

Changing `[formNode]` to a different node forces a fresh value and disabled-state write during binding synchronization, even if both nodes have equal values. Subsequent resets and user callbacks target the new node; resetting the previous node or a node whose binding was destroyed does not write into the control. Ordinary unchanged-value effects still skip redundant writes.

## Tested UI library integrations {#tested-ui-libraries}

The browser regression suite uses real controls from Angular Material, PrimeNG, NG-ZORRO,
ng-bootstrap, and Ionic. It checks initial values against Reactive Forms, user-value outputs,
reset, rebinding, disabled state, and control-specific touch/debounce behavior. Select tests
also cover late options and overlay selection; Material tests include native and Moment dates.

The baseline fixtures use Angular 21.0.7 with Material 21.0.6, PrimeNG 21.1.10, NG-ZORRO 21.3.3,
ng-bootstrap 20.0.0, and Ionic Angular 9.0.3. An additional isolated matrix runs these tests on
Angular 21.2.22 and Angular 22.1.6 with compatible UI versions in Chromium, plus Angular 21.2.22
in Firefox and WebKit. This covers the tested controls and versions, not
every component or configuration offered by these libraries. See the repository's
[UI integration test matrix](https://github.com/gastonmesseri/form-nodes/blob/master/docs/ui-library-testing.md)
for the exact controls, scenarios, version selection, and known boundaries.

A CVA decides when it reports touched: for example, ng-bootstrap rating reports it during
selection. With `debounce: 'blur'`, that callback commits the pending value in the same
interaction. Form Nodes follows the accessor's touch notification rather than assuming every
custom control waits for a native DOM blur.

Resetting a checkbox from its own value output can happen before the browser's clicked state has
been rendered by the UI component. Material and PrimeNG checkboxes can then retain that visual
state even though the node has reset; this is also reproducible with Reactive Forms. The integration
tests cover that shared boundary and recovery after a rendered state update. Prefer performing
related-field updates from the output and keeping explicit form reset as a separate application action.

The suite also covers PrimeNG formatted numbers, incomplete masks and object autocomplete,
Material date ranges, array rows moved or removed during edits and open overlays, multiple
controls sharing a node, and an OnPush date CVA with an inner Reactive Forms control.
Autocomplete search text can differ from its selected model: user-value outputs follow the
CVA's reported value, so typing a search does not necessarily select a new value.

Dialogs follow Angular's injector hierarchy. Pass the appropriate `viewContainerRef` when
opening a Material dialog that needs [useClosestFormState()](../reference/use-closest-form-state.md).
For mutable model values such as `Date`, `Moment`, or objects, follow the
[new-instance update pattern](../concepts/values-and-state.md#mutable-values).

IME composition is tested with synthetic composition events; browser fill/clear does not
simulate saved-profile autofill or password managers. Playwright WebKit coverage does not
replace testing Safari on the devices your application supports.


## Report errors from inside a control

Use `useFormNodeState({ errors: () => ... })` when the component knows that its current input
cannot be interpreted, such as invalid date text. Return one `{ kind }` error, a message, an array,
or `null`/`undefined`/`void` for success. The callback is reactive and contributes to the bound
control's actual validity without replacing its configured validators.

See [component error contributions](../reference/form-node-state.md#contribute-errors) for a complete
CVA example, lifecycle behavior, and the `provideFormNodeStateErrors()` provider required for CVAs
used with Angular 22 Signal Forms.

## Standalone use {#standalone-use}

The same CVA or supported signal control can receive `[formNodeValue]` without a declared node,
or `[(formNodeValue)]` to update an application signal. Form Nodes creates an independent field;
`useFormNodeState()` and its error contributions continue to work. Supplying `[formNode]` as
well reuses that node and its validators. See [Standalone values](./control-binding.md#standalone-values)
for a complete example and the input's synchronization rules.
