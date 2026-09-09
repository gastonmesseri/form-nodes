---
title: FormNodeSubmitEvent
---

# FormNodeSubmitEvent

A native form submission attempt. Values are exposed snapshots; `form` is the bound node.

## Import

```ts
import type { FormNodeSubmitEvent } from '@ngblocks/form-nodes';
```

## When to use it

Use for template submit and submit-blocked handlers. The generic preserves the bound form and value types; `event` is the original native event, and `form.$api` gives collision-safe access.

## Declaration

```ts
type FormNodeSubmitEvent<TNode extends AnyNode = AnyNode> = {
    readonly value: NodeValue<TNode>;
    readonly form: TNode;
    readonly event: Event;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNode` | `AnyNode` | `AnyNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `value` | Exposed form value after pending control input has been flushed. |
| `form` | Bound form node. Use `$api` for collision-safe state and operations. |
| `event` | Original native submit event, including SubmitEvent.submitter when available. |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
