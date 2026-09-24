---
title: NodeCallbackContext
---

# NodeCallbackContext

Structural position supplied to node callbacks.

## Import

```ts
import type { NodeCallbackContext } from '@ngblocks/form-nodes';
```

## When to use it

The callback context shared by availability, value-change, and form submission callbacks. `index` is the zero-based position of the item containing the node in its nearest array ancestor, or `null` outside arrays. The same location is available on every node as a readonly `index()` signal. Reactive availability callbacks track the structural read; event callbacks receive the current position when invoked. Validators inherit this context through `ValidatorContext`.

## Declaration

```ts
type NodeCallbackContext = {
    readonly index: number | null;
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `index` | Zero-based position of the item containing this node in its nearest array ancestor, or `null` when no array contains it. A field inside nested groups uses the index of the enclosing array item, not its property key. With nested arrays, the innermost containing array wins. Reads reflect moves, attachment, and detachment; the result is `null` whenever no containing array remains. Reactive availability callbacks and synchronous validators track this read and update after a move. Async validators track it when read before their first `await`; parameterized async validators should read it in `params` when a move must start new work. Value-change callbacks receive the position at delivery time, and form submission callbacks receive it when invoked. This is a number, not a signal; read it in each callback execution instead of saving an earlier index. On a node, the same location is available as the reactive `node.index()` signal. Validators configured with `reactive: false` do not track the structural read. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
