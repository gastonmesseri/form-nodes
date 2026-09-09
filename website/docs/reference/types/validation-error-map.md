---
title: ValidationErrorMap
---

# ValidationErrorMap

Extensible registry used to resolve structured errors by their discriminating `kind`.

## Import

```ts
import type { ValidationErrorMap } from '@ngblocks/form-nodes';
```

## When to use it

Augment this interface from the package module to register application-specific error kinds. Add a literal `kind` and structured properties so `getError(kind)` can narrow them.

## Declaration

```ts
interface ValidationErrorMap extends BuiltInValidationErrorMap {
}
```

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
