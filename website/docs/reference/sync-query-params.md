---
title: syncQueryParams()
---

import CodeBlock from '@theme/CodeBlock';
import basicSource from '!!raw-loader!../../examples/query-params-basic.typecheck.ts';
import signalsSource from '!!raw-loader!../../examples/query-params-signals.typecheck.ts';
import arraysSource from '!!raw-loader!../../examples/query-params-arrays.typecheck.ts';
import jsonSource from '!!raw-loader!../../examples/query-params-json.typecheck.ts';
import customSerializerSource from '!!raw-loader!../../examples/query-params-custom-serializer.typecheck.ts';
import hooksSource from '!!raw-loader!../../examples/query-params-hooks.typecheck.ts';
import lifecycleSource from '!!raw-loader!../../examples/query-params-lifecycle.typecheck.ts';

# syncQueryParams() {#syncqueryparams}

`syncQueryParams()` connects existing form nodes and writable Angular signals to URL query
parameters in both directions. Opening a URL restores the source values; editing those sources
updates the URL. Use it for shareable searches, filters, pagination, and saved view settings.

Import the helper, [`queryParam`](#built-in-serializers), and their types from
`@ngblocks/form-nodes/router`. The result is a [`QueryParamsSync<K>`](./types/query-params-sync.md)
connection, where `K` is the union of the query names in your binding map.

:::info Angular Router and injection context

Install a compatible `@angular/router` and configure `provideRouter(routes)` in your application's
providers. Declare the connection in a component property initializer, or pass an explicit
[`injector`](#shared-injector) when connecting later. The main forms package remains usable without
Router; this optional entry point requires it.

:::

## Basic example {#basic-example}

This search page synchronizes just two fields. The query key `q` maps to `form.search`, so URL
names do not have to match form property names. Declare the sources before the connection.

<CodeBlock language="ts" title="search-page.ts">{basicSource}</CodeBlock>

Opening `/search?q=angular&page=3` sets `form.search()` to `'angular'` and `form.page()` to
`3` during initialization. Without those parameters, the fields start with `''` and `1`.
Search edits replace the current history entry; page changes push an entry that Back can revisit.
The component's injector automatically disconnects the helper when the component is destroyed.

## 🧭 API map {#api-map}

| I want to… | Start with | Details |
| --- | --- | --- |
| Synchronize search and pagination | Bind existing form children | [Basic example](#basic-example) and [signatures](#signatures) |
| Synchronize state without a form | Writable signals | [Signals](#signals) |
| Put several selections in the URL | `serializer: 'array'` or `'json'` | [Arrays](#arrays) |
| Store a complete form or group under one key | `serializer: 'json'` | [Structured values](#structured-values) |
| Choose what missing or malformed values mean | `defaultValue` | [Defaults and initialization](#defaults-and-initialization) |
| Omit default-valued parameters | `clearOnDefault: true` | [Default removal](#clear-on-default) |
| Make Back revisit meaningful changes | `history: 'push'` | [History and batching](#history-and-batching) |
| Validate a URL representation or support a literal union | `QueryParamSerializer<T>` | [Custom serializers](#custom-serializers) |
| Read accepted URL text and synchronization status | `params`, `pending()`, `closed()` | [Property reference](#property-reference) |
| Connect later or disconnect early | `injector`, `unsubscribe()` | [Ownership](#ownership) and [method reference](#method-reference) |
| React after URL values have been applied | `onInitialUrlSync`, `onUrlSync` | [URL synchronization hooks](#url-sync-hooks) |
| Handle conversion failures or rejected navigation | `onError` | [Error handling](#on-error) |

## 📐 Signatures {#signatures}

```ts
syncQueryParams(bindings);
syncQueryParams(bindings, options);
```

Both call forms use the same generic function. Each map entry accepts either a source directly or
`{ source, ...bindingOptions }`; direct and configured entries can coexist in the same map.
The second argument supplies shared options, not another source.

| Argument | Contract |
| --- | --- |
| `bindings` | A map of query names to existing nodes, writable signals, or [`QueryParamBinding<T>`](./types/query-param-binding.md) objects. Each source retains its own value type. |
| `options` | Optional [`SyncQueryParamsOptions`](./types/sync-query-params-options.md): shared `injector`, `history`, `onInitialUrlSync`, `onUrlSync`, and `onError`. |
| Return | [`QueryParamsSync<K>`](./types/query-params-sync.md): readonly raw parameter signals, connection state, and `unsubscribe()`. |

In the first example, `querySync` is inferred as `QueryParamsSync<'q' | 'page'>`.
`querySync.params.page()` is `string | null`, while `form.page()` is `number`. Only configured
keys are available under `params`; unrelated URL parameters are preserved without becoming members
of the connection.

The map and options are read when the helper is called. They are not reactive configuration.
An empty map returns an already closed connection with an empty `params` object. For a different
set of query keys, unsubscribe and create a new connection. Duplicate active bindings for one
query key on the same Router are rejected, including bindings in separate helper calls.

## Supported sources {#sources}

| Source | Useful for | Conversion and incoming writes |
| --- | --- | --- |
| [`field()`](./field.md) | Search text, page numbers, flags, or one atomic object/array | Scalar inference or an explicit serializer. URL imports use the field's `set()`. |
| [`form()`](./form.md), [`group()`](./group.md), or a structural group | A complete saved filter model under one query key | Use JSON or a custom serializer. Imports use existing aggregate `set()` behavior. |
| [`array()`](./array.md) | Collections whose items need individual nodes | Use `'array'` for string items, JSON for other values, or a custom serializer. Imports reconcile children normally. |
| Angular `signal()`, `linkedSignal()`, or writable `model()` | State without form validation or interaction markers | Uses the signal's read/set contract and equality function. |

Nodes publish committed values, even when their public equality comparator hides a change.
Writable signals respect their own equality: a rejected equal write does not publish a URL change.
Readonly signals, computed signals, and ordinary functions cannot receive URL imports and are not
supported. There is no need to mirror a field into a separate signal to connect it.

### Writable signals {#signals}

An explicit serializer allows a signal to start at `null` and receive its initial value from the URL.
In this example, `?page=4` initializes `page()` to `4`. With no `page` parameter it remains `null`;
a later history entry without `page` restores that same fallback.

<CodeBlock language="ts" title="results-page.ts">{signalsSource}</CodeBlock>

Signals and nodes can share one map and one URL batch. `linkedSignal()` dependency changes also
publish accepted signal value changes. Plain signals do not acquire validation, dirty/touched
state, reset behavior, or control debounce by being synchronized.

### Repeated arrays and array nodes {#arrays}

Use `'array'` for repeated string values, such as `?tag=angular&tag=forms`. Use `'json'` when a
numeric or object array should occupy one query value. Both an array-valued field and an
`array()` node are supported:

<CodeBlock language="ts" title="filter-page.ts">{arraysSource}</CodeBlock>

After `onSelectFilters()`, `tag` has two occurrences and the decoded `ids` parameter is `'[10,20]'`.
The writes are batched. Angular Router handles the JSON's URL escaping.

- `'array'` preserves order, duplicates, and empty items. `?tag=` means `['']`.
- Commas are ordinary text: `?tag=a,b` means `['a,b']`, not `['a', 'b']`.
- Writing `[]` with `'array'` removes the key. A later absent key restores the configured fallback,
  which may be a nonempty array.
- Writing `[]` with `'json'` stores the JSON text `'[]'` and keeps the key.
- Arrays always need an explicit serializer. Mutable and readonly string-array fields are supported;
  string array nodes can use the template `array(field.strict(''))`.

Read the source for the complete parsed array. `querySync.params.tag()` exposes only the first raw
value, or `null` when absent. See the [numeric repeated-value serializer example](../guides/query-params.md#arrays)
when each numeric item should have its own occurrence instead of using JSON.

### Whole forms, groups, and object values {#structured-values}

Bind individual children for separate query names, or bind an aggregate to store its complete
value under one key. This example stores the entire form as JSON:

<CodeBlock language="ts" title="saved-search-page.ts">{jsonSource}</CodeBlock>

After `onIncludeArchived()`, the decoded `filters` parameter is
`'{"search":"","includeArchived":true}'`, assuming the URL initially had no filter value.
The same configured binding works with an existing `group()`, a nested structural group, or an
object-valued field. Whole-node bindings preserve their normal validation, child reconciliation,
and interaction behavior. Aggregate `defaultValue` values must be complete values rather than patches.

JSON parsing checks syntax only. The source type and `queryParam.json<T>()` generic do not validate
the parsed shape. Use a [custom serializer](#custom-serializers) when imported JSON must match a schema.

## ⚙️ Binding options {#options}

A configured entry implements [`QueryParamBinding<T>`](./types/query-param-binding.md).
Options belong to one query key; the helper-level options are described [separately](#shared-options).

| Option | Accepted value | Default |
| --- | --- | --- |
| [`source`](#source-option) | Existing node or writable Angular signal | Required in a configured entry |
| [`serializer`](#serializer-option) | Built-in name or compatible `QueryParamSerializer<T>` | Infer from the fallback |
| [`defaultValue`](#default-value) | A value compatible with the source | Capture the source value at registration |
| [`clearOnDefault`](#clear-on-default) | `boolean` | `false` |
| [`history`](#history-option) | `'replace'` or `'push'` | Shared `history`, otherwise `'replace'` |
| [`injector`](#entry-injector) | Angular `Injector` | The helper's injector |

<div className="api-member-reference">

## ⚙️ Binding option reference {#option-reference}

### source {#source-option}

**Type:** An existing form node or writable signal with value type `T`.

The helper connects this instance; it does not clone it or replace it with another field.
Use the source's existing `set()`, `update()`, or aggregate `patch()` methods to change values.
Functional updates accumulate immediately in the source before the URL batch is published.
The direct-entry shorthand is equivalent to a configured entry containing only `source`.

<span id="codec-option" />
<span id="legacy-codec" />

### serializer {#serializer-option}

**Signature:** `serializer?: QueryParamSerializer<T> | 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'json'`

**Default:** Infer `'string'`, `'number'`, or `'boolean'`
from the fallback value: explicit
`defaultValue` when supplied, otherwise the captured source value. Numeric inference uses
`'number'`, so request `'integer'` explicitly for integral values.

The signature above summarizes the choices. The actual type restricts names according to the
source: a numeric field cannot use `'string'`, and `'array'` needs string-array values. Broad
built-in parsers cannot safely produce a narrow literal union; use a custom serializer for that case.
JSON accepts the expected source type but does not check its structure at runtime.

A null, undefined, array, or object fallback cannot select a serializer automatically. Supply one
explicitly. A serializer object and the corresponding name use the same conversion; for example,
`serializer: 'integer'` and `serializer: queryParam.integer()` are equivalent.

### defaultValue {#default-value}

**Signature:** `defaultValue?: T`

**Default:** The node's committed value or the signal's current value captured before URL hydration.

Used when the parameter is absent or parsing fails. A present, successfully parsed value takes
precedence. The fallback remains fixed for the connection and does not become the last edited
value. An explicitly supplied `undefined` is a fallback in its own right; it does not mean
“capture the source instead.” TypeScript checks that the fallback is compatible with the source.

An explicit default may differ from the node's original initial value. It does not change the
baseline used by `resetToInitial()`. See [initialization examples](#defaults-and-initialization).

### clearOnDefault {#clear-on-default}

**Signature:** `clearOnDefault?: boolean`

**Default:** `false`.

When an outbound value serializes identically to the fallback, `true` removes the parameter.
This is useful for search defaults such as `q=''` or `page=1`. It compares serialized values,
not object identity or deep equality; JSON property order therefore matters.

With a string fallback of `''`, an outbound empty string writes `?q=` by default and removes `q`
when `clearOnDefault` is true. Registration and incoming navigation never rewrite the URL just
to remove defaults. Null/undefined values remove a key independently of this option.
The [lifecycle example](#ownership) shows explicit defaults with removal enabled.

### history {#history-option}

**Signature:** `history?: 'replace' | 'push'`

**Default:** Inherit the helper's `history`, otherwise `'replace'`.

- `replace`: Update the current history entry. Useful for continuous search edits.
- `push`: Create an entry. Useful for page changes or selections users should revisit with Back.

A per-entry value overrides the shared option. When several changed keys share one batch, any
changed entry using `push` makes the entire batch push. An unchanged push-configured key does not
change a replace-only batch. See [history and batching](#history-and-batching).

### injector {#entry-injector}

**Signature:** `injector?: Injector`

**Default:** The helper's injector.

Adds an owner for this entry. Destroying that owner disconnects the entry while other entries can
remain active. The entry injector must resolve the same Router as the helper's injector; it does
not select a different URL or Router. The helper's owner and a node's own lifetime can also end
the entry. Ordinary writable signals use the helper and entry owners only.

</div>

## Shared options {#shared-options}

The second argument implements [`SyncQueryParamsOptions`](./types/sync-query-params-options.md).

| Option | Accepted value | Default |
| --- | --- | --- |
| [`injector`](#shared-injector) | Angular `Injector` | Current injection context |
| [`history`](#shared-history) | `'replace'` or `'push'` | `'replace'` |
| [`onInitialUrlSync`](#on-initial-url-sync) | Callback after initial hydration | None |
| [`onUrlSync`](#on-url-sync) | Callback after initial and subsequent URL imports | None |
| [`onError`](#on-error) | `(error: QueryParamSyncError) => void` | Angular `ErrorHandler` |

<div className="api-member-reference">

### injector {#shared-injector}

**Signature:** `injector?: Injector`

Resolves the Router and owns the whole connection. Component property initializers already run
in an injection context. Event handlers and lifecycle methods do not supply that context; pass
an injector captured during construction when connecting there. Its destruction automatically
calls the connection's cleanup. See the [complete example](#ownership).

### history {#shared-history}

**Signature:** `history?: 'replace' | 'push'`

Sets the default history mode for entries that do not specify their own. It does not override an
entry's explicit choice. Default: `'replace'`.

### onInitialUrlSync {#on-initial-url-sync}

**Signature:** `onInitialUrlSync?(event: QueryParamUrlSyncEvent<TValues> & { readonly reason: 'initial' }): void`

Runs once, synchronously, after all initial URL values and fallbacks have been applied. It runs
before `onUrlSync` and before `syncQueryParams()` returns. Read `event.values` or the bound sources;
the component property receiving the connection has not been assigned yet. Default: no callback.
See the [component example and timing rules](#url-sync-hooks).

### onUrlSync {#on-url-sync}

**Signature:** `onUrlSync?(event: QueryParamUrlSyncEvent<TValues>): void`

Runs after the initial synchronization and each later URL-to-source restoration, once per complete
map. `reason` is `'initial'` or `'navigation'`. It does not run for acknowledgments of source-to-URL
writes. Default: no callback. See [which events notify](#url-sync-hooks).

### onError {#on-error}

**Signature:** `onError?(error: QueryParamSyncError): void`

Receives conversion and navigation failures independently of form validation. Without this
callback, the helper reports them to Angular `ErrorHandler`. The error contains `key`, `phase`,
and `cause`; `cause` is the original error or an error describing rejected navigation.

| `phase` | `key` | Observable result |
| --- | --- | --- |
| `'parse'` | The query name | Import the fallback and retain the malformed text in the accepted URL and `params`. |
| `'serialize'` | The query name | Keep the source edit; do not publish that key's failed write. Other valid entries can still publish. |
| `'navigation'` | `null`, because one batch may contain several keys | Keep source edits and retain the last accepted URL snapshot. Do not automatically retry the rejected revision. |

A later source change can start another write. Successfully parsed values still run the node's
normal validators; an application-invalid value is not a parsing error and can still be published.
The helper does not put URL failures into `errors()` or block writes until the form becomes valid.

Configuration failures, such as a duplicate key, unsupported source, unknown serializer, ambiguous
inference, or incompatible injector, throw while creating the connection. They are not navigation
errors delivered through `onError`. Serializers also serialize the fallback during setup; an invalid
fallback can therefore cause connection creation to throw.

</div>

<span id="built-in-codecs" />

## Serializer reference {#built-in-serializers}

Import `queryParam` from `@ngblocks/form-nodes/router` when you need serializer objects, composition,
or direct conversion outside the helper. Serializers receive and return decoded values; Angular Router
handles percent encoding. Do not pre-encode their output.

| Name | Factory | Parsing and serialization contract |
| --- | --- | --- |
| `'string'` | `queryParam.string()` | Exactly one value; preserves `''`, spaces, and decoded text. |
| `'number'` | `queryParam.number()` | Finite decimal values, including decimal fractions and exponent notation. Rejects blanks, hex, malformed numbers, and non-finite values. |
| `'integer'` | `queryParam.integer()` | Safe integers in both directions. Rejects fractions and integers outside the safe range. |
| `'boolean'` | `queryParam.boolean()` | Exactly `'true'` or `'false'`; not `'1'`, `'0'`, or an empty flag. |
| `'array'` | `queryParam.array()` | Repeated strings in order, including duplicates and empty items; an empty array removes the key. |
| `'json'` | `queryParam.json<T>()` | One JSON value, using native `JSON.parse` and `JSON.stringify`; no schema validation. |

Scalar and JSON serializers reject repeated occurrences. JSON can contain objects, arrays, and
primitives. Standard conversions apply: undefined object properties are omitted, `toJSON()` is
respected, dates become strings, and non-finite numbers become JSON null. Circular references,
BigInt, and top-level values with no JSON representation fail serialization. Parsed class instances
are not reconstructed. Without a type argument, `queryParam.json()` returns a serializer for `unknown`.

The helper handles source `null` and `undefined` before invoking a serializer's serialize method: both remove
the parameter. An incoming JSON literal `null` is nevertheless a valid parsed JSON value. Removing
a key and later navigating to a missing key are different operations: the latter imports the fallback.

<span id="custom-codecs" />

### Custom serializers {#custom-serializers}

[`QueryParamSerializer<T>`](./types/query-param-serializer.md) has two methods:

```ts
type QueryParamSerializer<T> = {
  parse(values: readonly string[]): T;
  serialize(value: T): readonly string[] | null;
};
```

`parse` receives all occurrences of a present key. Absence uses the fallback without calling it.
Throw for unsupported text or an invalid shape. `serialize` returns decoded strings; `null` or an
empty array removes the key. Its output must contain only strings. Keep both methods free of
side effects; reads of unrelated signals in a serializer do not make the binding track those signals.

This serializer restricts sorting to two choices and preserves the source's literal union:

<CodeBlock language="ts" title="sorted-results-page.ts">{customSerializerSource}</CodeBlock>

`?sort=date` imports `'date'`. `?sort=unknown` reports a parsing failure and imports `'name'`.
Choosing `'name'` for an outbound edit removes the parameter because it is the captured default.
Use the same extension point to validate a JSON schema or encode repeated numeric values.

## Defaults and initialization {#defaults-and-initialization}

Initialization is synchronous and bidirectional. The activation URL wins when a parameter is
present and parses successfully. Registration itself does not navigate or canonicalize the URL.

For a page source with fallback `1` and `serializer: 'integer'`:

| Incoming URL | Source value | `params.page()` | Error |
| --- | --- | --- | --- |
| `?page=3` | `3` | `'3'` | None |
| No `page` | `1` | `null` | None |
| `?page=` | `1` | `''` | Parse failure |
| `?page=invalid` | `1` | `'invalid'` | Parse failure |
| `?page=2&page=3` | `1` | `'2'` | Parse failure: repeated scalar |
| `?page=01` | `1` | `'01'` | None; the URL is not rewritten |

Without `defaultValue`, capture the source **before** hydration. A source starting at `null` with
an explicit integer serializer imports `3` from `?page=3`, but a later URL without `page` restores `null`.
With `defaultValue: 1`, that same source instead uses `1` for absence or malformed input.

Deleting a parameter through a source write is different from receiving an absent parameter.
For example, setting a nullable page to `null` removes the key and keeps that local `null` after
its own write is accepted. Later Back/Forward to an entry without the key restores the fixed
fallback, which might be `1`. Defaults are captured again if you create a new connection.

## URL synchronization hooks {#url-sync-hooks}

Use `onInitialUrlSync` for work that needs the opening URL, such as recording the initial search.
Use `onUrlSync` to react to URL restoration, including Back/Forward. Both receive parsed, committed
values under the **query names** you configured, with inferred source types.

<CodeBlock language="ts" title="search-page.ts">{hooksSource}</CodeBlock>

Opening `/search?q=angular&page=3` calls the initial hook with `{ q: 'angular', page: 3 }`, then calls
`onUrlSync` with the same snapshot and `reason: 'initial'`. An external navigation to `?q=vue&page=2`
calls only `onUrlSync`, with `reason: 'navigation'`. Editing a source and accepting its URL write
calls neither hook. To react to source edits too, observe the sources separately.

| Event | Notification |
| --- | --- |
| Initial hydration, including defaults and SSR | `onInitialUrlSync`, then `onUrlSync` with `'initial'` |
| Accepted navigation importing bound values | `onUrlSync` with `'navigation'` |
| Back/Forward restoring the same values and clearing a draft | `onUrlSync` with `'navigation'` |
| Own successful URL write with matching values | None |
| Redirect whose final parameters must be imported | `onUrlSync` with `'navigation'` |
| Unrelated query or fragment change without source restoration | None |
| Rejected navigation or an empty/disconnected connection | None |

[`QueryParamUrlSyncEvent<TValues>`](./types/query-param-url-sync-event.md) contains `reason` and
`values`. `values` is a shallow readonly snapshot of all configured sources after the complete
import, including unchanged keys and sources whose individual owners have ended. Objects and
arrays inside it are not cloned or frozen. Missing or malformed parameters appear as their applied
fallbacks; use `params` after initialization for the original URL text. Node values reflect
committed data even if custom public equality retains an older exposed value; writable signals
reflect the value accepted by their own equality function.

Callbacks run synchronously and outside reactive dependency tracking. They do not wait for
asynchronous validation, rendering, or a returned promise. Synchronous validation and cancellation
of obsolete control drafts have already occurred. Initialize any component properties used by
these hooks **before** declaring `querySync`.

A hook may edit sources; those edits enter normal outbound batching without triggering another
URL hook on acknowledgment. Initial edits wait for an in-progress activation to finish. Its final
`NavigationEnd` does not repeat the hydration notification when the imported URL is unchanged.
Destroying the connection prevents later callbacks, including `onUrlSync` if destruction happens
in `onInitialUrlSync`. Callback exceptions and rejected promises go to Angular `ErrorHandler`,
separately from the conversion/navigation failures handled by `onError`.

## 📖 Properties and methods {#properties-and-methods}

The connection exposes state under dedicated names so a query parameter named `pending` or
`unsubscribe` remains accessible as `params.pending()` or `params.unsubscribe()`.

| Member | Type | Meaning |
| --- | --- | --- |
| [`params`](#params) | Readonly named `Signal<string \| null>` properties | Accepted URL text for configured keys, before serializer parsing |
| [`pending`](#pending) | `Signal<boolean>` | This connection has queued or in-flight writes |
| [`closed`](#closed) | `Signal<boolean>` | Every entry has disconnected |
| [`unsubscribe()`](#unsubscribe) | Method | Disconnect all entries early |

<div className="api-member-reference">

## 📖 Property reference {#property-reference}

### params {#params}

**Signature:** `readonly params: { readonly [P in K]: Signal<string | null> }`

Each signal starts from the activation URL and follows accepted navigation, including history
restoration and redirects. Values are URL-decoded but have not passed through the serializer.
An absent key is `null`, an empty value is `''`, and repeated keys expose their first value.
Read the source for parsed numbers, arrays, or objects.

Source edits can precede the accepted URL. Until Router accepts a write, `params` retains the
previous accepted text. A rejected write leaves it unchanged. The first example displays this
accepted text with `querySync.params.q()` rather than the field's immediate value.

While any entry remains active, raw signals track all configured keys, including keys whose
individual owners have already ended. When the connection closes, those signals retain their
last snapshot. The object and its signals are readonly. Use Angular Router directly for query
keys outside the binding map.

### pending {#pending}

**Signature:** `readonly pending: Signal<boolean>`

Initially false. Becomes true when a committed edit is observed in a microtask and creates queued
or in-flight work. It returns to false after that work settles or is canceled. Reading it immediately
after `source.set()` can still return false before the observation microtask runs.

It excludes control debounce, asynchronous validation, external navigations, and other connections'
writes. Use it for an “Updating URL” indicator, not as a replacement for a form's validation
`pending()` signal. The [ownership example](#ownership) shows that indicator in a component.

### closed {#closed}

**Signature:** `readonly closed: Signal<boolean>`

True after manual unsubscribe or when all entries lose their owners. It is true immediately for
an empty map. Disposing one entry does not close a connection that still has other active entries.
A closed connection has `pending() === false`; reconnect by calling `syncQueryParams()` again.

## 🛠️ Method reference {#method-reference}

### unsubscribe() {#unsubscribe}

**Signature:** `unsubscribe(): void`

Disconnects all entries, releases observations and query-key registrations, and cancels their
queued or in-flight work. It is safe to call more than once. Active sibling connections retain
their own work. Source values, interaction state, and initial reset baselines are retained; accepted
URL changes are not undone. Raw parameter signals freeze at their last accepted snapshot.

Automatic injector cleanup performs this operation too. Manual unsubscribe is useful for an
optional filter panel or for releasing keys before creating another connection.

</div>

## Ownership and explicit injectors {#ownership}

This component connects on a button click, outside an injection context. It passes the injector
captured during construction, handles URL failures, and supports early disconnection. Reconnecting
first releases the old binding, preventing duplicate active keys.

<CodeBlock language="ts" title="optional-sync-page.ts">{lifecycleSource}</CodeBlock>

The shared injector owns the whole connection. Per-entry injectors add independent lifetimes,
and nodes retain their normal binding/inherited injector ownership. A node owner's destruction
can stop its entry even if the helper owner is still alive. Signals have no node owner.

Create page-specific connections using the page's injector so they end when the page is destroyed.
Stopping synchronization does not stop you using the original fields or signals.

## History, batching, and navigation {#history-and-batching}

Several source changes in the same turn are composed into one URL update. Separate helper calls
sharing one Router also share coordination. Updates preserve unrelated query parameters and the
fragment. A batch uses the current accepted URL and serializes navigation attempts so a later
write cannot blindly overwrite an earlier one.

| Event | Result |
| --- | --- |
| Several keys change together | Publish one composed update; a changed push entry makes the batch push. |
| An older own write is accepted after a newer edit | Keep the newer edit and its pending control work. |
| Same-page navigation changes an unrelated query key | Preserve this binding's pending edit if its accepted parameter is unchanged. |
| Accepted navigation changes a bound parameter | Import the accepted value and discard obsolete work for that parameter. |
| Back/Forward restores a URL | Restore bound values and cancel stale drafts, even if the committed value already matches. |
| External navigation is in progress | Suspend outbound publication until its outcome is known. |
| External navigation is rejected | Preserve local edits and resume queued work. |
| Navigation redirects | Use the final accepted destination parameters. |
| Navigation leaves the page | Invalidate old-page work; page injector cleanup disconnects page-owned bindings. |

The helper navigates through Angular Router. Router events, guards, and redirects participate
according to the application's Router configuration; changing query parameters does not force
all guards or resolvers to rerun. It does not write directly through `window.history`.

## Form state, validation, and debounce {#form-state}

URL imports use programmatic node writes. They synchronize control and committed values, preserve
dirty/touched markers, and retain ordinary validation and ancestor propagation. Replacing a value
cancels obsolete control debounce and follows the node's existing asynchronous validation rules.

Configure typing delay on the node's `debounce` option. The helper publishes committed values,
not pending control text, and adds microtask batching rather than another typing delay. A successful
acknowledgment of its own URL write does not cancel a newer draft.

`reset()` keeps values and does not itself change the URL. `resetToInitial()` restores the node's
original baseline and publishes resulting committed changes. URL hydration and `defaultValue`
do not redefine that baseline. Disabled fields still accept URL imports and publish programmatic
value changes. See [value flow](../guides/value-flow-and-debounce.md) and
[reset behavior](../guides/reset-and-restore.md).

## Server rendering {#server-rendering}

On the server, the helper hydrates sources from the Router URL but does not schedule outbound URL
writes. It still needs a configured Router and injector. Keep routing setup, serializers, and defaults
consistent between server rendering and browser hydration.

## Common configuration mistakes {#common-mistakes}

| Symptom | Check |
| --- | --- |
| An injection-context or missing Router error | Configure Router; create the helper in an injection context or pass the shared injector. |
| A source beginning with null cannot infer conversion | Use a typed source and an explicit serializer, or a compatible scalar `defaultValue` for inference. |
| A readonly/computed signal cannot be bound | Bind a writable signal or the existing node that owns the value. |
| A query key is already bound | Reuse the connection or unsubscribe its previous writer before registering it again. |
| An entry injector is rejected | It must resolve the same Router as the helper's injector. |
| JSON parses but has an unexpected shape | Add runtime validation in a custom serializer; JSON generics are not a schema. |
| Input text has changed but the URL has not | Check control debounce, the next observation microtask, and pending or rejected navigation. |
| `params.tag()` returns only one item | Read the source array for all parsed values. |

Parameter names inherit Angular Router serializer behavior. The default serializer does not retain
`__proto__`. Angular 21.0.7 can also fail when `hasOwnProperty` is followed by another query parameter;
Angular 22.1.7 uses a safe ownership check for that case. `constructor` and `toString` are supported.

## Related guides and reference

- [Synchronizing query parameters](../guides/query-params.md)
- [QueryParamBinding](./types/query-param-binding.md)
- [QueryParamSerializer](./types/query-param-serializer.md)
- [SyncQueryParamsOptions](./types/sync-query-params-options.md)
- [QueryParamsSync](./types/query-params-sync.md)
- [QueryParamSyncError](./types/query-param-sync-error.md)
- [field()](./field.md), [form()](./form.md), [group()](./group.md), and [array()](./array.md)
