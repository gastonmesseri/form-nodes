---
title: ValidationErrorWithoutTargetNode
---

# ValidationErrorWithoutTargetNode

An error returned by a field validator before its target node is assigned.

## Import

```ts
import type { ValidationErrorWithoutTargetNode } from '@ngblocks/form-nodes';
```

## When to use it

Use when returning a rule error for the current node and letting the pipeline assign ownership. Use a targeted contract only when intentionally redirecting the error.

## Declaration

```ts
type ValidationErrorWithoutTargetNode = ValidationError & {
    readonly targetNode?: never;
    readonly formNode?: never;
};
```

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
- [ValidationError](./validation-error.md)
