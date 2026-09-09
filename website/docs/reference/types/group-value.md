---
title: GroupValue
---

# GroupValue

Object value produced by a group, with each child node mapped to its readable value.

## Import

```ts
import type { GroupValue } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the read value contract from the group's child or item node types. The result describes raw data, not child nodes. Use `FormNodeValue<typeof node>` when starting from an existing node instance.

## Declaration

```ts
type GroupValue<TNodes extends Nodes> = FormValue<TNodes>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNodes` | `Nodes` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [FormValue](./form-value.md)
