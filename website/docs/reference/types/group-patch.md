---
title: GroupPatch
---

# GroupPatch

Partial object accepted by a group's `patch()`; omitted child properties remain unchanged.

## Import

```ts
import type { GroupPatch } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the patch value contract from the group's child or item node types. It describes accepted patch input rather than a complete node value. Use [`FormNodeValue<typeof node>`](./form-node-value.md) when starting from an existing node instance.

## Declaration

```ts
type GroupPatch<TNodes extends Nodes> = FormPatch<TNodes>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNodes` | `Nodes` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [FormPatch](./form-patch.md)
