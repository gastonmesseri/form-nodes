---
title: DynamicFormChildren
---

# DynamicFormChildren

Readonly runtime-key map of dynamic and initially declared children.

## Import

```ts
import type { DynamicFormChildren } from '@ngblocks/form-nodes';
```

## When to use it

Use for runtime-key child iteration when exact property names are unknown. Access each child's `$api` to avoid direct member collisions.

## Declaration

```ts
type DynamicFormChildren = {
    readonly [key: string]: DynamicNode | undefined;
};
```

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [DynamicNode](./dynamic-node.md)
