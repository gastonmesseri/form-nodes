---
title: QueryParamCodec
---

# QueryParamCodec

Deprecated compatibility alias for QueryParamSerializer.

## Import

```ts
import type { QueryParamCodec } from '@ngblocks/form-nodes/router';
```

## When to use it

Compatibility alias for QueryParamSerializer; migrate existing type annotations to the preferred name.

## Declaration

```ts
type QueryParamCodec<T> = QueryParamSerializer<T>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `T` | Unconstrained | Required |

## Related reference

- [Query parameter synchronization](../sync-query-params.md)
- [Public types index](./index.md)
- [QueryParamSerializer](./query-param-serializer.md)
