---
title: DisabledReason
---

# DisabledReason

Identifies one active cause of a node's disabled state.

## Import

```ts
import type { DisabledReason } from '@ngblocks/form-nodes';
```

## When to use it

Use when presenting or inspecting why a node is disabled. Preserve the originating node information when distinguishing local and inherited causes.

## Declaration

```ts
type DisabledReason<TNode extends AnyNode = AnyNode> = {
    readonly sourceNode: TNode;
    readonly message?: string;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNode` | `AnyNode` | `AnyNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `sourceNode` | Node on which this reason originated. Descendants retain the original source node. |
| `message` | Optional user-facing explanation supplied by the disabled option or disable(). |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
