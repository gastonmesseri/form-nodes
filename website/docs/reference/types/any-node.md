---
title: AnyNode
---

# AnyNode

Common callable contract for any field, group, form, or array node.

## Import

```ts
import type { AnyNode } from '@ngblocks/form-nodes';
```

## When to use it

Use for a node of unknown kind or structure. Read state and call operations through `$api`; child names can shadow direct members. Use `isFormNode()` to narrow an unknown value to this type.

## Declaration

```ts
type AnyNode = Signal<any> & {
    (): any;
} & {
    $api: Signal<any> & NodeApi;
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `$api` | Collision-safe access to the node API. |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [NodeApi](./node-api.md)
