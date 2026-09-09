---
title: ArrayNode
---

# ArrayNode

Array node model. Omit the first type argument for an unspecified structure, or provide it to preserve exact item types. Generic array nodes retain array operations.

## Import

```ts
import type { ArrayNode } from '@ngblocks/form-nodes';
```

## When to use it

Use for dynamic collections whose first generic is the item node type. Read items and use array operations through the inferred API rather than treating this as a JavaScript array of raw values.

## Declaration

```ts
type ArrayNode<TItem extends AnyNode = AnyNode, TParent extends AnyNode = AnyNode> = Signal<ArrayValue<TItem>> & {
    (): ArrayValue<TItem>;
    api: CallableNodeApi<ArrayApi<TItem, TParent>>;
    $api: CallableNodeApi<ArrayApi<TItem, TParent>>;
} & ArrayIndexes<TItem, TParent> & ArrayApi<TItem, TParent> & HiddenFunctionMembers<keyof ArrayApi<TItem, TParent>>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TItem` | `AnyNode` | `AnyNode` |
| `TParent` | `AnyNode` | `AnyNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `api` | Complete array API and the recommended access path for application code. |
| `$api` | Callable, collision-safe access to the array API. |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ArrayApi](./array-api.md)
- [ArrayIndexes](./array-indexes.md)
- [ArrayValue](./array-value.md)
- [CallableNodeApi](./callable-node-api.md)
