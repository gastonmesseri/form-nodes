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
| `debounce` | Delays asynchronous execution or publication by this many milliseconds. A new trigger cancels the previous delay. Parameterized validators wait before calling `validate`. A direct validator's first call discovers dependencies immediately; its result is held until the initial delay ends. Later direct executions wait before calling the validator. This does not delay committed node values; use the node's `debounce` option for that. |
| `when` | Enables asynchronous validation while the condition is true. A false result cancels active work and clears this validator's contribution. Signal reads are tracked. Parameterless callbacks support self-references with unchecked returns; return a boolean. Context-taking callbacks retain boolean checking. |
| `onError` | Maps a rejected Promise, thrown execution error, or failed Observable to validation errors. The original error and current base context are supplied. Cancelled or obsolete executions do not publish mapped results. Return null/undefined to omit errors. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [AsyncValidatorApi](./async-validator-api.md)
- [AsyncValidatorBaseContext](./async-validator-base-context.md)
- [ValidationResult](./validation-result.md)
- [ValidatorReadonlyApi](./validator-readonly-api.md)
