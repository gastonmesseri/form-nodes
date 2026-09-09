---
title: NodeErrorsSignal
---

# NodeErrorsSignal

Reactive own-error signal with an optional descendant query. Calling with no options or descendants:false preserves the owning node's target type. descendants:true includes the subtree and is equivalent to allErrors(); descendant targets retain their original nodes and therefore have the broader AnyNode type.

## Import

```ts
import type { NodeErrorsSignal } from '@ngblocks/form-nodes';
```

## When to use it

Use for a node error signal that supports both own and subtree reads. Calling `errors()` retains the owner type; `errors({ descendants: true })` includes descendant targets and matches `allErrors()`.

## Declaration

```ts
type NodeErrorsSignal<TNode extends AnyNode = AnyNode> = {
    (options?: {
        descendants?: false;
    }): readonly ValidationErrorWithTargetNode<TNode>[];
    (options: {
        descendants: true;
    }): readonly ValidationErrorWithTargetNode<AnyNode>[];
    (options: {
        descendants?: boolean;
    }): readonly ValidationErrorWithTargetNode<AnyNode>[];
} & Signal<readonly ValidationErrorWithTargetNode<TNode>[]>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNode` | `AnyNode` | `AnyNode` |

## Related reference

- [Node API and collision-safe access](../node-api.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ValidationErrorWithTargetNode](./validation-error-with-target-node.md)
