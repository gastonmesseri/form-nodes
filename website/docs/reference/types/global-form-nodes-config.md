---
title: GlobalFormNodesConfig
---

# GlobalFormNodesConfig

Process-wide defaults below injector-scoped configuration.

## Import

```ts
import type { GlobalFormNodesConfig } from '@ngblocks/form-nodes';
```

## When to use it

Use for [`configureGlobalFormNodes()`](../configure-global-form-nodes.md) defaults. Prefer an injector-scoped provider when configuration must be scoped to an Angular application or subtree.

## Declaration

```ts
type GlobalFormNodesConfig = {
    validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined) | null | undefined;
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
| `validatorMessages` | Static or reactive fallback catalog. Null clears it; omission preserves the current catalog. |
| `syncInputs` | **EXPERIMENTAL — uses Angular internals. Disabled by default.** |
| `bindInputOutputPairs` | **EXPERIMENTAL — uses Angular internals. Disabled by default.** |
| `classes` | Default class map for new bindings. Null clears it; explicit maps replace rather than merge. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [FormNodeBinding](./form-node-binding.md)
- [SyncInputName](./sync-input-name.md)
- [ValidatorMessages](./validator-messages.md)
