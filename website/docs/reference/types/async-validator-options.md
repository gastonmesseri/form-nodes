---
title: AsyncValidatorOptions
---

# AsyncValidatorOptions

Scheduling, activation, and failure-handling options for `asyncValidator()`.

## Import

```ts
import type { AsyncValidatorOptions } from '@ngblocks/form-nodes';
```

## When to use it

Use for callback-form async scheduling, activation, and error recovery. Parameterless `when` returns are unchecked for self-reference inference; context-taking conditions retain boolean checking.

## Declaration

```ts
type AsyncValidatorOptions<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = {
    debounce?: number;
    when?: DeferredCondition | ((context: AsyncValidatorBaseContext<TValue, TApi, TField>) => boolean);
    onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi, TField>) => ValidationResult;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TApi` | `ValidatorReadonlyApi<TValue>` | `AsyncValidatorApi<TValue>` |
| `TField` | `AnyNode` | `ValidatorNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `debounce` | Delay in milliseconds before each execution. A newer trigger cancels the pending delay. |
| `when` | Reactive condition controlling whether validation is active. Signals read here are tracked. |
| `onError` | Converts a rejected Promise, thrown error, or failed Observable into a validation result. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [AsyncValidatorApi](./async-validator-api.md)
- [AsyncValidatorBaseContext](./async-validator-base-context.md)
- [ValidationResult](./validation-result.md)
- [ValidatorReadonlyApi](./validator-readonly-api.md)
