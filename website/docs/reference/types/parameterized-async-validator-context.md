---
title: ParameterizedAsyncValidatorContext
---

# ParameterizedAsyncValidatorContext

Asynchronous validator context extended with the current reactive parameter snapshot.

## Import

```ts
import type { ParameterizedAsyncValidatorContext } from '@ngblocks/form-nodes';
```

## When to use it

Use for the object-form async validator's execution callback. Its `params` are the captured request snapshot; signal reads in execution are not the parameter dependency declaration.

## Declaration

```ts
type ParameterizedAsyncValidatorContext<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = AsyncValidatorContext<TValue, TApi, TField> & {
    readonly params: TParams;
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
| `params` | Snapshot returned by the validator's reactive `params` function. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [AsyncValidatorApi](./async-validator-api.md)
- [AsyncValidatorContext](./async-validator-context.md)
- [ValidatorReadonlyApi](./validator-readonly-api.md)
