---
title: FormNodeUiControl
---

# FormNodeUiControl

Optional state inputs and interaction hooks recognized by `[formNode]` on Angular 21 and 22.

## Import

```ts
import type { FormNodeUiControl } from '@ngblocks/form-nodes';
```

## When to use it

Use for the optional state inputs and interaction hooks shared by custom controls. It does not by itself supply the required value or checked model.

## Declaration

```ts
type FormNodeUiControl<TValue, TNode extends AnyNode = FieldNode<TValue>> = {
    disabled?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;
    readonly?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;
    hidden?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;
    invalid?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;
    pending?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;
    touched?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;
    dirty?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;
    required?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;
    errors?: InputSignal<readonly ValidationError[]> | InputSignalWithTransform<readonly ValidationError[], unknown>;
    disabledReasons?: InputSignal<readonly DisabledReason[]> | InputSignalWithTransform<readonly DisabledReason[], unknown>;
    name?: InputSignal<string> | InputSignalWithTransform<string, unknown>;
    min?: InputSignal<NonNullable<TValue> | undefined> | InputSignalWithTransform<NonNullable<TValue> | undefined, unknown>;
    max?: InputSignal<NonNullable<TValue> | undefined> | InputSignalWithTransform<NonNullable<TValue> | undefined, unknown>;
    minLength?: InputSignal<number | undefined> | InputSignalWithTransform<number | undefined, unknown>;
    maxLength?: InputSignal<number | undefined> | InputSignalWithTransform<number | undefined, unknown>;
    pattern?: InputSignal<readonly RegExp[]> | InputSignalWithTransform<readonly RegExp[], unknown>;
    touch?: OutputRef<void>;
    focus?(options?: FocusOptions): void;
    reset?(): void;
    node?: WritableSignal<TNode | null>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TNode` | `AnyNode` | `FieldNode<TValue>` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `disabled` | Node disabled state. |
| `readonly` | Node readonly state. |
| `hidden` | Node hidden state. |
| `invalid` | Node invalid state. |
| `pending` | Node pending state. |
| `touched` | Node touched state. |
| `dirty` | Node dirty state. |
| `required` | Node required state. |
| `errors` | Validation errors on the bound node. |
| `disabledReasons` | Active disabled reasons and their originating nodes. |
| `name` | Name of the bound node. |
| `min` | Active minimum constraint. |
| `max` | Active maximum constraint. |
| `minLength` | Active minimum length. |
| `maxLength` | Active maximum length. |
| `pattern` | Active pattern constraints. |
| `touch` | Reports blur or another completed user interaction. |
| `focus` | Focuses the component's interactive element. |
| `reset` | Clears component-owned transient UI state when the node resets. |
| `node` | Optionally receives the bound node for direct state access. |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [DisabledReason](./disabled-reason.md)
- [FieldNode](./field-node.md)
- [ValidationError](./validation-error.md)
