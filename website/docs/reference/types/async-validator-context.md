---
title: AsyncValidatorContext
---

# AsyncValidatorContext

Reactive node context and cancellation signal provided to an asynchronous validator run.

## Import

```ts
import type { AsyncValidatorContext } from '@ngblocks/form-nodes';
```

## When to use it

Use for an asynchronous validation callback. Observe `abortSignal` and return a supported async result; do not publish stale work after cancellation.

## Declaration

```ts
type AsyncValidatorContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = AsyncValidatorBaseContext<TValue, TApi, TField> & {
    readonly abortSignal: AbortSignal;
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
| `abortSignal` | Cancellation signal for this execution. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [AsyncValidatorApi](./async-validator-api.md)
- [AsyncValidatorBaseContext](./async-validator-base-context.md)
- [ValidatorReadonlyApi](./validator-readonly-api.md)
