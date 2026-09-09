---
title: AsyncValidationResult
---

# AsyncValidationResult

Promise-like or observable-like result accepted from an asynchronous validator.

## Import

```ts
import type { AsyncValidationResult } from '@ngblocks/form-nodes';
```

## When to use it

Use for the Promise-like or Observable-like result of async validation. It describes the result container; create the validator itself with `asyncValidator()`.

## Declaration

```ts
type AsyncValidationResult = PromiseLike<ValidationResult> | ObservableLike<ValidationResult>;
```

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
- [ObservableLike](./observable-like.md)
- [ValidationResult](./validation-result.md)
