---
title: ValidatorContext
---

# ValidatorContext

Reactive context provided to synchronous validators. Generic public owners retain TValue on their node value reads. Concrete owners and partial structural owner contracts remain exact; only the common owner exposes every node kind.

## Import

```ts
import type { ValidatorContext } from '@ngblocks/form-nodes';
```

## When to use it

Use for a synchronous callback's context. Read its reactive `value` and navigation API rather than assuming a concrete primitive unless the generic supplies one.

## Declaration

```ts
type ValidatorContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = ValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = Pick<TApi, 'parent' | 'path'> & {
    readonly value: ValidatorNode extends TField ? TApi['value'] : TField['$api']['value'];
    readonly field: Signal<ValidatorNode extends TField ? 'nodeType' extends keyof TField ? ValidatorNode<TValue> : TField : TField>;
    readonly node: Signal<ValidatorNode extends TField ? 'nodeType' extends keyof TField ? ValidatorNode<TValue> : TField : TField>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TApi` | `ValidatorReadonlyApi<TValue>` | `ValidatorApi<TValue>` |
| `TField` | `AnyNode` | `ValidatorNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `value` | Current committed value of the node being validated. |
| `field` | Readonly signal of the node being validated. `ctx.node()` and `ctx.field()` return the same node. Read its value with `ctx.value()`. |
| `node` | Readonly signal of the node being validated. `ctx.node()` and `ctx.field()` return the same node. Read its value with `ctx.value()`. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ValidatorApi](./validator-api.md)
- [ValidatorReadonlyApi](./validator-readonly-api.md)
