---
title: CallableNodeApi
---

# CallableNodeApi

A collision-safe node API that is also an Angular signal of the exposed node value. Concrete node APIs satisfy `WritableSignal&lt;T&gt;` and expose a stable `asReadonly()` value view.

## Import

```ts
import type { CallableNodeApi } from '@ngblocks/form-nodes';
```

## When to use it

Use to describe a collision-safe API that is also callable as a signal. Calling it reads the exposed node value; its own members are not replaced by child names.

## Declaration

```ts
type CallableNodeApi<TApi extends {
    value: Signal<any>;
}> = NodeSignal<ReturnType<TApi['value']>> & TApi & HiddenFunctionMembers<keyof TApi>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TApi` | `{ value: Signal<any> }` | Required |

## Related reference

- [Node API and collision-safe access](../node-api.md)
- [Public types index](./index.md)
