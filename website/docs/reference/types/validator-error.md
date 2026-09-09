---
title: ValidatorError
---

# ValidatorError

An error returned by a validator, optionally assigned to another node.

## Import

```ts
import type { ValidatorError } from '@ngblocks/form-nodes';
```

## When to use it

Use for a validator-returned error with optional target attribution. The pipeline can supply the current node when no explicit target is present.

## Declaration

```ts
type ValidatorError<TNode extends AnyNode = AnyNode> = ValidationError & {
    readonly targetNode?: TNode;
    readonly formNode?: never;
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
| `targetNode` | Node that should own this error. |

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ValidationError](./validation-error.md)
