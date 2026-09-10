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
| `onValueChange` | Runs synchronously after a committed public value changes, for control and programmatic writes. Skips initialization and values retained by equal. Control writes respect debounce. Aggregate operations notify once after their children are updated, with descendants first. Runs untracked, without requiring an injector; does not wait for asynchronous validation. Callback writes are delivered after the current callback. Return values are ignored. |
| `configure` | Configures this instance synchronously once, after its own API and children are ready. Receives the collision-safe callable `$api`, so child names cannot hide operations. Runs untracked; install validators here to track their reads when validation executes. Runs for every fresh template clone. Existing instances do not rerun on reset, moves, or edits. Ancestors may not be attached yet. Do not read the variable being initialized here. Returned values are ignored; this is not an async or cleanup lifecycle hook. |
| `syncInputs` | **EXPERIMENTAL — uses Angular internals. Disabled by default.** |
| `bindInputOutputPairs` | **EXPERIMENTAL — uses Angular internals. Disabled by default.** |
| `equal` | Equality for the exposed value. Defaults to `Object.is`. Equivalent values retain the previous public value for consumers and validators while internal storage and controls accept new writes. The comparator is captured at construction and runs untracked when the exposed computed is evaluated. Its first evaluation does not compare; comparator errors affect exposed reads. |
| `validators` | One validator or an array of validators for this field's value. |
| `injector` | Optional injector that owns the asynchronous validation watcher lifecycle. |
| `inheritInjector` | Whether this node may use the injector of its parent or another ancestor when it has no injector of its own. Defaults to `true`. Set to `false` to create an injector-inheritance boundary while preserving an explicit or currently captured injector on this node. |
| `adoptBindingInjector` | Whether this node may temporarily adopt the injector of a directly bound `[formNode]` host when it has no injector of its own. Defaults to `true`. The binding injector takes precedence over an inherited ancestor injector and is released when the binding is destroyed or rebound. |
| `debounce` | Delay strategy for control updates. A number waits in milliseconds, `'blur'` waits for focus loss, and a function commits when its returned promise resolves. Overrides an inherited debounce. |
| `hidden` | Initial or reactive visibility of this field. |
| `disabled` | Initial or reactive disabled state. Return a string to disable the field and expose the reason through `disabledReasons()`. |
| `readonly` | Initial or reactive readonly state. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [FieldNode](./field-node.md)
- [SyncInputName](./sync-input-name.md)
- [ValidatorSource](./validator-source.md)
