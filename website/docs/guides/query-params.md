---
title: Synchronizing query parameters
---

import CodeBlock from '@theme/CodeBlock';
import source from '!!raw-loader!../../examples/query-params.typecheck.ts';
import serializers from '!!raw-loader!../../examples/query-param-serializers.example.ts';

# Synchronizing query parameters

Use `syncQueryParams()` from `@ngblocks/form-nodes/router` to connect existing nodes and writable signals to Angular
Router. Each map key is a query parameter name. Supply a source directly, or `{ source, ...options }`
when that parameter needs configuration. This optional entry point requires `@angular/router`
and a configured Router; the main forms package remains usable without Router or injection.

Declare the sources before the connection in your component. Component property initializers
provide the injection context, so no explicit injector is needed here. The connection is
automatically cleaned up when the component is destroyed.

<CodeBlock language="ts" title="search-page.ts">{source}</CodeBlock>

The helper reads the initial URL synchronously and does not rewrite it on registration. URL values
win when they parse successfully. An absent or malformed value uses `defaultValue`, or the field's
committed value captured at registration when no default is supplied. This fallback stays fixed;
it does not become the most recently entered value. Parsing failures are also reported.

## Nodes and writable signals

A map can mix `field()`, `form()`, `group()`, `array()`, `signal()`, and `linkedSignal()` sources.
For a whole form or group, use `{ source: this.form, serializer: 'json' }`. The entire value occupies one
query key. For separate query keys, bind its children individually. Object/number array nodes
also use JSON or a custom serializer; string array nodes can use `'array'` for repeated keys.

All sources share batching, history, defaults, navigation conflict handling, SSR, and cleanup.
Nodes publish committed values even when public equality hides a change. Incoming data uses the
node's existing `set()` operation, preserving validation and interaction rules; array nodes
reconcile their children normally. Aggregate defaults must be complete values rather than patches.
JSON checks syntax only, so use a custom serializer when an aggregate needs shape validation.

Writable signals respect their own equality function and have no form validation, interaction,
reset, or control-debounce state. `linkedSignal()` dependency changes also synchronize.
Readonly and computed signals cannot receive incoming URL values and are rejected.

## Reacting to URL imports

Pass `onInitialUrlSync` in the second argument for work after initial hydration, or `onUrlSync`
for initial hydration and later URL-to-source imports. Both receive `{ reason, values }`, where
`values` is a typed snapshot indexed by your query names and `reason` is `'initial'` or
`'navigation'`. The initial-only callback runs first. Own source-to-URL write acknowledgments do
not notify; Back/Forward and accepted external changes do.

