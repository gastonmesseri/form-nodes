---
title: AddedNode
---

# AddedNode

Result of attaching a node definition or shorthand dynamically to an object node.

## Import

```ts
import type { AddedNode } from '@ngblocks/form-nodes';
```

## When to use it

Use when describing the result of a dynamic addition. The resulting node preserves the normalized definition and its new parent type.

## Declaration

```ts
type AddedNode<TDefinition, TParent extends AnyNode> = NodeWithParent<NormalizedNode<TDefinition>, TParent>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TDefinition` | Unconstrained | Required |
| `TParent` | `AnyNode` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
