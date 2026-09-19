---
title: QueryParamBinding
---

# QueryParamBinding

Options for one form node or writable signal in a query parameter map.

## Import

```ts
import type { QueryParamBinding } from '@ngblocks/form-nodes/router';
```

## When to use it

Reuse the configuration for one field and its query parameter.

## Declaration

```ts
type QueryParamBinding<T> = {
    source: Signal<T> & ({
        $api: Pick<NodeApi, 'nodeType' | 'set'>;
    } | (Pick<WritableSignal<NoInfer<T>>, 'set'> & {
        $api?: never;
    }));
    codec?: QueryParamCodec<NoInfer<T>> | 'json' | ([
        NonNullable<NoInfer<T>>
    ] extends [
        string
    ] ? string extends NoInfer<T> ? 'string' : never : never) | ([
        NonNullable<NoInfer<T>>
    ] extends [
        number
    ] ? number extends NoInfer<T> ? 'number' | 'integer' : never : never) | ([
        NonNullable<NoInfer<T>>
    ] extends [
        boolean
    ] ? boolean extends NoInfer<T> ? 'boolean' : never : never) | ([
        NonNullable<NoInfer<T>>
    ] extends [
        readonly string[]
    ] ? string[] extends NoInfer<T> ? 'array' : never : never);
    defaultValue?: NoInfer<T>;
    clearOnDefault?: boolean;
    history?: 'replace' | 'push';
    injector?: Injector;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `T` | Unconstrained | Required |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `source` | Existing field, form, group, array, or writable Angular signal to synchronize. Nodes keep committed-value observation, validation, and node ownership. Signals respect their own equality and use the entry injector. Readonly signals are rejected. Objects and arrays need an explicit codec. Aggregate imports use the node set operation. |
| `codec` | A built-in codec name or a custom conversion contract compatible with the source. |
| `defaultValue` | Value used for missing or malformed parameters. Default: source value captured at registration. Nodes capture their committed value; signals use their current value. |
| `clearOnDefault` | Remove values whose serialized representation matches the default. Default: false. |
| `history` | History behavior for this key. Default: inherit the helper option, otherwise replace. |
| `injector` | Additional lifetime owner for this entry. |

## Related reference

- [Query parameter synchronization](../sync-query-params.md)
- [Public types index](./index.md)
- [NodeApi](./node-api.md)
- [QueryParamCodec](./query-param-codec.md)
