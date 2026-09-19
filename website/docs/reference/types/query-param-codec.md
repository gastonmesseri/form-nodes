---
title: QueryParamCodec
---

# QueryParamCodec

Converts decoded, repeated query values to a field value and back.

## Import

```ts
import type { QueryParamCodec } from '@ngblocks/form-nodes/router';
```

## When to use it

Define a conversion between decoded query values and a field value.

## Declaration

```ts
type QueryParamCodec<T> = {
    parse(values: readonly string[]): T;
    serialize(value: T): readonly string[] | null;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `T` | Unconstrained | Required |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `parse` | Parses present values. Throw for malformed input; absence uses the binding default. |
| `serialize` | Returns decoded values; null removes the key. Angular Router handles URL escaping. |

## Related reference

- [Query parameter synchronization](../sync-query-params.md)
- [Public types index](./index.md)
