---
title: FormNodeControl
---

# FormNodeControl

Either a value control or, for boolean values, a checkbox control recognized by `[formNode]`.

## Import

```ts
import type { FormNodeControl } from '@ngblocks/form-nodes';
```

## When to use it

Use as the union contract when infrastructure accepts either a value-model control or a boolean checkbox-model control. Implement the specific value or checkbox contract in concrete components.

## Declaration

```ts
type FormNodeControl<TValue = any, TNode extends AnyNode = FieldNode<TValue>> = FormNodeValueControl<TValue, TNode> | ([
    TValue
] extends [
    boolean
] ? FormNodeCheckboxControl<TNode> : never);
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | `any` |
| `TNode` | `AnyNode` | `FieldNode<TValue>` |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FieldNode](./field-node.md)
- [FormNodeCheckboxControl](./form-node-checkbox-control.md)
- [FormNodeValueControl](./form-node-value-control.md)
