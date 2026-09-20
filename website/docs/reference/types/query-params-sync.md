---
title: QueryParamsSync
---

# QueryParamsSync

A live query connection with raw URL signals and explicit lifecycle control.

## Import

```ts
import type { QueryParamsSync } from '@ngblocks/form-nodes/router';
```

## When to use it

Read raw URL query signals and synchronization state, or unsubscribe a connection early.

## Declaration

```ts
type QueryParamsSync<K extends string = string> = {
    readonly params: {
        readonly [P in K]: Signal<string | null>;
    };
    readonly pending: Signal<boolean>;
    readonly closed: Signal<boolean>;
    unsubscribe(): void;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `K` | `string` | `string` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `params` | Readonly signals for the configured keys, before serializer parsing. Values are URL-decoded strings, or null when absent. Repeated keys return their first value. Read an array-serializer source for all parsed values. Snapshots update on accepted navigation and freeze when the connection closes. |
| `pending` | Whether this connection has queued or in-flight URL writes. Starts when a committed edit is observed in a microtask; excludes control debounce, validation, external navigation, and other connections' work. Becomes false after settlement or cleanup. |
| `closed` | Whether all bindings have ended through unsubscribe or injector cleanup. An empty map is already closed and has no parameter signals. |
| `unsubscribe` | Idempotently release this connection and its pending writes. Fields retain their values. URL signals retain their last snapshot. Injector destruction also performs this cleanup automatically. |

## Related reference

- [Query parameter synchronization](../sync-query-params.md)
- [Public types index](./index.md)
