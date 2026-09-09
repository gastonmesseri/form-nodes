---
title: SyncInputName
---

# SyncInputName

Names accepted when selecting individual synchronized control inputs.

## Import

```ts
import type { SyncInputName } from '@ngblocks/form-nodes';
```

## When to use it

Use when constructing a typed list of individual synchronized state or constraint names. Pass the list through the appropriate `syncInputs` configuration.

## Declaration

```ts
type SyncInputName = 'disabled' | 'disabledReasons' | 'dirty' | 'errors' | 'hidden' | 'invalid' | 'max' | 'maxLength' | 'min' | 'minLength' | 'name' | 'pattern' | 'pending' | 'readonly' | 'required' | 'touched';
```

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
