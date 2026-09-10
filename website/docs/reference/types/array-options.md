---
title: ArrayOptions
---

# ArrayOptions

Template, initial-data, validation, and ownership configuration for array().

## Import

```ts
import type { ArrayOptions } from '@ngblocks/form-nodes';
```

## When to use it

Use for array initialization and reconciliation options. Keep initial records and options such as `trackBy` together in the array declaration. The `configure` callback receives this instance’s typed, collision-safe API synchronously once. See [configuration lifecycle and sibling rules](../../guides/configuring-nodes.md).

## Declaration

```ts
type ArrayOptions<TValue = any, TArray extends AnyNode = ArrayNode<AnyNode>> = Omit<FormOptions<TValue>, 'configure' | 'onValueChange' | 'onSubmit' | 'onSubmitBlocked' | 'submitWhen' | 'validators' | 'debounce' | 'hidden' | 'disabled' | 'readonly'> & {
    onValueChange?(value: TValue, node: TArray): void;
    configure?: (api: TArray['$api']) => void;
    validators?: ValidatorSource<TValue, TArray>;
    debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);
    hidden?: boolean | (() => boolean);
    disabled?: boolean | string | (() => boolean | string);
    readonly?: boolean | (() => boolean);
    initialValue?: TValue | number | null;
    trackBy?: TValue extends readonly (infer TItemValue)[] ? ((value: TItemValue, index: number) => unknown) | (TItemValue extends object ? Extract<keyof TItemValue, string> : never) : never;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | `any` |
| `TArray` | `AnyNode` | `ArrayNode<AnyNode>` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `onValueChange` | Runs synchronously after a committed public value changes, for control and programmatic writes. Skips initialization and values retained by equal. Control writes respect debounce. Aggregate operations notify once after their children are updated, with descendants first. Runs untracked, without requiring an injector; does not wait for asynchronous validation. Callback writes are delivered after the current callback. Return values are ignored. |
| `configure` | Configures this instance synchronously once, after its own API and children are ready. Receives the collision-safe callable `$api`, so child names cannot hide operations. Runs untracked; install validators here to track their reads when validation executes. Runs for every fresh template clone. Existing instances do not rerun on reset, moves, or edits. Ancestors may not be attached yet. Do not read the variable being initialized here. Returned values are ignored; this is not an async or cleanup lifecycle hook. An array callback configures the collection; configure its group/form template for per-row rules. |
| `validators` | One validator or an array of validators for the complete array value, not each item. |
| `debounce` | Default control-value debounce inherited by every current and future item. |
| `hidden` | Initial or reactive visibility of the complete collection. |
| `disabled` | Initial or reactive disabled state for the collection and its items. Return a string to record a user-facing reason. |
| `readonly` | Initial or reactive readonly state for the collection and its items. |
| `initialValue` | **Initial array contents.** Accepts either: |
| `trackBy` | Selects the stable identity of an item when `set()`, `update()`, or `reset(value)` reconciles incoming values with the array's current nodes. Pass either a typed property name such as `'id'` or a callback for computed or non-property keys. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ArrayNode](./array-node.md)
- [FormOptions](./form-options.md)
- [ValidatorSource](./validator-source.md)
