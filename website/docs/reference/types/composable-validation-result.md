---
title: ComposableValidationResult
---

# ComposableValidationResult

Result accepted from a composable validator, including nested validators and successful entries.

## Import

```ts
import type { ComposableValidationResult } from '@ngblocks/form-nodes';
```

## When to use it

Use for synchronous validator results that may include further validator composition. Use `ValidationResult` when the rule only returns errors or success.

## Declaration

```ts
type ComposableValidationResult<TValue, TField extends AnyNode = ValidatorNode> = ValidationResult | Validator<TValue> | ComposableValidator<TValue, TField> | readonly (ComposableValidator<TValue, TField> | ValidationSuccess)[];
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TField` | `AnyNode` | `ValidatorNode` |

## Related reference

- [Validation error types](../validation-errors.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ComposableValidator](./composable-validator.md)
- [ValidationResult](./validation-result.md)
- [ValidationSuccess](./validation-success.md)
- [Validator](./validator.md)
