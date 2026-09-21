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
type FormPrimitivesOptions<TNullable extends boolean | undefined = boolean | undefined> = {
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
| `TNullable` | `boolean \| undefined` | `boolean \| undefined` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `syncInputs` | Reactively copies node state and constraints into matching custom-control inputs. This is one-way node-to-component synchronization; it does not enable value binding, execute validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs. |
| `bindInputOutputPairs` | Connects recognized value/valueChange or checked/checkedChange input/output pairs. CVAs and actual model signals keep priority. Enabling a pair connects values and interaction hooks; optional state inputs are selected independently by `syncInputs`. |
| `nullable` | Default nullability for fields created by this primitive set. |
| `validatorMessages` | Default built-in validator messages for nodes created by these factories. |
| `inheritInjector` | Default injector-inheritance policy for nodes created by these factories. |
| `adoptBindingInjector` | Default host-injector adoption policy for nodes created by these factories. |

## Related reference

- [createFormPrimitives()](../create-form-primitives.md)
- [Public types index](./index.md)
- [SyncInputName](./sync-input-name.md)
- [ValidatorMessages](./validator-messages.md)
