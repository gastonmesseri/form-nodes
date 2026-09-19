---
title: syncQueryParams
---

import CodeBlock from '@theme/CodeBlock';
import source from '!!raw-loader!../../examples/query-params.typecheck.ts';

# syncQueryParams

Import `syncQueryParams`, `queryParam`, and their types from `@ngblocks/form-nodes/router`.
The helper synchronizes a typed map of query keys to existing form nodes and writable Angular signals and returns `QueryParamsSync<K>`,
where `K` is the union of the configured query keys. It requires a Router-providing injection context or explicit injector.

```ts
syncQueryParams(bindings, options?)
```

Declare the connection as a component property after its sources. With Router configured in
the application providers, the component initializer supplies the injection context and its
destruction automatically cleans up the connection.

<CodeBlock language="ts" title="search-page.ts">{source}</CodeBlock>

The connection exposes:

| Member | Contract |
| --- | --- |
| `params.key()` | Readonly `Signal<string \| null>` for each bound key, URL-decoded before codec parsing; the first value for repeated keys. |
| `pending()` | Readonly `Signal<boolean>` for this connection's queued and in-flight writes, starting when committed edits are observed. |
| `closed()` | Readonly `Signal<boolean>` indicating that all entries have ended. Empty maps start closed. |
| `unsubscribe()` | Idempotent early cleanup; also performed through injector ownership. |

URL signals initialize from the activation URL, then change on accepted navigation. Field edits do
not update them until Router accepts the write. After cleanup they retain their last snapshot;
`pending()` is false. While any binding remains active, URL signals track configured keys even if another
entry's owner has been destroyed. `pending()` excludes form debounce, validation, and other helpers.

Each binding is a node, writable signal, or configuration object:

| Member | Meaning | Default |
| --- | --- | --- |
| `source` | Existing `field()`, `form()`, `group()`, `array()`, or writable Angular signal, with its value type preserved. | Required in configured entries. |
| `codec` | `'string'`, `'number'`, `'integer'`, `'boolean'`, `'array'`, `'json'`, or a compatible `QueryParamCodec<T>` object. Names match the `queryParam` factories. | Infer from a string/number/boolean fallback. |
| `defaultValue` | Fixed fallback for missing or malformed URL values. | Committed node value or current signal value at registration. |
| `clearOnDefault` | Remove values matching the serialized default. | `false` |
| `history` | `replace` or `push`; any changed push entry makes a batch push. | Shared option, otherwise `replace`. |
| `injector` | Additional lifetime owner for this entry, resolving the same Router. | Shared helper owner. |

The shared options are `injector`, `history`, and `onError(error)`. The explicit injector or current
injection context owns the whole helper. `onError` receives `QueryParamSyncError`; omission reports
to Angular `ErrorHandler`. Lifecycle cleanup and manual unsubscribe release observations, queued
writes, and key registrations. Fields and their initial reset values remain intact.

The map accepts every node kind and writable signals, including `linkedSignal()`. Arrays and objects require explicit codecs.
Use `'array'` for repeated string values; an empty array removes the key. Use `'json'` for objects or
arrays encoded as one JSON string, including numeric arrays. JSON empty arrays remain `[]` in the URL.
JSON validates syntax but trusts the expected source type; use a custom codec for schema validation.
Arrays are not inferred. Scalar and repeated-array codec names are checked against the source type.
Readonly/computed signals cannot receive URL values and are rejected. Aggregate imports use the node’s
existing `set()` behavior. Nodes retain committed-value observation and node ownership; writable
signals use their own equality and the helper/entry injector lifetime. Multiple helpers on one Router
share batching; duplicate active keys are rejected.

See [the complete guide](../guides/query-params.md) for initialization, navigation conflicts,
SSR, conversion rules, and a checked component example.

- [QueryParamBinding](./types/query-param-binding.md)
- [QueryParamCodec](./types/query-param-codec.md)
- [QueryParamSyncError](./types/query-param-sync-error.md)
- [SyncQueryParamsOptions](./types/sync-query-params-options.md)

- [QueryParamsSync](./types/query-params-sync.md)
