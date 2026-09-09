---
title: ValidationStatus
---

# ValidationStatus

Aggregate validation result.

## Import

```ts
import type { ValidationStatus } from '@ngblocks/form-nodes';
```

## When to use it

Use to distinguish valid, invalid, and unresolved validation states. Pending asynchronous work does not necessarily make a node invalid; consult the validation-state guide for aggregation.

## Declaration

```ts
type ValidationStatus = 'valid' | 'invalid' | 'unknown';
```

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
