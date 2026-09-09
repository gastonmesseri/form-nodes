---
title: ArrayItemWithParent
---

# ArrayItemWithParent

An array item node whose parent is typed as the owning array.

## Import

```ts
import type { ArrayItemWithParent } from '@ngblocks/form-nodes';
```

## When to use it

Use when preserving an array item's navigation relationship in a reusable type. Ordinary consumers should normally let array item access infer it.

## Declaration

```ts
type ArrayItemWithParent<TItem extends AnyNode, TParent extends AnyNode> = TItem extends FieldNode<infer TValue, AnyNode> ? FieldNode<TValue, TParent> : TItem extends FormNode<infer TNodes, AnyNode> ? FormNode<TNodes, TParent> : TItem extends GroupNode<infer TNodes, AnyNode> ? GroupNode<TNodes, TParent> : TItem extends ArrayNode<infer TNestedItem, AnyNode> ? ArrayNode<TNestedItem, TParent> : TItem;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TItem` | `AnyNode` | Required |
| `TParent` | `AnyNode` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ArrayNode](./array-node.md)
- [FieldNode](./field-node.md)
- [FormNode](./form-node.md)
- [GroupNode](./group-node.md)
