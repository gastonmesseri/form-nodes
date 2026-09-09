---
title: BuiltInValidationError
---

# BuiltInValidationError

Union of every validation error provided by the library.

## Import

```ts
import type { BuiltInValidationError } from '@ngblocks/form-nodes';
```

## When to use it

Use when a contract accepts only library-provided error kinds. Narrow by `kind` before reading kind-specific data such as bounds or duplicate indexes.

## Declaration

```ts
type BuiltInValidationError = BuiltInValidationErrorMap[keyof BuiltInValidationErrorMap];
```

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
