---
title: FieldContext
---

# FieldContext

Reactive context available to validation functions for the current field.

## Import

```ts
import type { FieldContext } from '@ngblocks/form-nodes';
```

## When to use it

Use when a contract specifically requires the low-level reactive field context. Consumer-authored reusable rules normally use `ValidatorContext` or contextual inference through `validator()`.

## Declaration

```ts
type FieldContext<TValue> = {
    readonly value: Signal<TValue>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `value` | Current value of the node being validated. Reading it creates a reactive dependency. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
