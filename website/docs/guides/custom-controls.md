---
title: Custom controls
---

import CodeBlock from '@theme/CodeBlock';
import controlStateSource from '!!raw-loader!../../examples/control-state-form-node.typecheck.ts';

# Custom controls

Bind a custom component with `[formNode]`, just as you would a native input. For a new
component, expose a `value = model(...)`. Existing `ControlValueAccessor` components
can use the same binding.

## Create a signal model control

This text input exposes its value through `model('')` and uses `useControlState()` to read
required and disabled state and report blur. The parent imports `FormNode` and the custom
component, then binds a field:

<CodeBlock language="ts">{controlStateSource}</CodeBlock>

`[formNode]` discovers the value model automatically. Updating `value` from the component
sends the user's input to the field; updating the field updates the component. No custom
provider, base class, or Form Nodes interface is required.

The component has three responsibilities:

- Render the model value and update it when the user edits the control.
- Apply the state it needs, such as `controlState.disabled()`, to its interactive element.
- Call `controlState.markAsTouched()` when the user leaves the control.

Initialize the value model with a default, such as `model('')`, instead of `model.required()`.
The bound field supplies its value during setup. For a checkbox-style component, expose
`checked = model(false)` instead of `value`.

## ControlValueAccessor

If your component already implements Angular's `ControlValueAccessor` and registers
`NG_VALUE_ACCESSOR`, bind it directly:

```html
<app-existing-date-picker [formNode]="myForm.appointment" />
```

Import `FormNode` in the parent component. `[formNode]` writes values, registers change and
touch callbacks, and forwards disabled state through the normal CVA contract.

See the [Angular Material](../integrations/angular-material.md) and
[PrimeNG](../integrations/primeng.md) guides for library-specific examples.

## Go further

The [advanced custom-controls guide](./custom-controls-advanced.md) covers input/output pairs,
object and array values, optional state inputs and hooks, wrapper components, Angular
`[formField]`, and detailed CVA integration, including validation and parsing errors.

## Related guides and reference

- [Build a custom rating control](../cookbook/custom-rating-control.md) shows a button-based control.
- [`useControlState()`](../reference/control-state.md) documents the available state signals.
- [Control binding](./control-binding.md) covers native elements and shared binding behavior.
- [Advanced custom controls](./custom-controls-advanced.md) documents the full compatibility contract.
