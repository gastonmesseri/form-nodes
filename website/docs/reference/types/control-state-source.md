---
title: ControlStateSource
---

# ControlStateSource

Binding APIs that can supply a universal `ControlState` state facade.

## Import

```ts
import type { ControlStateSource } from '@ngblocks/form-nodes';
```

## When to use it

Use to inspect which binding API supplies a [`ControlState`](./control-state.md). The source can be absent when no supported binding is available; observe the facade's `source` signal.

## Declaration

```ts
type ControlStateSource = 'formNode' | 'formField' | 'formControl' | 'formControlName' | 'ngModel';
```

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
