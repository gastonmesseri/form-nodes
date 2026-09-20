---
title: QueryParamUrlSyncEvent
---

# QueryParamUrlSyncEvent

Values captured after importing a complete query parameter synchronization.

## Import

```ts
import type { QueryParamUrlSyncEvent } from '@ngblocks/form-nodes/router';
```

## When to use it

Read the reason and typed committed value snapshot after URL hydration or restoration.

## Declaration

```ts
type QueryParamUrlSyncEvent<TValues extends Record<string, unknown> = Record<string, unknown>> = {
    readonly reason: 'initial' | 'navigation';
    readonly values: Readonly<TValues>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValues` | `Record<string, unknown>` | `Record<string, unknown>` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `reason` | Initial hydration or a later accepted URL restoration. |
| `values` | Current committed source values, indexed by configured query names. The map is a shallow readonly snapshot; object and array values are not cloned. |

## Related reference

- [Query parameter synchronization](../sync-query-params.md)
- [Public types index](./index.md)
