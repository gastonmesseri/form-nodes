---
title: FormNodeValueControl
---

# FormNodeValueControl

A custom control exposing a `value` model for `[formNode]`.

## Import

```ts
import type { FormNodeValueControl } from '@ngblocks/form-nodes';
```

## When to use it

Implement this contract in a custom component exposing a `value` model. Match its value type to the bound field, including nullability, and emit `touch` for completed interaction.

## Declaration

```ts
type FormNodeValueControl<TValue, TNode extends AnyNode = FieldNode<TValue>> = FormNodeUiControl<TValue, TNode> & {
    value: ModelSignal<TValue>;
    checked?: undefined;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TNode` | `AnyNode` | `FieldNode<TValue>` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `value` | The rendered value, including pending debounced input. |
| `checked` | Reserved for checkbox controls. |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FieldNode](./field-node.md)
- [FormNodeUiControl](./form-node-ui-control.md)
