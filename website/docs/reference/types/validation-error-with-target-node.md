---
title: ValidationErrorWithTargetNode
---

# ValidationErrorWithTargetNode

An error associated with a specific target node.

## Import

```ts
import type { ValidationErrorWithTargetNode } from '@ngblocks/form-nodes';
```

## When to use it

Use when consuming errors already associated with a node. The generic preserves the target node type, and binding-specific attribution may also be available.

## Declaration

```ts
type ValidationErrorWithTargetNode<TNode = unknown> = ValidationError & {
    readonly targetNode: TNode;
    readonly formNode?: FormNodeBinding;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNode` | Unconstrained | `unknown` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `targetNode` | Node whose validation state owns this error. |
| `formNode` | Concrete control binding that produced this error, when the error is binding-specific. |

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
- [FormNodeBinding](./form-node-binding.md)
- [ValidationError](./validation-error.md)
