---
title: ValidationErrorForKind
---

# ValidationErrorForKind

Resolves a known error kind to its structured type, with a generic fallback for custom kinds.

## Import

```ts
import type { ValidationErrorForKind } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the structured error associated with a kind, including registered custom kinds. Its fallback does not prove application-specific properties exist.

## Declaration

```ts
type ValidationErrorForKind<TKind extends string> = (TKind extends keyof ValidationErrorMap ? ValidationErrorMap[TKind] : CustomValidationError<TKind>) & {
    readonly kind: TKind;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TKind` | `string` | Required |

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
- [CustomValidationError](./custom-validation-error.md)
- [ValidationErrorMap](./validation-error-map.md)
