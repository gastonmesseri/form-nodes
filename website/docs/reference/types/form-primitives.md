---
title: FormPrimitives
---

# FormPrimitives

The family of configured field, form, group, and array factories.

## Import

```ts
import type { FormPrimitives } from '@ngblocks/form-nodes';
```

## When to use it

Use for a bundle returned by [`createFormPrimitives()`](../create-form-primitives.md). Keep the configured factories together when sharing defaults across declarations.

## Declaration

```ts
type FormPrimitives<TNullable extends boolean = boolean> = {
    field: FieldFactory<TNullable>;
    form: FormFactory<TNullable>;
    group: GroupFactory<TNullable>;
    array: ArrayFactory<TNullable>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNullable` | `boolean` | `boolean` |

## Related reference

- [createFormPrimitives()](../create-form-primitives.md)
- [Public types index](./index.md)
- [ArrayFactory](./array-factory.md)
- [FieldFactory](./field-factory.md)
- [FormFactory](./form-factory.md)
- [GroupFactory](./group-factory.md)
