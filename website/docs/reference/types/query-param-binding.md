---
title: QueryParamBinding
---

# QueryParamBinding

Options for one field in a query parameter map.

## Import

```ts
import type { QueryParamBinding } from '@ngblocks/form-nodes/router';
```

## When to use it

Reuse the configuration for one field and its query parameter.

## Declaration

```ts
type QueryParamBinding<T> = {
    field: Signal<T> & {
        $api: Pick<FieldApi<T>, 'nodeType' | 'set'>;
    };
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
| `field` | Existing field to synchronize. Signals and aggregate nodes are not accepted. |
| `codec` | A built-in codec name or a custom conversion contract compatible with the field. |
| `defaultValue` | Value used for missing or malformed parameters. Default: committed value captured at registration. |
| `clearOnDefault` | Remove values whose serialized representation matches the default. Default: false. |
| `history` | History behavior for this key. Default: inherit the helper option, otherwise replace. |
| `injector` | Additional lifetime owner for this entry. |

## Related reference

- [Query parameter synchronization](../sync-query-params.md)
- [Public types index](./index.md)
- [FieldApi](./field-api.md)
- [QueryParamCodec](./query-param-codec.md)
