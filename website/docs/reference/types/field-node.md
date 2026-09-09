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
    api: CallableNodeApi<FieldApi<TValue, TParent>>;
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
| `api` | Complete field API and the recommended access path for application code. |
| `$api` | Callable, collision-safe access to the field API. |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [CallableNodeApi](./callable-node-api.md)
- [FieldApi](./field-api.md)
