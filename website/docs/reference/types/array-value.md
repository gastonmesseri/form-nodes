---
title: ArrayValue
---

# ArrayValue

Mutable array value produced by an array node, with every item mapped to its readable value.

## Import

```ts
import type { ArrayValue } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the read value contract from the array's child or item node types. The result describes raw data, not child nodes. Use [`FormNodeValue<typeof node>`](./form-node-value.md) when starting from an existing node instance.

## Declaration

```ts
type ArrayValue<TItem extends AnyNode> = TItem extends FormNode<infer TNodes, AnyNode> ? {
    [K in keyof TNodes]: NodeValue<TNodes[K]>;
}[] : TItem extends GroupNode<infer TNodes, AnyNode> ? {
    [K in keyof TNodes]: NodeValue<TNodes[K]>;
}[] : NodeValue<TItem>[];
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TItem` | `AnyNode` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FormNode](./form-node.md)
- [GroupNode](./group-node.md)
