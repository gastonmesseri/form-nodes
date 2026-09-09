---
title: SyncInputs
---

# SyncInputs

Controls which node states and constraints are synchronized to a bound control.

## Import

```ts
import type { SyncInputs } from '@ngblocks/form-nodes';
```

## When to use it

Use to configure synchronization on bindings or configured primitives. This chooses synchronized inputs; it does not change the underlying node's validation or state.

## Declaration

```ts
type SyncInputs = false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | {
    inputs: 'declared' | 'all' | readonly SyncInputName[];
    target?: 'all' | 'signal-controls' | 'cva' | undefined;
};
```

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [SyncInputName](./sync-input-name.md)
