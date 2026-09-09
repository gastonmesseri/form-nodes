---
title: ObserverLike
---

# ObserverLike

Minimal observer contract accepted from an asynchronous validation source.

## Import

```ts
import type { ObserverLike } from '@ngblocks/form-nodes';
```

## When to use it

Use when implementing an observable-like validator source. Deliver values and completion or errors according to the observer contract.

## Declaration

```ts
type ObserverLike<TValue> = {
    next(value: TValue): void;
    error(error: unknown): void;
    complete(): void;
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
| `next` | Emits the validation result for the current run. Only the first emission is used. |
| `error` | Reports a source failure to the validator's configured `onError` handler. |
| `complete` | Completes the source. Completing before an emission is treated as successful validation. |

## Related reference

- [Asynchronous validators](../async-validator.md)
- [Public types index](./index.md)
