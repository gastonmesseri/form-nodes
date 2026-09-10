---
title: FormNodeErrorsContext
---

# FormNodeErrorsContext

Context supplied once to the projected #message template when visible messages exist.

## Import

```ts
import type { FormNodeErrorsContext } from '@ngblocks/form-nodes';
```

## When to use it

Context for the projected `#message` template in [`FormNodeErrors`](../form-node-errors.md#custom-template), exposing the first visible message, all visible messages, and their error details.

## Declaration

```ts
type FormNodeErrorsContext = {
    readonly $implicit: string;
    readonly message: string;
    readonly messages: readonly string[];
    readonly errors: readonly ControlStateError[];
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `$implicit` | First visible resolved message, available through let-message. |
| `message` | Named alias of the first visible resolved message. |
| `messages` | Visible resolved messages, after filtering and maxMessages. |
| `errors` | Error details corresponding to the visible messages, in the same order. |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [ControlStateError](./control-state-error.md)
