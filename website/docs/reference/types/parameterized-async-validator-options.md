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

Use for async options that also derive tracked params. The execution function belongs to `ParameterizedAsyncValidatorConfig`.

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
| `params` | Reactively derives the explicit dependency snapshot passed to the validator. Signals read by this function are tracked, while object and array results are compared shallowly. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [AsyncValidatorApi](./async-validator-api.md)
- [AsyncValidatorBaseContext](./async-validator-base-context.md)
- [AsyncValidatorOptions](./async-validator-options.md)
- [ValidatorReadonlyApi](./validator-readonly-api.md)
