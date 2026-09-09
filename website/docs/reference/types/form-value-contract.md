---
title: FormValueContract
---

# FormValueContract

Structural contract for checking a form or group against an aggregate value type without replacing its inferred child-node types.

## Import

```ts
import type { FormValueContract } from '@ngblocks/form-nodes';
```

## When to use it

Use to check a form or group against an application value shape while preserving its inferred children. It is a structural compatibility contract, not a factory or a replacement node instance.

## Declaration

```ts
type FormValueContract<TValue extends object> = {
    (): TValue;
    value: Signal<TValue>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | `object` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
