---
title: Custom control contracts
---

import CodeBlock from '@theme/CodeBlock';
import contractsSource from '!!raw-loader!../../examples/public-control-contracts.typecheck.ts';

# Custom control contracts

These types describe custom Angular components that bind through [`[formNode]`](./form-node-binding.md). They provide
compile-time checks for the supported model and optional UI members. They are not constructors,
providers, or a replacement for the directive's runtime adapter discovery.

## Choose the contract

| Component or integration | Public type |
| --- | --- |
| Component with a `value` model | [`FormNodeValueControl<TValue, TNode>`](./types/form-node-value-control.md) |
| Component with a boolean `checked` model | [`FormNodeCheckboxControl<TNode>`](./types/form-node-checkbox-control.md) |
| Generic code accepting either model shape | [`FormNodeControl<TValue, TNode>`](./types/form-node-control.md) |
| Shared optional state inputs and hooks | [`FormNodeUiControl<TValue, TNode>`](./types/form-node-ui-control.md) |
| The directive attached to a host | [`FormNodeBinding<TNode>`](./types/form-node-binding.md) or [`FormNodeDirective<TNode>`](./types/form-node-directive.md) |
| Read-only state across supported binding APIs | [`ControlState<TValue>`](./types/control-state.md), returned by [`useFormNodeState()`](./form-node-state.md) |
| A native form submission output | [`FormNodeSubmitEvent<TNode>`](./types/form-node-submit-event.md) |

## Value and checkbox components

A value control exposes `value: ModelSignal<TValue>`. A checkbox control exposes
`checked: ModelSignal<boolean>`. The contracts reserve the other model property so that the
component declares one transport. Match nullability to the node: the following components accept
non-nullable values and bind to [`field.strict()`](./field.md#nullability) declarations.

<CodeBlock language="ts" title="profile-controls.ts">{contractsSource}</CodeBlock>

The first generic describes the model value, not the node. Where available, the node generic
specializes the optional `node` signal for direct integration. Ordinary components usually need
only the model and selected UI members.

## Optional UI state and interaction

[`FormNodeUiControl`](./types/form-node-ui-control.md) groups signal inputs such as `disabled`, `readonly`, `required`, `errors`,
and constraints, plus optional `touch`, `focus()`, `reset()`, and `node` integration. See its
[full declaration](./types/form-node-ui-control.md) for exact member types.

Expose `touch` to report blur or another completed interaction independently of a value change.
Use `focus()` when the binding needs to focus an inner element. A component's `reset()` hook
clears its own transient UI state; the node remains responsible for its form state and value rules.

Input synchronization follows configuration; declaring a compatible input does not override
[`syncInputs`](./types/sync-inputs.md) or an explicit template binding. See
[control binding](../guides/control-binding.md) for synchronization precedence and adapter selection.

## Binding state and value notifications

A [`FormNodeBinding`](./types/form-node-binding.md) describes a rendered connection. It exposes the host, the bound-node signal,
error state, and outputs. A [`FormNodeControl`](./types/form-node-control.md) describes the component on the other side of that
connection. [`ControlState`](./types/control-state.md) is a source-neutral observation facade and does not expose node actions.

[`formNodeControlValueChange`](./form-node-binding.md#value-outputs) reports the immediate control value; `formNodeValueChange` follows
commit and debounce. Native submission outputs are separate and carry [`FormNodeSubmitEvent`](./types/form-node-submit-event.md).
See the [directive reference](./form-node-binding.md) for event ordering and programmatic-write rules.

CVA components can continue using Angular's `ControlValueAccessor` contract through the CVA
adapter. They do not need to implement these model-based types. See
[custom controls](../guides/custom-controls.md) and [advanced integrations](../guides/custom-controls-advanced.md)
for complete adapter workflows.
