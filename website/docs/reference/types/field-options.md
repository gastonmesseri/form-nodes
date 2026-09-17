---
title: FieldOptions
---

# FieldOptions

Value, validation, interaction, and ownership configuration for field().

## Import

```ts
import type { FieldOptions } from '@ngblocks/form-nodes';
```

## When to use it

Use when sharing field configuration. Let `field()` infer value and owner types for ordinary declarations instead of annotating every options object. The `configure` callback receives this instance’s typed, collision-safe API synchronously once. See [configuration lifecycle and sibling rules](../../guides/configuring-nodes.md).

## Declaration

```ts
type FieldOptions<TValue = any> = {
    onValueChange?(value: TValue, node: FieldNode<TValue>): void;
    configure?: (api: FieldNode<TValue>['$api']) => void;
    syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | {
        inputs: 'declared' | 'all' | readonly SyncInputName[];
        target?: 'all' | 'signal-controls' | 'cva' | undefined;
    } | null | undefined;
    bindInputOutputPairs?: boolean | null | undefined;
    equal?: 'deep' | 'shallow' | ((previous: TValue, next: TValue) => boolean);
    validators?: ValidatorSource<TValue, FieldNode<TValue>>;
    injector?: Injector;
    inheritInjector?: boolean;
    adoptBindingInjector?: boolean;
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

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `onValueChange` | Runs synchronously after the exposed value changes, including programmatic writes. Initialization and writes retained by `equal` do not notify. Control writes wait for debounce. Callbacks run untracked, without requiring an injector or waiting for async validation. Aggregate writes notify descendants before their parent, once after child updates. Reentrant writes are delivered after the current callback; returned values are ignored. |
| `configure` | Configures each new instance once, synchronously after its API and children are ready. Receives the collision-safe callable `$api`. Runs untracked; validators installed here track dependencies when they execute. Ancestors may not be attached yet. Use the callback argument rather than the variable being initialized. Fresh template clones run their own callback; reset, reordering, and edits do not rerun it. Returned values are ignored; this is neither an async hook nor a cleanup registration. |
| `syncInputs` | Reactively copies node state and constraints into matching custom-control inputs. This is one-way node-to-component synchronization; it does not enable value binding, execute validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs. |
| `bindInputOutputPairs` | Connects recognized value/valueChange or checked/checkedChange input/output pairs. CVAs and actual model signals keep priority. Enabling a pair connects values and interaction hooks; optional state inputs are selected independently by `syncInputs`. |
| `equal` | Compares exposed values and retains the previous exposed value when they are equal. Validators, submission, and `update()` read that exposed value. Committed storage and controls still accept new writes. The comparator is captured at construction and runs untracked when the exposed computed value evaluates; comparison errors propagate. |
| `validators` | Registers rules on this node's exposed value. Aggregate rules receive the complete object or array; put per-field rules on children. A synchronous composition may return validators; asynchronous rules must be wrapped with `asyncValidator()`. Null and undefined entries are ignored. Contexts are typed; inline returns intentionally allow self-reference inference. Use `validator()` or an explicit result annotation when returned errors also need strict checking. |
| `injector` | Provides an explicit owner for injector-dependent work, including async-validator watchers. Without one, construction captures the current injection context when available; binding adoption and ancestor inheritance provide temporary fallback ownership. Standalone nodes remain usable without dependency injection. |
| `inheritInjector` | Allows an otherwise unowned node to inherit its nearest ancestor injector. An explicit or construction-time injector takes precedence. Setting `false` creates an ancestor boundary; it does not disable an injector already owned by this node. |
| `adoptBindingInjector` | Allows an otherwise unowned node to borrow the injector of its directly bound `[formNode]` host. This binding owner takes precedence over an inherited ancestor. The lease ends on rebinding or destruction. Explicit and construction-time owners still take precedence. Setting `false` prevents only direct binding adoption. |
| `debounce` | Delays control-originated value commits. Programmatic writes commit immediately. A later edit aborts the previous delay; `flush()` or an interactive `markAsTouched()` commits pending input. |
| `hidden` | Controls this node's local hidden state. Descendants inherit active hidden state; programmatic writes remain available. Hidden nodes suppress their own validation and reported interaction state. Hiding does not delete values or stored dirty/touched state. |
| `disabled` | Controls this node's local disabled state, inherited by descendants. A string disables the node and contributes a user-facing reason, including an empty string. Disabled nodes retain their values and accept programmatic writes; their own validation and reported interaction state are suppressed. Ancestor reasons cannot be cleared locally. |
| `readonly` | Controls this node's local readonly state. Descendants inherit active readonly state. It prevents control-originated edits, not programmatic writes. Readonly nodes suppress their own validation and reported dirty/touched state without discarding stored interaction. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [FieldNode](./field-node.md)
- [SyncInputName](./sync-input-name.md)
- [ValidatorSource](./validator-source.md)
