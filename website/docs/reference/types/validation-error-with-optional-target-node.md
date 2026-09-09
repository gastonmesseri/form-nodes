---
title: ValidationErrorWithOptionalTargetNode
---

# ValidationErrorWithOptionalTargetNode

An error that may already define its target node.

## Import

```ts
import type { ValidationErrorWithOptionalTargetNode } from '@ngblocks/form-nodes';
```

## When to use it

Use for infrastructure accepting errors before or after target assignment. Check whether a target exists before using it.

## Declaration

```ts
type ValidationErrorWithOptionalTargetNode<TNode = unknown> = ValidationError & {
    readonly targetNode?: TNode;
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
| `targetNode` | Node whose validation state should own this error, when explicitly provided. |
| `formNode` | Concrete control binding that produced this error, when the error is binding-specific. |

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
- [FormNodeBinding](./form-node-binding.md)
- [ValidationError](./validation-error.md)
