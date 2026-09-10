---
title: FormNodeStateOptions
---

# FormNodeStateOptions

Reactive error contribution configured by a custom-control component.

## Import

```ts
import type { FormNodeStateOptions } from '@ngblocks/form-nodes';
```

## When to use it

Configure a reactive component-owned error source for [`useFormNodeState()`](../form-node-state.md#contribute-errors). Return an error, a message, a readonly array, or no result.

## Declaration

```ts
type FormNodeStateOptions = {
    errors?: () => ControlError | string | null | undefined | void | readonly (ControlError | string)[];
};
```

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `errors` | Contributes component-owned errors to the current binding. Strings become kind 'custom'. null, undefined, void, and [] mean no errors. Reads track signal dependencies, even if the bound value stays unchanged. Read local control state, never the resulting state.errors(). Returning no errors removes only this contribution; destruction and rebinding clean it up. CVAs using Angular 22 Signal Forms also need provideFormNodeStateErrors(). |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [ControlError](./control-error.md)
