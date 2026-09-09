---
title: ObservableLike
---

# ObservableLike

Framework-neutral subset of an Observable accepted from asynchronous validators.

## Import

```ts
import type { ObservableLike } from '@ngblocks/form-nodes';
```

## When to use it

Use for an async source compatible with the library without depending on RxJS types. Honor subscription cleanup so cancelled validation stops its work.

## Declaration

```ts
type ObservableLike<TValue> = {
    subscribe(observer: ObserverLike<TValue>): SubscriptionLike;
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
| `subscribe` | Subscribes the validation observer and returns a handle used for cancellation and cleanup. |

## Related reference

- [Asynchronous validators](../async-validator.md)
- [Public types index](./index.md)
- [ObserverLike](./observer-like.md)
- [SubscriptionLike](./subscription-like.md)
