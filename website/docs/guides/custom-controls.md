---
title: Custom controls
---

import CodeBlock from '@theme/CodeBlock';
import customInputsSource from '!!raw-loader!../../examples/custom-control-inputs.typecheck.ts';
import controlStateSource from '!!raw-loader!../../examples/control-state-form-node.typecheck.ts';

# Custom controls

Bind a custom component with `[formNode]`, just as you would a native input. For a new
component, expose a `value = model(...)`. Existing `ControlValueAccessor` components
can use the same binding.

:::tip Already binding disabled or readonly?
By default, `[formNode]` also writes matching state inputs on your custom component.
Use [`syncControlInputs: false`](#keep-control-of-your-components-inputs) if your template or
component should manage them.
:::

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

## Keep control of your component's inputs

If your component has inputs such as `disabled`, `readonly`, `required`, or `name`,
`[formNode]` normally supplies their values from the bound node. This also applies when the
node supplies `false` or an empty value. An explicit template binding does not automatically
take priority over that synchronization.

Set `syncControlInputs: false` in your application's providers to let your component defaults
and template bindings own those inputs:

<CodeBlock language="ts">{customInputsSource}</CodeBlock>

Register the exported `appConfig` when bootstrapping your application. In this example,
`saving()` controls the component's disabled input and `locked()` controls its readonly input.
Editing the value still updates `profile.name`, and changes to the node still update the control.
Checkbox controls using `checked = model(false)` work the same way.

This option leaves the node's state unchanged. If the node is disabled, its form behavior stays
disabled even when the component's input says otherwise. Use `useControlState()` when the
component needs to read node state explicitly.

The setting defaults to `true`. You can also place `provideFormNodeConfig()` in a component's
`providers` to configure an injector scope; a nearer provider can set `syncControlInputs: true`
to restore automatic input synchronization.

**Native inputs and the CVA `setDisabledState()` callback still receive disabled state.**
Touch, focus, reset, and value/checked bindings stay connected. The option only controls
Form Nodes' automatic custom-control state and constraint inputs; it does not configure
Angular's own `[formField]`, `formControl`, or `ngModel` directives.

See [the configuration reference](../reference/provide-form-node-config.md#custom-control-inputs)
for the complete input list and provider inheritance rules.

## ControlValueAccessor

If your component already implements Angular's `ControlValueAccessor`, bind it directly.
Both `NG_VALUE_ACCESSOR` providers and hooks that assign `inject(NgControl).valueAccessor`
during construction are supported:

```html
<app-existing-date-picker [formNode]="myForm.appointment" />
```

Import `FormNode` in the parent component. `[formNode]` writes values, registers change and
touch callbacks, and forwards disabled state through the normal CVA contract.

For utility-based components, see [direct NgControl registration](./custom-controls-advanced.md#hooks-that-assign-ngcontrolvalueaccessor).

See the [Angular Material](../integrations/angular-material.md) and
[PrimeNG](../integrations/primeng.md) guides for library-specific examples.

## Go further

The optional `FormNodeValueControl<T>` and `FormNodeCheckboxControl` types can document a
component's contract consistently on Angular 21 and 22. Runtime discovery does not require them.

The [advanced custom-controls guide](./custom-controls-advanced.md) covers input/output pairs,
object and array values, optional state inputs and hooks, wrapper components, Angular
`[formField]`, and detailed CVA integration, including validation and parsing errors.

## Related guides and reference

- [Build a custom rating control](../cookbook/custom-rating-control.md) shows a button-based control.
- [`useControlState()`](../reference/control-state.md) documents the available state signals.
- [Control binding](./control-binding.md) covers native elements and shared binding behavior.
- [Advanced custom controls](./custom-controls-advanced.md) documents the full compatibility contract.
