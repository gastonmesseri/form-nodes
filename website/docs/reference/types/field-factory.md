---
title: FieldFactory
---

# FieldFactory

A configured field factory with nullable and strict declaration modes.

## Import

```ts
import type { FieldFactory } from '@ngblocks/form-nodes';
```

## When to use it

Use when passing a configured field factory to shared declaration code. Its overloads preserve nullable and strict modes.

## Declaration

```ts
type FieldFactory<TNullable extends boolean> = ([
    TNullable
] extends [
    false
] ? NonNullableFieldFactory : typeof import('./field').field) & FieldNullabilityOverrides;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNullable` | `boolean` | Required |

## Related reference

- [createFormPrimitives()](../create-form-primitives.md)
- [Public types index](./index.md)
- [NonNullableFieldFactory](./non-nullable-field-factory.md)
