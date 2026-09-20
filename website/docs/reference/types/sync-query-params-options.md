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

Share ownership, history behavior, URL synchronization hooks, and error handling across a parameter map.

## Declaration

```ts
type SyncQueryParamsOptions<TValues extends Record<string, unknown> = Record<string, unknown>> = {
    injector?: Injector;
    history?: 'replace' | 'push';
    onInitialUrlSync?(event: QueryParamUrlSyncEvent<TValues> & {
        readonly reason: 'initial';
    }): void;
    onUrlSync?(event: QueryParamUrlSyncEvent<TValues>): void;
    onError?(error: QueryParamSyncError): void;
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
| `injector` | Router and lifetime owner. |
| `history` | Default history mode. Any changed push entry makes a batch push. |
| `onInitialUrlSync` | Runs once after all initial URL values and fallbacks have been applied. Runs synchronously before onUrlSync and before the connection is returned. Read event.values or the sources; the receiving connection is not assigned yet. Empty or already disposed connections do not notify. Does not await validation. |
| `onUrlSync` | Runs once per complete URL-to-source synchronization, including initialization. reason is initial for hydration and navigation for later accepted restorations. Own write acknowledgments, unrelated query changes, and rejected navigations do not notify. Redirects notify when their final URL imports source values. Callbacks run untracked, do not await validation or returned promises, and report thrown errors or rejected promises through Angular ErrorHandler. |
| `onError` | Receives conversion and navigation failures separately from validation. |

## Related reference

- [Query parameter synchronization](../sync-query-params.md)
- [Public types index](./index.md)
- [QueryParamSyncError](./query-param-sync-error.md)
- [QueryParamUrlSyncEvent](./query-param-url-sync-event.md)
