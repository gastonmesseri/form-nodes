---
title: ControlError
---

# ControlError

Errors a custom control may contribute without targeting another control.

## Import

```ts
import type { ControlError } from '@ngblocks/form-nodes';
```

## When to use it

Use for structured component errors contributed through [`useFormNodeState({ errors })`](../form-node-state.md#contribute-errors). Errors belong to the host binding and cannot target another node.

## Declaration

```ts
type ControlError = ControlStateError & {
    readonly message?: string;
    readonly targetNode?: never;
    readonly fieldTree?: never;
    readonly formField?: never;
    readonly formNode?: never;
};
```

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [ControlStateError](./control-state-error.md)
