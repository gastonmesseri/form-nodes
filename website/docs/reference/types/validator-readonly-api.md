---
title: ValidatorReadonlyApi
---

# ValidatorReadonlyApi

Reactive value and navigation shared by all validator context specializations.

## Import

```ts
import type { ValidatorReadonlyApi } from '@ngblocks/form-nodes';
```

## When to use it

Use when a validator integration should depend only on reactive value and navigation. Avoid requiring mutation operations when observation is sufficient.

## Declaration

```ts
type ValidatorReadonlyApi<TValue> = FieldContext<TValue> & {
    readonly parent: Signal<any>;
    readonly path: Signal<readonly string[]>;
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
| `parent` | Immediate parent inferred by a specialized validator API. |
| `path` | Property names and array indexes locating the validated node from its root. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [FieldContext](./field-context.md)
