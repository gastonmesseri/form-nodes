---
title: FieldNode
---

# FieldNode

A field node. Omit TValue for an unspecified value, or supply it to constrain reads and writes.

## Import

```ts
import type { FieldNode } from '@ngblocks/form-nodes';
```

## When to use it

Use for inputs or helpers that accept a field with a known value type. A bare `FieldNode` accepts unspecified field values; prefer factory inference when declaring the field itself.

## Declaration

```ts
type FieldNode<TValue = any, TParent extends AnyNode = AnyNode> = Signal<TValue> & {
    (): TValue;
    $api: CallableNodeApi<FieldApi<TValue, TParent>>;
} & Omit<FieldApi<TValue, TParent>, 'patch'> & HiddenFunctionMembers;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | `any` |
| `TParent` | `AnyNode` | `AnyNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `$api` | Callable, collision-safe access to the field API. Calling `$api()` reads the same exposed value as the node and tracks signal dependencies. Use direct members for application code and `$api` for generic code or child-name collisions. |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [CallableNodeApi](./callable-node-api.md)
- [FieldApi](./field-api.md)
