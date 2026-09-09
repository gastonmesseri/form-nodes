---
title: ArrayItems
---

# ArrayItems

The typed collection of item nodes exposed by an array node.

## Import

```ts
import type { ArrayItems } from '@ngblocks/form-nodes';
```

## When to use it

Use for the item-node collection returned by array navigation. These are nodes rather than raw array values.

## Declaration

```ts
type ArrayItems<TItem extends AnyNode, TParent extends AnyNode> = readonly ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>[];
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TItem` | `AnyNode` | Required |
| `TParent` | `AnyNode` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ArrayItemWithParent](./array-item-with-parent.md)
- [ArrayNode](./array-node.md)
