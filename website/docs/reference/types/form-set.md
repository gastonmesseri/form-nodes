---
title: FormSet
---

# FormSet

Complete object accepted by a form's `set()`, recursively using each child's set type.

## Import

```ts
import type { FormSet } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the replace value contract from the form's child or item node types. It describes the complete value accepted by set(). Use `FormNodeValue<typeof node>` when starting from an existing node instance.

## Declaration

```ts
type FormSet<TNodes extends Nodes> = {
    [K in keyof TNodes]: NodeSet<TNodes[K]>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNodes` | `Nodes` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
