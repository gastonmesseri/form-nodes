---
title: GroupOptions
---

# GroupOptions

Configuration shared by object-shaped groups, excluding form submission behavior.

## Import

```ts
import type { GroupOptions } from '@ngblocks/form-nodes';
```

## When to use it

Use when a structural group needs its own validators or state options. Groups do not accept the form-specific submission workflow.

## Declaration

```ts
type GroupOptions<TValue = any, TGroup extends AnyNode = GroupNode<any>> = Omit<FormOptions<TValue>, 'onSubmit' | 'onSubmitBlocked' | 'submitWhen' | 'validators' | 'debounce' | 'hidden' | 'disabled' | 'readonly'> & {
    validators?: ValidatorSource<TValue, TGroup>;
    debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);
    hidden?: boolean | (() => boolean);
    disabled?: boolean | string | (() => boolean | string);
    readonly?: boolean | (() => boolean);
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | `any` |
| `TGroup` | `AnyNode` | `GroupNode<any>` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `validators` | One validator or an array of validators for the complete group value. |
| `debounce` | Default control-value debounce inherited by descendants of this object branch. |
| `hidden` | Initial or reactive visibility of the complete object branch. |
| `disabled` | Initial or reactive disabled state for the branch and its children. Return a string to record a user-facing reason. |
| `readonly` | Initial or reactive readonly state for the branch and its children. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FormOptions](./form-options.md)
- [GroupNode](./group-node.md)
- [ValidatorSource](./validator-source.md)
