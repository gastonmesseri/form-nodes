---
title: ParameterizedAsyncValidatorOptions
---

# ParameterizedAsyncValidatorOptions

Options for an async validator whose tracked dependencies are exposed as a typed snapshot.

## Import

```ts
import type { ParameterizedAsyncValidatorOptions } from '@ngblocks/form-nodes';
```

## When to use it

Use for async options that also derive tracked params. The execution function belongs to [`ParameterizedAsyncValidatorConfig`](./parameterized-async-validator-config.md).

## Declaration

```ts
type ParameterizedAsyncValidatorOptions<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = AsyncValidatorOptions<TValue, TApi, TField> & {
    params: (context: AsyncValidatorBaseContext<TValue, TApi, TField>) => TParams;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TParams` | Unconstrained | Required |
| `TApi` | `ValidatorReadonlyApi<TValue>` | `AsyncValidatorApi<TValue>` |
| `TField` | `AnyNode` | `ValidatorNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `params` | Derives the dependency snapshot passed to `validate`. Signals read here are tracked. Objects and arrays are compared shallowly, so an unchanged first-level snapshot does not restart validation even if a source signal emits. Scalars use value equality. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [AsyncValidatorApi](./async-validator-api.md)
- [AsyncValidatorBaseContext](./async-validator-base-context.md)
- [AsyncValidatorOptions](./async-validator-options.md)
- [ValidatorReadonlyApi](./validator-readonly-api.md)
