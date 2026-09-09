---
title: ValidatorMessageParameters
---

# ValidatorMessageParameters

Structured built-in error data available to a configured message function.

## Import

```ts
import type { ValidatorMessageParameters } from '@ngblocks/form-nodes';
```

## When to use it

Use when writing reusable message functions that need built-in structured error data. The selected error kind determines which parameters are available.

## Declaration

```ts
type ValidatorMessageParameters<TKind extends keyof BuiltInValidationErrorMap> = Omit<BuiltInValidationErrorMap[TKind], keyof ValidationError | 'targetNode' | 'formNode'>;
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TKind` | `keyof BuiltInValidationErrorMap` | Required |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [ValidationError](./validation-error.md)
