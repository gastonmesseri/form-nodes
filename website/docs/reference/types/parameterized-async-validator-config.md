---
title: ParameterizedAsyncValidatorConfig
---

# ParameterizedAsyncValidatorConfig

The object-form asyncValidator configuration, combining reactive params with an asynchronous validate callback.

## Import

```ts
import type { ParameterizedAsyncValidatorConfig } from '@ngblocks/form-nodes';
```

## When to use it

Use for the single-object form of `asyncValidator({ params, validate, ... })`. Keep tracked dependency reads in `params` and asynchronous work in `validate`.

## Declaration

```ts
type ParameterizedAsyncValidatorConfig<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode> = ParameterizedAsyncValidatorOptions<TValue, TParams, TApi, ValidatorOwner<TField>> & {
    validate: (context: ParameterizedAsyncValidatorContext<TValue, TParams, TApi, ValidatorOwner<TField>>) => AsyncValidationResult;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TParams` | Unconstrained | Required |
| `TApi` | `ValidatorReadonlyApi<TValue>` | `AsyncValidatorApi<TValue>` |
| `TField` | `AnyNode` | `AnyNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `validate` | Validates one stable `params` snapshot. Signal reads inside this callback do not register dependencies; declare them in `params`. Return a Promise-like or Observable-like validation result. Use `abortSignal` to cancel external work; obsolete results are ignored. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [AsyncValidationResult](./async-validation-result.md)
- [AsyncValidatorApi](./async-validator-api.md)
- [ParameterizedAsyncValidatorContext](./parameterized-async-validator-context.md)
- [ParameterizedAsyncValidatorOptions](./parameterized-async-validator-options.md)
- [ValidatorReadonlyApi](./validator-readonly-api.md)
