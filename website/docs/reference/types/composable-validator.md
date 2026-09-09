---
title: ComposableValidator
---

# ComposableValidator

Validator that may return errors directly or compose one or more validators dynamically.

## Import

```ts
import type { ComposableValidator } from '@ngblocks/form-nodes';
```

## When to use it

Use for a synchronous rule that can return another validator or a nested validator collection. Returned compositions retain the validation pipeline's state and error handling.

## Declaration

```ts
type ComposableValidator<TValue, TField extends AnyNode = ValidatorNode> = (context: ValidatorContext<TValue, ValidatorApi<TValue>, TField>) => ComposableValidationResult<TValue, TField>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TField` | `AnyNode` | `ValidatorNode` |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ComposableValidationResult](./composable-validation-result.md)
- [ValidatorApi](./validator-api.md)
- [ValidatorContext](./validator-context.md)
