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
| `value = model()` with state/constraint `input()` properties | Value binding works by default. Automatically populating those inputs requires experimental `syncInputs`; use `'always'` for every supported input. |
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

## Keep control of your component's inputs

Optional custom-control input synchronization is **experimental and disabled by default**.
This concerns the state and constraint inputs used by Angular's `FormValueControl` and
`FormCheckboxControl` contracts. Value/checked models remain connected through their public APIs;
`markAsTouched()`, the `touch` output, focus, reset, and normal node validation still work.

Opt in per node with `syncInputs: true` (equivalent to `'only-declared'`). This example synchronizes
`disabled`, `required`, and `minLength` because they are declared in the initial node definition:

<CodeBlock language="ts" title="Text control and profile component">{syncInputsSource}</CodeBlock>

The initial declaration selects an input, not a fixed value. Reactive conditions and constraints
keep updating. Explicit `disabled: false` still selects disabled synchronization. Constraints use
known metadata on the initially registered validators; arbitrary compositions and later-added
validators require `'always'`. Initial disabled declarations also select `disabledReasons`.

Use `syncInputs: 'always'` to synchronize all supported inputs, including `dirty`, `touched`,
`invalid`, `pending`, `errors`, and generated `name`. These are derived states, so `'only-declared'`
does not select them. A selected input receives node state even when its value is false or empty;
that can override a component default or an authored template binding.

Precedence is node option, nearest explicit provider, global setting, then false. A node option
applies only to that node, not descendants. Providers and `configureGlobalFormNodes()` accept the
same modes; `createFormPrimitives()` supports a shared factory default. False or null explicitly
opts out. When rebinding to another node, input selection follows the new node; unselected inputs
are left as they are, without restoring a previous component value.

Component defaults and template bindings own optional inputs when synchronization is off:

<CodeBlock language="ts">{customInputsSource}</CodeBlock>

**Native controls and CVA `setDisabledState()` still receive disabled state.** To read state without
these experimental writes, use `useFormNodeState()` or explicit template bindings. Actual `model()` controls use public value APIs.
Separate input/output pairs use [experimental value transport](#separate-input-output-pairs) when `syncInputs` is enabled. See [all configuration details](../reference/provide-form-nodes-config.md#custom-control-inputs).

### Select individual inputs

Pass an array to synchronize **only those inputs, always**, even without initial node declarations.
The object form makes the mode explicit; `'only-declared'` intersects your list with the node's
initial declarations. An empty list synchronizes no optional inputs.

<CodeBlock language="ts" title="Selected inputs and profile component">{selectedInputsSource}</CodeBlock>

Selections use supported public input names, including aliases such as `readonly`, rather than
component property names. Selecting `disabled` alone does not also select `disabledReasons`.
These forms work on all primitives, factory defaults, providers, and global configuration.
They never change `value`/`checked` model transport or CVA `setDisabledState()`.

## Separate input/output pairs

Components with `value`/`valueChange` or `checked`/`checkedChange` pairs are supported **only when
the effective `syncInputs` setting is enabled**. This supports both `input()`/`output()` and
classic `@Input()`/`@Output()` properties, including public aliases. Unlike `model()`, writing a
separate value input requires Angular internals, so this integration is experimental.

Any enabled mode, input list, or mode/inputs object enables paired value transport. Lists select
only optional state inputs: `syncInputs: []` connects the value pair without copying any optional
state inputs. The equivalent explicit form is `{ mode: 'always', inputs: [] }`.

<CodeBlock language="ts" title="Paired text input and profile component">{pairedControlSource}</CodeBlock>

For state input writes as well, use `true`/`'only-declared'`, `'always'`, or a selection such as
`['disabled']`. The same option works in factory defaults, providers, and global configuration,
with node options taking precedence.

With `false` or `null` (including the default), the component keeps its current input value;
its change/touch outputs do not update the node through this transport. If the binding switches
to an enabled node, its current control value is written again. Programmatic values, debounced
input, validation, and dirty/touched transitions follow the usual node behavior while connected.
Initialize separate inputs with defaults; do not use `input.required()` for these value inputs.

Use a genuine `value = model()` / `checked = model()` or a CVA to bind values without this
experimental input writer. Optional `FormNodeValueControl`/`FormNodeCheckboxControl` types describe
the model contracts; a separate pair does not need to implement them.

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
