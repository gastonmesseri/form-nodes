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

Use when sharing field configuration. Let `field()` infer value and owner types for ordinary declarations instead of annotating every options object.

## Declaration

```ts
type FieldOptions<TValue = any> = {
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
