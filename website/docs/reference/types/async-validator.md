---
title: AsyncValidator
---

# AsyncValidator

Validator marked by `asyncValidator()` for asynchronous scheduling and cancellation.

## Import

```ts
import type { AsyncValidator } from '@ngblocks/form-nodes';
```

## When to use it

Use for the marked result of [`asyncValidator()`](../async-validator.md). A plain function returning a Promise is not a substitute for configuring a validator through the helper.

## Declaration

```ts
type AsyncValidator<TValue, TField extends AnyNode = AnyNode> = (context: ValidatorContext<TValue, ValidatorApi<TValue>, TField>) => ValidationResult;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TField` | `AnyNode` | `AnyNode` |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ValidationResult](./validation-result.md)
- [ValidatorApi](./validator-api.md)
- [ValidatorContext](./validator-context.md)
