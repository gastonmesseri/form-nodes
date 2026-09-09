---
title: AsyncValidatorState
---

# AsyncValidatorState

Non-validation state available through the validated node API.

## Import

```ts
import type { AsyncValidatorState } from '@ngblocks/form-nodes';
```

## When to use it

Use for the state contract available through validator node APIs. Its declaration intentionally avoids recursively depending on the validation state being computed.

## Declaration

```ts
type AsyncValidatorState = {
    readonly submitting: Signal<boolean>;
    readonly touched: Signal<boolean>;
    readonly untouched: Signal<boolean>;
    readonly dirty: Signal<boolean>;
    readonly pristine: Signal<boolean>;
    readonly disabled: Signal<boolean>;
    readonly disabledReasons: Signal<readonly DisabledReason[]>;
    readonly enabled: Signal<boolean>;
    readonly readonly: Signal<boolean>;
    readonly writable: Signal<boolean>;
    readonly hidden: Signal<boolean>;
    readonly visible: Signal<boolean>;
    readonly required: Signal<boolean>;
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `submitting` | Whether this node or an ancestor form is currently running its submission action. |
| `touched` | Whether this node has been marked as interacted with. |
| `untouched` | Logical inverse of `touched()`; true until this node is marked as touched. |
| `dirty` | Whether user interaction or `markAsDirty()` has recorded this node as modified. |
| `pristine` | Logical inverse of `dirty()`; true while the node does not report user modification. |
| `disabled` | Whether this node is excluded from validation and aggregate values. |
| `disabledReasons` | Active reasons that currently make this node disabled. |
| `enabled` | Logical inverse of `disabled()`; true while the node participates normally. |
| `readonly` | Whether consumers should prevent the user from editing this node. |
| `writable` | Logical inverse of `readonly()`; true while the node may be edited. |
| `hidden` | Whether consumers should omit this node from the visible UI. |
| `visible` | Logical inverse of `hidden()`; true while the node should be displayed. |
| `required` | Whether the current validation rules require this node to contain a value. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [DisabledReason](./disabled-reason.md)
