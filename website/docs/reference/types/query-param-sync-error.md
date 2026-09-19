---
title: QueryParamSyncError
---

# QueryParamSyncError

A URL conversion or navigation failure, independent of form validation.

## Import

```ts
import type { QueryParamSyncError } from '@ngblocks/form-nodes/router';
```

## When to use it

Handle parsing, serialization, or navigation failures separately from form validation.

## Declaration

```ts
type QueryParamSyncError = {
    key: string | null;
    phase: 'parse' | 'serialize' | 'navigation';
    cause: unknown;
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `key` | Query key for a conversion failure; null for a shared navigation failure. |
| `phase` | Operation that failed. |
| `cause` | Original thrown error or a rejected-navigation error. |

## Related reference

- [Query parameter synchronization](../sync-query-params.md)
- [Public types index](./index.md)
