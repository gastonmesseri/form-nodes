---
title: Custom controls
---

import CodeBlock from '@theme/CodeBlock';
import pairedControlSource from '!!raw-loader!../../examples/paired-control-inputs.typecheck.ts';
import selectedInputsSource from '!!raw-loader!../../examples/selected-control-inputs.typecheck.ts';
import syncInputsSource from '!!raw-loader!../../examples/experimental-sync-inputs.typecheck.ts';
import customInputsSource from '!!raw-loader!../../examples/custom-control-inputs.typecheck.ts';
import formNodeStateSource from '!!raw-loader!../../examples/form-node-state-form-node.typecheck.ts';

# Custom controls

Bind a custom component with `[formNode]`, just as you would a native input. For a new
component, expose a `value = model(...)`. Existing `ControlValueAccessor` components
can use the same binding.

:::tip Already binding disabled or readonly?
Optional input synchronization is [experimental and off by default](#keep-control-of-your-components-inputs). Your template or
component should manage them.
:::

## FormValueControl: value models and state {#create-a-signal-model-control}

A component implementing Angular's `FormValueControl<T>` can use `[formNode]` without
experimental input synchronization. The integration has two separate responsibilities:

| Component design | Value and state integration |
| --- | --- |
| `value = model()` with `useFormNodeState()` | Value binding and full access to the bound Form Nodes state without experimental input writes. The component renders the state itself. |
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

`[formNode]` discovers the value model automatically. Updating `value` from the component
sends the user's input to the field; updating the field updates the component. No custom
provider, base class, or Form Nodes interface is required.

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

### 🧪 Select inputs and target controls {#select-inputs-and-target-controls}

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

## ControlValueAccessor

If your component already implements Angular's `ControlValueAccessor`, bind it directly.
Both `NG_VALUE_ACCESSOR` providers and hooks that assign `inject(NgControl).valueAccessor`
during construction are supported:

```html
<app-existing-date-picker [formNode]="myForm.appointment" />
```

Import `FormNode` in the parent component. `[formNode]` writes values, registers change and
touch callbacks, and forwards disabled state through the normal CVA contract. These standard
CVA operations do not require `syncInputs`. Automatically writing additional state or constraint
inputs on a CVA component remains subject to the same experimental option.

For utility-based components, see [direct NgControl registration](./custom-controls-advanced.md#hooks-that-assign-ngcontrolvalueaccessor).

See the [Angular Material](../integrations/angular-material.md) and
[PrimeNG](../integrations/primeng.md) guides for library-specific examples.

## Go further

The optional `FormNodeValueControl<T>` and `FormNodeCheckboxControl` types can document a
component's contract consistently on Angular 21 and 22. Runtime discovery does not require them.

The [advanced custom-controls guide](./custom-controls-advanced.md) covers aggregate models,
object and array values, optional state inputs and hooks, wrapper components, Angular
`[formField]`, and detailed CVA integration, including validation and parsing errors.

## Related guides and reference

- [Build a custom rating control](../cookbook/custom-rating-control.md) shows a button-based control.
- [`useFormNodeState()`](../reference/form-node-state.md) documents the available state signals.
- [Control binding](./control-binding.md) covers native elements and shared binding behavior.
- [Advanced custom controls](./custom-controls-advanced.md) documents the full compatibility contract.
