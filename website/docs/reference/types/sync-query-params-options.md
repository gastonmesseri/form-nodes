---
title: SyncQueryParamsOptions
---

# SyncQueryParamsOptions

Shared options for a synchronized query parameter map.

## Import

```ts
import type { SyncQueryParamsOptions } from '@ngblocks/form-nodes/router';
```

## When to use it

Share ownership, history behavior, and error handling across a parameter map.

## Declaration

```ts
type SyncQueryParamsOptions = {
    injector?: Injector;
    history?: 'replace' | 'push';
    onError?(error: QueryParamSyncError): void;
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `injector` | Router and lifetime owner. |
| `history` | Default history mode. Any changed push entry makes a batch push. |
| `onError` | Receives conversion and navigation failures separately from validation. |

## Related reference

- [Query parameter synchronization](../sync-query-params.md)
- [Public types index](./index.md)
- [QueryParamSyncError](./query-param-sync-error.md)
