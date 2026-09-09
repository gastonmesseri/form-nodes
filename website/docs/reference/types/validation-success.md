---
title: ValidationSuccess
---

# ValidationSuccess

Indicates that validation completed without errors.

## Import

```ts
import type { ValidationSuccess } from '@ngblocks/form-nodes';
```

## When to use it

Use when a rule explicitly reports successful validation. Return the supported success values rather than arbitrary truthy or falsy values.

## Declaration

```ts
type ValidationSuccess = null | undefined | void;
```

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
