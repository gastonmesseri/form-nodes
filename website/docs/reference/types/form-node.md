---
title: FormNode
---

# FormNode

Form node model. Omit the first type argument for an unspecified structure, or provide it to preserve exact child types.

## Import

```ts
import type { FormNode } from '@ngblocks/form-nodes';
```

## When to use it

Use for inputs and helpers that require form submission semantics. Its generic describes child nodes, not the plain form-value object; use `FormValueContract` for value-oriented constraints.

## Declaration

```ts
type FormNode<TNodes extends Nodes = never, TParent extends AnyNode = AnyNode> = [
    TNodes
] extends [
    never
] ? GenericFormNode : Signal<{
    [K in keyof TNodes]: NodeValue<TNodes[K]>;
}> & {
    (): {
        [K in keyof TNodes]: NodeValue<TNodes[K]>;
    };
} & FormApiProperty<TNodes, TParent> & Omit<FormChildren<TNodes, TParent>, 'api'> & Omit<FormApi<TNodes, TParent>, keyof TNodes> & HiddenFunctionMembers<keyof TNodes | keyof FormApi<TNodes, TParent>>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNodes` | `Nodes` | `never` |
| `TParent` | `AnyNode` | `AnyNode` |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FormApi](./form-api.md)
