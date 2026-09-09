---
title: ArrayIndexes
---

# ArrayIndexes

Numeric node access with parent-aware array item types.

## Import

```ts
import type { ArrayIndexes } from '@ngblocks/form-nodes';
```

## When to use it

Use when describing an array node's numeric property access. Each indexed item retains the owning array as its parent.

## Declaration

```ts
type ArrayIndexes<TItem extends AnyNode, TParent extends AnyNode> = {
    readonly [index: number]: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
};
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
