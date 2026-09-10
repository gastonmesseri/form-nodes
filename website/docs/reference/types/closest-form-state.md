---
title: ClosestFormState
---

# ClosestFormState

Shared submission state of the form visible through Angular dependency injection.

## Import

```ts
import type { ClosestFormState } from '@ngblocks/form-nodes';
```

## When to use it

Use for shared submission UI built with [`useClosestFormState()`](../use-closest-form-state.md). Its signals normalize Form Nodes, Reactive Forms, and NgForm while retaining optional Form Nodes API access.

## Declaration

```ts
type ClosestFormState = {
    readonly connected: Signal<boolean>;
    readonly source: Signal<'formNode' | 'formGroup' | 'ngForm' | null>;
    readonly submitted: Signal<boolean>;
    readonly formNode: Signal<CallableNodeApi<FormApi<any>> | null>;
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `connected` | Whether a supported form is available. |
| `source` | Active forms API, or null when disconnected. Form Nodes takes precedence. |
| `submitted` | Whether the active form has recorded a submission attempt, including an invalid attempt. |
| `formNode` | The owning Form Nodes form's callable, collision-safe API; null for Angular forms or no form. |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [CallableNodeApi](./callable-node-api.md)
- [FormApi](./form-api.md)
