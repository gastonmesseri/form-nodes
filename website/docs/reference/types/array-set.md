---
title: ArraySet
---

# ArraySet

Complete readonly sequence accepted by an array node's `set()`.

## Import

```ts
import type { ArraySet } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the replace value contract from the array's child or item node types. It describes the complete value accepted by set(). Use `FormNodeValue<typeof node>` when starting from an existing node instance.

## Declaration

```ts
type ArraySet<TItem extends AnyNode> = readonly NodeSet<TItem>[];
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TItem` | `AnyNode` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
