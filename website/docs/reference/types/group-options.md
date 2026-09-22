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
    hidden?: boolean | (() => any);
    disabled?: boolean | string | (() => any);
    readonly?: boolean | (() => any);
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
| `onValueChange` | Runs synchronously after the exposed value changes, including programmatic writes. Initialization and writes retained by `equal` do not notify. Control writes wait for debounce. Callbacks run untracked, without requiring an injector or waiting for async validation. Aggregate writes notify descendants before their parent, once after child updates. Reentrant writes are delivered after the current callback; returned values are ignored. |
| `configure` | Configures each new instance once, synchronously after its API and children are ready. Receives the collision-safe callable `$api`. Runs untracked; validators installed here track dependencies when they execute. Ancestors may not be attached yet. Use the callback argument rather than the variable being initialized. Fresh template clones run their own callback; reset, reordering, and edits do not rerun it. Returned values are ignored; this is neither an async hook nor a cleanup registration. |
| `validators` | Registers rules on this node's exposed value. Aggregate rules receive the complete object or array; put per-field rules on children. A synchronous composition may return validators; asynchronous rules must be wrapped with `asyncValidator()`. Null and undefined entries are ignored. Contexts are typed; inline returns intentionally allow self-reference inference. Use `validator()` or an explicit result annotation when returned errors also need strict checking. |
| `debounce` | Delays control-originated value commits. Descendants inherit this strategy unless they supply their own. Programmatic writes commit immediately. A later edit aborts the previous delay; `flush()` or an interactive `markAsTouched()` commits pending input. |
| `hidden` | Controls this node's local hidden state. Descendants inherit active hidden state; programmatic writes remain available. Hidden nodes suppress their own validation and reported interaction state. Hiding does not delete values or stored dirty/touched state. |
| `disabled` | Controls this node's local disabled state, inherited by descendants. A string disables the node and contributes a user-facing reason, including an empty string. Disabled nodes retain their values and accept programmatic writes; their own validation and reported interaction state are suppressed. Ancestor reasons cannot be cleared locally. |
| `readonly` | Controls this node's local readonly state. Descendants inherit active readonly state. It prevents control-originated edits, not programmatic writes. Readonly nodes suppress their own validation and reported dirty/touched state without discarding stored interaction. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FormOptions](./form-options.md)
- [GroupNode](./group-node.md)
- [ValidatorSource](./validator-source.md)
