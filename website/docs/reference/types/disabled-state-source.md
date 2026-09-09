---
title: DisabledStateSource
---

# DisabledStateSource

A static or reactive condition that disables a node, optionally with a user-facing reason.

## Import

```ts
import type { DisabledStateSource } from '@ngblocks/form-nodes';
```

## When to use it

Use when sharing a disabled configuration between declarations. A string supplies a reason; reactive functions participate in state dependency tracking.

## Declaration

```ts
type DisabledStateSource = boolean | string | (() => boolean | string);
```

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
