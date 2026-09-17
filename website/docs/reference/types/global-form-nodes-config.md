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
| `syncInputs` | Reactively copies node state and constraints into matching custom-control inputs. This is one-way node-to-component synchronization; it does not enable value binding, execute validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs. |
| `bindInputOutputPairs` | Connects recognized value/valueChange or checked/checkedChange input/output pairs. CVAs and actual model signals keep priority. Enabling a pair connects values and interaction hooks; optional state inputs are selected independently by `syncInputs`. |
| `classes` | Default class map for new bindings. Null clears it; explicit maps replace rather than merge. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [FormNodeBinding](./form-node-binding.md)
- [SyncInputName](./sync-input-name.md)
- [ValidatorMessages](./validator-messages.md)
