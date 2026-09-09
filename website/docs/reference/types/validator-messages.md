---
title: ValidatorMessages
---

# ValidatorMessages

Partial catalog used to replace built-in validator messages by error kind.

## Import

```ts
import type { ValidatorMessages } from '@ngblocks/form-nodes';
```

## When to use it

Use for a partial built-in message catalog supplied through configuration. Omitted entries continue through the normal message-resolution fallbacks.

## Declaration

```ts
type ValidatorMessages = {
    -readonly [TKind in keyof BuiltInValidationErrorMap]?: string | ((parameters: ValidatorMessageParameters<TKind>) => string | undefined);
};
```

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [ValidatorMessageParameters](./validator-message-parameters.md)
