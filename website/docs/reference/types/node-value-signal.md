---
title: NodeValueSignal
---

# NodeValueSignal

Reactive value views shared by fields, groups, forms, and arrays. Calling this signal is equivalent to calling the node: configured `equal` checks can retain an earlier equivalent value. Prefer calling the node for ordinary application reads.

## Import

```ts
import type { NodeValueSignal } from '@ngblocks/form-nodes';
```

## When to use it

Use when a helper accepts the public `value` facade, including `committed` and `control` reads and setters. Ordinary application value reads can call the node directly.

## Declaration

```ts
type NodeValueSignal<TValue, TSet = TValue> = Signal<TValue> & HiddenFunctionMembers & {
    committed: Signal<TValue> & HiddenFunctionMembers & {
        set(value: TSet): void;
    };
    control: Signal<TValue> & HiddenFunctionMembers & {
        set(value: TSet): void;
    };
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TSet` | Unconstrained | `TValue` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `committed` | Latest committed data, bypassing configured `equal` checks on this node and its descendants. **Pending debounce is still respected:** this signal does not read uncommitted control input. Aggregate snapshots use committed child data, including writes hidden by child equality. Angular's ordinary signal identity checks still apply; this is not an event for every write. |
| `control` | Latest control value, including this node's pending debounce, independent of configured `equal`. **For an aggregate this is its own control buffer, not a recursive collection of child drafts.** Without its own pending input, an aggregate reads committed child data. Read each child's `value.control()` separately when pending descendant input is needed. |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
