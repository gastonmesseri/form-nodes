---
title: ArrayPatch
---

# ArrayPatch

Readonly sequence accepted by an array node's `patch()`, mapped through the item patch type.

## Import

```ts
import type { ArrayPatch } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the patch value contract from the array's child or item node types. It describes accepted patch input rather than a complete node value. Use `FormNodeValue<typeof node>` when starting from an existing node instance.

## Declaration

```ts
type ArrayPatch<TItem extends AnyNode> = readonly NodePatch<TItem>[];
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TItem` | `AnyNode` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
