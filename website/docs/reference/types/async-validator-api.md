---
title: AsyncValidatorApi
---

# AsyncValidatorApi

Mutable node API exposed to asynchronous validators by default.

## Import

```ts
import type { AsyncValidatorApi } from '@ngblocks/form-nodes';
```

## When to use it

Use for the node API exposed by asynchronous validator contexts. Follow the async validation contract for cancellation and result publication.

## Declaration

```ts
type AsyncValidatorApi<TValue> = ValidatorApi<TValue>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [ValidatorApi](./validator-api.md)
