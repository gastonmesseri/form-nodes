---
title: DisabledStateSource
---

# DisabledStateSource

A static or reactive condition that disables a node, optionally with a user-facing reason. Reactive callbacks must return a boolean or string. Their return type is intentionally unchecked to support self-referencing declarations; an explicit return annotation restores result checking. The callback receives `NodeCallbackContext.index` for the nearest containing array item.

## Import

```ts
import type { DisabledStateSource } from '@ngblocks/form-nodes';
```

## When to use it

Use when sharing a disabled configuration between declarations. A string supplies a reason; reactive functions participate in state dependency tracking.

## Declaration

```ts
type DisabledStateSource = boolean | string | ((context: NodeCallbackContext) => any);
```

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [NodeCallbackContext](./node-callback-context.md)
