---
title: ArrayPatch
---

# ArrayPatch

Complete readonly sequence accepted by an array node's `patch()`, identical to its set value.

## Import

```ts
import type { ArrayPatch } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the patch value contract from the array's child or item node types. It describes accepted patch input rather than a complete node value. Use [`FormNodeValue<typeof node>`](./form-node-value.md) when starting from an existing node instance.

## Declaration

```ts
type ArrayPatch<TItem extends AnyNode> = ArraySet<TItem>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TItem` | `AnyNode` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ArraySet](./array-set.md)
