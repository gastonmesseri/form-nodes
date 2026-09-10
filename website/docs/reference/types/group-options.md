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

Use when a structural group needs its own validators or state options. Groups do not accept the form-specific submission workflow. The `configure` callback receives this instance’s typed, collision-safe API synchronously once. See [configuration lifecycle and sibling rules](../../guides/configuring-nodes.md).

## Declaration

```ts
type GroupOptions<TValue = any, TGroup extends AnyNode = GroupNode<any>> = Omit<FormOptions<TValue>, 'configure' | 'onValueChange' | 'onSubmit' | 'onSubmitBlocked' | 'submitWhen' | 'validators' | 'debounce' | 'hidden' | 'disabled' | 'readonly'> & {
    onValueChange?(value: TValue, node: TGroup): void;
    configure?: (api: TGroup['$api']) => void;
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
| `onValueChange` | Runs synchronously after a committed public value changes, for control and programmatic writes. Skips initialization and values retained by equal. Control writes respect debounce. Aggregate operations notify once after their children are updated, with descendants first. Runs untracked, without requiring an injector; does not wait for asynchronous validation. Callback writes are delivered after the current callback. Return values are ignored. |
| `configure` | Configures this instance synchronously once, after its own API and children are ready. Receives the collision-safe callable `$api`, so child names cannot hide operations. Runs untracked; install validators here to track their reads when validation executes. Runs for every fresh template clone. Existing instances do not rerun on reset, moves, or edits. Ancestors may not be attached yet. Do not read the variable being initialized here. Returned values are ignored; this is not an async or cleanup lifecycle hook. |
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
