---
title: FormNodesConfig
---

# FormNodesConfig

Injector-scoped validator messages and configuration for `[formNode]` bindings.

## Import

```ts
import type { FormNodesConfig } from '@ngblocks/form-nodes';
```

## When to use it

Use for options passed to `provideFormNodesConfig()`. Injector-scoped values configure bindings and validator messages in that scope.

## Declaration

```ts
type FormNodesConfig = {
    validatorMessages?: ValidatorMessages | (() => ValidatorMessages) | null | undefined;
    syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | {
        inputs: 'declared' | 'all' | readonly SyncInputName[];
        target?: 'all' | 'signal-controls' | 'cva' | undefined;
    } | null | undefined;
    bindInputOutputPairs?: boolean | null | undefined;
    classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `validatorMessages` | A partial catalog or a factory executed in Angular DI. Omission inherits; null supplies an empty provider catalog. |
| `syncInputs` | **EXPERIMENTAL — uses Angular internals. Disabled by default.** |
| `bindInputOutputPairs` | **EXPERIMENTAL — uses Angular internals. Disabled by default.** |
| `classes` | CSS class names and their reactive activation predicates. Omission inherits; an explicit map replaces inherited classes; null clears classes. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [FormNodeBinding](./form-node-binding.md)
- [SyncInputName](./sync-input-name.md)
- [ValidatorMessages](./validator-messages.md)
