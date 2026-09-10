---
title: ControlStateError
---

# ControlStateError

A validation error normalized across supported Angular form-binding APIs.

## Import

```ts
import type { ControlStateError } from '@ngblocks/form-nodes';
```

## When to use it

Use when rendering errors obtained from [`useFormNodeState()`](../form-node-state.md). This is a source-neutral error contract rather than a guarantee of a Form Nodes target node.

## Declaration

```ts
type ControlStateError = {
    readonly kind: string;
    readonly [property: string]: unknown;
};
```

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
