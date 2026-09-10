---
title: Validator
---

# Validator

Synchronous validator receiving the current value as a reactive signal.

## Import

```ts
import type { Validator } from '@ngblocks/form-nodes';
```

## When to use it

Use to type a reusable synchronous rule. Author it through [`validator()`](../validator.md) when you want contextual value and owner inference from the consuming declaration.

## Declaration

```ts
type Validator<TValue> = (context: FieldContext<TValue>) => ValidationResult;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [FieldContext](./field-context.md)
- [ValidationResult](./validation-result.md)
