---
title: FormNodeDirective
---

# FormNodeDirective

The public instance type of the [formNode] Angular directive.

## Import

```ts
import type { FormNodeDirective } from '@ngblocks/form-nodes';
```

## When to use it

Use this type for a template-reference or view query. The same exported name is also the runtime directive imported in Angular components; use a normal import when adding it to `imports`.

## Declaration

```ts
type FormNodeDirective<TNode extends AnyNode | WritableSignal<unknown> = AnyNode> = FormNodeBinding<BoundNode<TNode, unknown>>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNode` | `AnyNode \| WritableSignal<unknown>` | `AnyNode` |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FormNodeBinding](./form-node-binding.md)
