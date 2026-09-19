---
title: Synchronizing query parameters
---

import CodeBlock from '@theme/CodeBlock';
import source from '!!raw-loader!../../examples/query-params.typecheck.ts';
import codecs from '!!raw-loader!../../examples/query-param-codecs.example.ts';

# Synchronizing query parameters

Use `syncQueryParams()` from `@ngblocks/form-nodes/router` to connect existing fields to Angular
Router. Each map key is a query parameter name. Supply a field directly, or `{ field, ...options }`
when that parameter needs configuration. This optional entry point requires `@angular/router`
and a configured Router; the main forms package remains usable without Router or injection.

<CodeBlock language="ts" title="search-page.ts">{source}</CodeBlock>

The helper reads the initial URL synchronously and does not rewrite it on registration. URL values
win when they parse successfully. An absent or malformed value uses `defaultValue`, or the field's
committed value captured at registration when no default is supplied. This fallback stays fixed;
it does not become the most recently entered value. Parsing failures are also reported.

## Reading the URL and connection state

Keep the returned connection, as `querySync` in the component above. Its `params` object has a
readonly signal for each configured key: `querySync.params.page()` returns `string | null`, while
`filters.page()` returns the parsed field value. Query strings are already URL-decoded but have not
passed through your codec. Empty text is `''`; a missing key is `null`; repeated keys expose their
first value. A malformed number remains visible as raw text even when the field uses its fallback.

`querySync.paramMap()` is a readonly signal containing an Angular `ParamMap` snapshot for **all**
query keys. Use `.getAll('tag')` for repeated values or `.get('unboundKey')` for an unbound key.
Returned arrays are copies. Keeping an old snapshot does not make it follow later navigation.

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
tracking the whole URL until the connection closes, including keys whose fields stopped syncing.
Keeping keys under `params` also allows parameters named `pending` or `unsubscribe` without collisions.

## Conversion

The shorthand infers string, number, or boolean conversion from the fallback's runtime type.
For fields starting with null, undefined, arrays, or objects, supply a codec explicitly. Codecs
receive decoded strings and return decoded strings; Angular Router handles percent encoding.
Choose a built-in by name, such as `codec: 'integer'`, or use its factory, such as
`codec: queryParam.integer()`. Both forms use the same implementation. TypeScript checks scalar
and repeated-array codec names against the field type, including nullable fields; a numeric field
cannot use `'string'`. The JSON codec accepts the field's expected type without validating its shape.
Use a custom codec when parsing must enforce a schema, literal choices, or mixed scalar types.

| Name | Equivalent codec | Contract |
| --- | --- | --- |
| `'string'` | `queryParam.string()` | One value; preserves the empty string. |
| `'number'` | `queryParam.number()` | One finite decimal number; rejects blanks, hex, and non-finite values. |
| `'integer'` | `queryParam.integer()` | One safe integer. |
| `'boolean'` | `queryParam.boolean()` | Exactly `true` or `false`. |
| `'array'` | `queryParam.array()` | Repeated values in order; an empty array removes the parameter. |
| `'json'` | `queryParam.json<T>()` | One JSON string containing the whole value; parsing checks syntax, not a schema. |

Custom codecs implement `QueryParamCodec<T>` with `parse(values)` and `serialize(value)`. Throw
for malformed input. Serialization returns a string array or null to remove the key. Null and
undefined field values also remove the key; returning to an absent URL restores the configured
fallback, which may differ from null. Scalar codecs reject repeated parameters.

Field validators still decide whether a successfully parsed value is valid for the application.
The helper does not block publication of business-invalid values or put URL errors into form errors.

## Arrays

Bind an array-valued **field**, as with `filters.tags` in the component example, using
`codec: 'array'` or `queryParam.array()`. Both mutable `string[]` and `readonly string[]` field
values are supported. A Form Nodes `array()` node is an aggregate and cannot be bound directly.

- `?tag=angular&tag=forms` becomes `['angular', 'forms']`.
- One occurrence, `?tag=angular`, becomes `['angular']`.
- `?tag=` becomes `['']`; no occurrence uses the captured or configured default.
- Writing `[]` removes the key. A later missing key restores the fallback, which may be nonempty.
- Order, duplicates, and empty items are preserved. Commas remain part of a value; the helper does
  not implicitly split CSV or parse JSON.

Arrays are not inferred, even when the initial value is nonempty. For arrays of numbers or objects,
use `'json'` to store the whole array in one parameter. To encode numeric items as repeated keys,
provide a custom `QueryParamCodec<number[]>`, as in this checked example:

<CodeBlock language="ts" title="query-param-codecs.ts">{codecs}</CodeBlock>

Use `querySync.paramMap().getAll('tag')` for all raw strings; `querySync.params.tag()` returns only
the first string or null. Read `filters.tags()` for the parsed array.

## JSON

Use `codec: 'json'` for the component's `options` field, or pass `queryParam.json<T>()` explicitly.
The complete value is serialized with `JSON.stringify` and parsed with `JSON.parse`. Angular Router
handles URL escaping; do not encode or decode the JSON yourself. For example, `{ "sort": "name" }`
uses one parameter whose decoded value is `{"sort":"name"}`. `querySync.params.options()` returns
that JSON text; `filters.options()` returns the parsed object.

The JSON codec supports objects, arrays, and JSON primitives. Unlike `'array'`, it serializes an
empty array as `[]` without removing the key. An absent parameter uses the captured/configured
fallback. Writing a null or undefined field value still removes the key, following the helper's
shared rule; an incoming literal `null` is valid JSON and imports null.

Malformed JSON and repeated occurrences of a JSON key report a parse error and use the fallback.
Circular references, BigInt, or values that produce no JSON string report serialization errors
without changing the accepted URL. Standard JSON conversions apply: undefined object properties
are omitted, non-finite numbers become null, and `toJSON()` is respected. Dates become strings;
class instances are not reconstructed. `clearOnDefault` compares serialized text, including object
property order, rather than performing a deep comparison.

The field type and `queryParam.json<T>()` generic describe the expected result; **neither validates
the parsed structure**. Without a type argument, the factory returns `QueryParamCodec<unknown>`.
Use a custom codec with runtime schema validation when valid JSON alone is insufficient.

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

The second argument accepts `injector`, `history`, and `onError`. Omit `injector` inside an Angular
injection context, or pass it explicitly when connecting later. Router resolution uses this shared
injector. A per-entry injector adds that entry's lifetime owner and must resolve the same Router.
The field's current injector ownership also ends its entry on destruction.

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