Initial callbacks run before the helper returns, so use the payload or your sources rather than
the component property receiving the connection. All mapped sources have been applied, but
asynchronous validation and rendering may still be pending. See the
[component example and complete hook contract](../reference/sync-query-params.md#url-sync-hooks).

## Reading the URL and connection state

Keep the returned connection, as `querySync` in the component above. Its `params` object has a
readonly signal for each configured key: `querySync.params.page()` returns `string | null`, while
`form.page()` returns the parsed field value. Query strings are already URL-decoded but have not
passed through your serializer. Empty text is `''`; a missing key is `null`; repeated keys expose their
first value. A malformed number remains visible as raw text even when the field uses its fallback.

These signals initialize from the activation URL and then follow accepted navigation, including
Back/Forward and redirects. They do not optimistically mirror field edits. If a guard rejects a
write, the signals retain the accepted URL while the field retains the user's edit.

- `pending()` reports queued or in-flight writes belonging to this connection. It starts when the
  committed change is observed in a microtask and ends when the work settles or is canceled. It
  excludes control debounce, form validation, external navigation, and other helpers' writes.
- `closed()` becomes true after manual cleanup or when all entries have lost their owners.
- `unsubscribe()` ends the connection early. Repeated calls are safe. Signals retain their last URL
  snapshot after cleanup, and `pending()` becomes false. An empty binding map starts closed.

If only one entry's owner is destroyed, the other entries remain active. The URL signals keep
tracking configured keys until the connection closes, including keys whose fields stopped syncing.
Keeping keys under `params` also allows parameters named `pending` or `unsubscribe` without collisions.

Parameter names still pass through Angular Router's URL serializer. Avoid `__proto__`, which the
default serializer does not retain. In Angular 21.0.7, `hasOwnProperty` can also break parsing when
another parameter follows it, including another occurrence of the same key. Angular 22.1.7 uses
a safe ownership check for that case. Ordinary names such as `constructor` and `toString` work.

## Conversion

The shorthand infers string, number, or boolean conversion from the fallback's runtime type.
For fields starting with null, undefined, arrays, or objects, supply a serializer explicitly. Serializers
receive decoded strings and return decoded strings; Angular Router handles percent encoding.
Choose a built-in by name, such as `serializer: 'integer'`, or use its factory, such as
`serializer: queryParam.integer()`. Both forms use the same implementation. TypeScript checks scalar
and repeated-array serializer names against the field type, including nullable fields; a numeric field
cannot use `'string'`. The JSON serializer accepts the field's expected type without validating its shape.
Use a custom serializer when parsing must enforce a schema, literal choices, or mixed scalar types.

| Name | Equivalent serializer | Contract |
| --- | --- | --- |
| `'string'` | `queryParam.string()` | One value; preserves the empty string. |
| `'number'` | `queryParam.number()` | One finite decimal number; rejects blanks, hex, and non-finite values. |
| `'integer'` | `queryParam.integer()` | One safe integer. |
| `'boolean'` | `queryParam.boolean()` | Exactly `true` or `false`. |
| `'array'` | `queryParam.array()` | Repeated values in order; an empty array removes the parameter. |
| `'json'` | `queryParam.json<T>()` | One JSON string containing the whole value; parsing checks syntax, not a schema. |

Custom serializers implement `QueryParamSerializer<T>` with `parse(values)` and `serialize(value)`. Throw
for malformed input. Serialization returns a string array or null to remove the key. Null and
undefined field values also remove the key; returning to an absent URL restores the configured
fallback, which may differ from null. Scalar serializers reject repeated parameters.

Field validators still decide whether a successfully parsed value is valid for the application.
The helper does not block publication of business-invalid values or put URL errors into form errors.

## Arrays

Bind an array-valued field, writable signal, or `array()` node using
`serializer: 'array'` or `queryParam.array()`. Both mutable `string[]` and `readonly string[]` field
values are supported. For `array()` nodes, use a string field template such as `array(field.strict(''))`.

- `?tag=angular&tag=forms` becomes `['angular', 'forms']`.
- One occurrence, `?tag=angular`, becomes `['angular']`.
- `?tag=` becomes `['']`; no occurrence uses the captured or configured default.
- Writing `[]` removes the key. A later missing key restores the fallback, which may be nonempty.
- Order, duplicates, and empty items are preserved. Commas remain part of a value; the helper does
  not implicitly split CSV or parse JSON.

Arrays are not inferred, even when the initial value is nonempty. For arrays of numbers or objects,
use `'json'` to store the whole array in one parameter. To encode numeric items as repeated keys,
provide a custom `QueryParamSerializer<number[]>`, as in this checked example:

<CodeBlock language="ts" title="query-param-serializers.ts">{serializers}</CodeBlock>

`querySync.params.tag()` returns the first raw string or null. Read `form.tags()` for the
complete parsed array. Use Angular Router directly to inspect query parameters outside the binding map.

## JSON

Use `serializer: 'json'` for the component's `options` group, or pass `queryParam.json<T>()` explicitly.
The complete value is serialized with `JSON.stringify` and parsed with `JSON.parse`. Angular Router
handles URL escaping; do not encode or decode the JSON yourself. For example, `{ "sort": "name" }`
uses one parameter whose decoded value is `{"sort":"name"}`. `querySync.params.options()` returns
that JSON text; `form.options()` returns the parsed object.

The JSON serializer supports objects, arrays, and JSON primitives. Unlike `'array'`, it serializes an
empty array as `[]` without removing the key. An absent parameter uses the captured/configured
fallback. Writing a null or undefined field value still removes the key, following the helper's
shared rule; an incoming literal `null` is valid JSON and imports null.

Malformed JSON and repeated occurrences of a JSON key report a parse error and use the fallback.
Circular references, BigInt, or values that produce no JSON string report serialization errors
without changing the accepted URL. Standard JSON conversions apply: undefined object properties
are omitted, non-finite numbers become null, and `toJSON()` is respected. Dates become strings;
class instances are not reconstructed. `clearOnDefault` compares serialized text, including object
property order, rather than performing a deep comparison.

The source type and `queryParam.json<T>()` generic describe the expected result; **neither validates
the parsed structure**. Without a type argument, the factory returns `QueryParamSerializer<unknown>`.
Use a custom serializer with runtime schema validation when valid JSON alone is insufficient.

## Value flow and history

The helper publishes committed data, including changes hidden by a field's public `equal`
comparator. Pending control text is not published. Field debounce continues to determine when
input commits and validators run; the helper adds microtask batching without another typing delay.

Several fields changed together, including fields managed by separate helper calls, share one
Router coordinator. A batch preserves unrelated query parameters and the fragment. History is
replaced by default. A changed entry using `history: 'push'` makes that batch create a history entry.
The helper rejects duplicate active bindings for the same key on one Router.

Set `clearOnDefault: true` to omit values whose serialized representation equals the captured
default. The default is false. Initial and incoming URLs are not automatically canonicalized.

Back/Forward restoration discards pending input and obsolete URL writes. A successful
acknowledgment of the helper's own write preserves newer edits. An unrelated parameter change
on the same page preserves the current draft. External navigation suspends publication until its
outcome is known; rejected navigation preserves edits, and accepted conflicting URL values win.

Incoming values use programmatic field writes. They preserve dirty/touched state, synchronize
control values, and retain ordinary validation and ancestor propagation. `reset()` retains values;
`resetToInitial()` restores the original field baseline and publishes resulting changes. URL
hydration does not redefine that baseline. Disabled fields still synchronize programmatic changes.

## Ownership and failures

The second argument accepts `injector`, `history`, `onInitialUrlSync`, `onUrlSync`, and `onError`.
Omit `injector` inside an Angular
injection context, or pass it explicitly when connecting later. Router resolution uses this shared
injector. A per-entry injector adds that entry's lifetime owner and must resolve the same Router.
A node's current injector ownership also ends its entry on destruction. Writable signals use only
the shared and per-entry owners.

Calling the returned connection’s `unsubscribe()` method releases all entries and their
pending work; injector destruction does this automatically. Destroying an entry owner stops only
that entry. Rebinding node ownership follows the library's normal adoption/inheritance rules.
Create page-specific connections in the page's injector so they end when the page is destroyed.

`onError` receives `{ key, phase, cause }`. Phases are `parse`, `serialize`, and `navigation`.
Navigation errors have `key: null` because a batch may affect several keys. Without `onError`,
errors go to Angular `ErrorHandler`. Failed writes preserve entered data and do not automatically
retry; a subsequent value change can initiate another write. Unsubscribing does not reset fields.

On the server, the helper hydrates from the Router URL but does not publish URL changes. Use the
same routing setup and defaults during browser hydration.

## Related guides and reference

- [syncQueryParams reference](../reference/sync-query-params.md)
- [Value flow and debounce](./value-flow-and-debounce.md)
- [Reset and restore](./reset-and-restore.md)
