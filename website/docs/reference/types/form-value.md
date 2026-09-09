---
title: FormValue
---

# FormValue

Object value produced by a form, with each child node mapped to its readable value.

## Import

```ts
import type { FormValue } from '@ngblocks/form-nodes';
```

## When to use it

Use to derive the read value contract from the form's child or item node types. The result describes raw data, not child nodes. Use `FormNodeValue<typeof node>` when starting from an existing node instance.

## Declaration

```ts
type FormValue<TNodes extends Nodes> = {
    [K in keyof TNodes]: NodeValue<TNodes[K]>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNodes` | `Nodes` | Required |

## Related reference

- [Choosing node types](../node-types.md)
- [Public types index](./index.md)
