---
title: CustomValidationError
---

# CustomValidationError

A custom validation error whose additional application-specific properties remain unknown.

## Import

```ts
import type { CustomValidationError } from '@ngblocks/form-nodes';
```

## When to use it

Use for unregistered custom errors. Additional data remains unknown; narrow or register the error kind before treating custom properties as concrete types.

## Declaration

```ts
type CustomValidationError<TKind extends string = string> = ValidationError & Readonly<Record<string, unknown>> & {
    readonly kind: TKind;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TKind` | `string` | `string` |

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
- [ValidationError](./validation-error.md)
