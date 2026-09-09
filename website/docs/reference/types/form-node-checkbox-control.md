---
title: FormNodeCheckboxControl
---

# FormNodeCheckboxControl

A custom control exposing a boolean `checked` model for `[formNode]`.

## Import

```ts
import type { FormNodeCheckboxControl } from '@ngblocks/form-nodes';
```

## When to use it

Implement this contract in a custom component exposing a boolean `checked` model. Use a non-nullable boolean field when the component cannot represent null.

## Declaration

```ts
type FormNodeCheckboxControl<TNode extends AnyNode = FieldNode<boolean>> = FormNodeUiControl<boolean, TNode> & {
    checked: ModelSignal<boolean>;
    value?: undefined;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNode` | `AnyNode` | `FieldNode<boolean>` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `checked` | The rendered checked state. |
| `value` | Reserved for value controls. |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FieldNode](./field-node.md)
- [FormNodeUiControl](./form-node-ui-control.md)
