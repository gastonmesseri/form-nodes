---
title: MarkAsTouchedOptions
---

# MarkAsTouchedOptions

Options controlling whether markAsTouched() propagates to descendants.

## Import

```ts
import type { MarkAsTouchedOptions } from '@ngblocks/form-nodes';
```

## When to use it

Use for reusable wrappers around `markAsTouched()`. `skipDescendants` limits propagation; node interactivity rules still govern whether touching applies.

## Declaration

```ts
type MarkAsTouchedOptions = {
    skipDescendants?: boolean;
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `skipDescendants` | When true, marks only the current node and leaves its descendants untouched. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
