---
title: FormNodeValue
---

# FormNodeValue

Committed value inferred from any `form()`, `group()`, `array()`, or `field()` instance. Equivalent to `ReturnType&lt;TNode&gt;`; preserves nested values and field nullability.

## Import

```ts
import type { FormNodeValue } from '@ngblocks/form-nodes';
```

## When to use it

Extract a value type from an existing node with `FormNodeValue<typeof myForm>`. This works across node kinds and avoids repeating the model's value interface.

## Declaration

```ts
type FormNodeValue<TNode extends AnyNode> = ReturnType<TNode>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNode` | `AnyNode` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
