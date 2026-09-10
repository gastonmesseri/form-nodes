---
title: FormPatch
---

# FormPatch

Partial object accepted by a form's `patch()`; omitted child properties remain unchanged.

## Import

```ts
import type { FormPatch } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the patch value contract from the form's child or item node types. It describes accepted patch input rather than a complete node value. Use [`FormNodeValue<typeof node>`](./form-node-value.md) when starting from an existing node instance.

## Declaration

```ts
type FormPatch<TNodes extends Nodes> = {
    [K in keyof TNodes]?: NodePatch<TNodes[K]>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNodes` | `Nodes` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
