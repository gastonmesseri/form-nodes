---
title: Validators
---

# Validators

Readonly normalized collection of composable validators for a node value.

## Import

```ts
import type { Validators } from '@ngblocks/form-nodes';
```

## When to use it

Use for a normalized readonly collection of composable rules. Use `ValidatorSource` for public inputs that also accept a single validator or nullish entries.

## Declaration

```ts
type Validators<TValue, TField extends AnyNode = ValidatorNode> = readonly ComposableValidator<TValue, TField>[];
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
- [ComposableValidator](./composable-validator.md)
