---
title: ValidationError
---

# ValidationError

A validation error produced by a validator.

## Import

```ts
import type { ValidationError } from '@ngblocks/form-nodes';
```

## When to use it

Use for the base error category and optional human-readable message. Prefer a targeted error type when consuming a node's error collection.

## Declaration

```ts
interface ValidationError {
    readonly kind: string;
    readonly message?: string;
}
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `kind` | Identifies the error category. |
| `message` | Optional human-readable description of the error. |

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
