---
title: ControlStateDisabledReason
---

# ControlStateDisabledReason

A source-neutral explanation for why the bound control is disabled.

## Import

```ts
import type { ControlStateDisabledReason } from '@ngblocks/form-nodes';
```

## When to use it

Use for disabled explanations from `useFormNodeState()`. Unlike node-specific `DisabledReason`, this contract does not assume the original source is a Form Nodes node.

## Declaration

```ts
type ControlStateDisabledReason = {
    readonly message?: string;
};
```

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
