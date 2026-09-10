---
title: ArrayItemNode
---

# ArrayItemNode

The existing item node type of an array node, excluding undefined.

## Import

```ts
import type { ArrayItemNode } from '@ngblocks/form-nodes';
```

## When to use it

Extract an existing item node from an already inferred array: `ArrayItemNode<typeof profile.roles>`. Preserves child types and parent navigation while excluding the missing-index `undefined` case. See [configuring sibling rules](../../guides/configuring-nodes.md).

## Declaration

```ts
type ArrayItemNode<TArray extends {
    $api: {
        nodeType(): 'array';
    };
    readonly [index: number]: AnyNode | undefined;
}> = NonNullable<TArray[number]>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TArray` | `{ $api: { nodeType(): 'array' }; readonly [index: number]: AnyNode \| undefined }` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
