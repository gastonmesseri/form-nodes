---
title: ValidationResult
---

# ValidationResult

A successful result, an error or message, or several errors and messages. Strings become errors with kind 'custom', including empty strings.

## Import

```ts
import type { ValidationResult } from '@ngblocks/form-nodes';
```

## When to use it

Use as an explicit synchronous return annotation to break an inference cycle while preserving checked results. Nullish success, supported messages, and error collections follow the validator contract.

## Declaration

```ts
type ValidationResult = ValidationSuccess | string | ValidatorError | readonly (string | ValidatorError)[];
```

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
- [ValidationSuccess](./validation-success.md)
- [ValidatorError](./validator-error.md)
