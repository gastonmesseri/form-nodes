---
title: GroupNode
---

# GroupNode

An object-shaped structural node without its own submission workflow. Omit the first type argument for an unspecified structure, or provide it to preserve exact child types.

## Import

```ts
import type { GroupNode } from '@ngblocks/form-nodes';
```

## When to use it

Use for a structural group with no independent submit action or submitted history. Its first generic describes child nodes; nested forms keep their own submission behavior.

## Declaration

```ts
type GroupNode<TNodes extends Nodes = never, TParent extends AnyNode = AnyNode> = [
    TNodes
] extends [
    never
] ? GenericGroupNode : Signal<{
    [K in keyof TNodes]: NodeValue<TNodes[K]>;
}> & {
    (): {
        [K in keyof TNodes]: NodeValue<TNodes[K]>;
    };
} & GroupApiProperty<TNodes, TParent> & GroupChildren<TNodes, TParent> & Omit<GroupApi<TNodes, TParent>, keyof TNodes> & HiddenFunctionMembers<keyof TNodes | keyof GroupApi<TNodes, TParent>>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNodes` | `Nodes` | `never` |
| `TParent` | `AnyNode` | `AnyNode` |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [GroupApi](./group-api.md)
