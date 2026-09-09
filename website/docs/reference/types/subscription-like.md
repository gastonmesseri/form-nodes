---
title: SubscriptionLike
---

# SubscriptionLike

Handle returned by an observable-like source so the current validation run can release it.

## Import

```ts
import type { SubscriptionLike } from '@ngblocks/form-nodes';
```

## When to use it

Return this cleanup handle from an observable-like source. The validation pipeline uses it to release obsolete work.

## Declaration

```ts
type SubscriptionLike = {
    unsubscribe(): void;
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `unsubscribe` | Stops the source and releases resources associated with its subscription. |

## Related reference

- [Asynchronous validators](../async-validator.md)
- [Public types index](./index.md)
