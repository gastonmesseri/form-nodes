---
title: FormPrimitivesOptions
---

# FormPrimitivesOptions

Shared defaults supplied to createFormPrimitives().

## Import

```ts
import type { FormPrimitivesOptions } from '@ngblocks/form-nodes';
```

## When to use it

Use for the defaults supplied to [`createFormPrimitives()`](../create-form-primitives.md). Per-node declarations can still provide their own options where supported.

## Declaration

```ts
type FormPrimitivesOptions<TNullable extends boolean = true> = {
    syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | {
        inputs: 'declared' | 'all' | readonly SyncInputName[];
        target?: 'all' | 'signal-controls' | 'cva' | undefined;
    } | null | undefined;
    bindInputOutputPairs?: boolean | null | undefined;
    nullable?: TNullable;
    validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined);
    inheritInjector?: boolean;
    adoptBindingInjector?: boolean;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNullable` | `boolean` | `true` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `syncInputs` | **EXPERIMENTAL — uses Angular internals. Disabled by default.** |
| `bindInputOutputPairs` | **EXPERIMENTAL — uses Angular internals. Disabled by default.** |
| `nullable` | Default nullability for fields created by this primitive set. Defaults to `true`. |
| `validatorMessages` | Default built-in validator messages for nodes created by these factories. |
| `inheritInjector` | Default injector-inheritance policy for nodes created by these factories. Defaults to `true`. |
| `adoptBindingInjector` | Default host-injector adoption policy for nodes created by these factories. Defaults to `true`. |

## Related reference

- [createFormPrimitives()](../create-form-primitives.md)
- [Public types index](./index.md)
- [SyncInputName](./sync-input-name.md)
- [ValidatorMessages](./validator-messages.md)
