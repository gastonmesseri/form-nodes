---
title: DynamicNode
---

# DynamicNode

A dynamically discovered node whose concrete primitive is not known statically.

## Import

```ts
import type { DynamicNode } from '@ngblocks/form-nodes';
```

## When to use it

Use when the node kind is unknown but you know child names do not shadow common members. Choose `AnyNode` with `$api` when you cannot make that guarantee.

## Declaration

```ts
type DynamicNode = PublicNode<AnyNode> & Omit<NodeApi, 'patch'> & {
    api: Signal<any> & NodeApi;
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `api` | Complete common node API. |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [NodeApi](./node-api.md)
