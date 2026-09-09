---
title: GroupSet
---

# GroupSet

Complete object accepted by a group's `set()`, recursively using each child's set type.

## Import

```ts
import type { GroupSet } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the replace value contract from the group's child or item node types. It describes the complete value accepted by set(). Use `FormNodeValue<typeof node>` when starting from an existing node instance.

## Declaration

```ts
type GroupSet<TNodes extends Nodes> = FormSet<TNodes>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNodes` | `Nodes` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [FormSet](./form-set.md)
