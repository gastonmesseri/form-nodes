---
title: AsyncValidatorBaseContext
---

# AsyncValidatorBaseContext

Reactive context shared by asynchronous validator conditions, params, and handlers.

## Import

```ts
import type { AsyncValidatorBaseContext } from '@ngblocks/form-nodes';
```

## When to use it

Use for shared async conditions, parameter derivation, and failure handlers. The execution callback adds cancellation and, in parameterized mode, the params snapshot.

## Declaration

```ts
type AsyncValidatorBaseContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = ValidatorContext<TValue, TApi, TField>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TApi` | `ValidatorReadonlyApi<TValue>` | `AsyncValidatorApi<TValue>` |
| `TField` | `AnyNode` | `ValidatorNode` |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [AsyncValidatorApi](./async-validator-api.md)
- [ValidatorContext](./validator-context.md)
- [ValidatorReadonlyApi](./validator-readonly-api.md)
