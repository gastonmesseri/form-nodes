---
title: ControlState
---

# ControlState

Read-only state of the form binding attached to a custom-control component.

## Import

```ts
import type { ControlState } from '@ngblocks/form-nodes';
```

## When to use it

Use for reusable UI that observes a binding through [`useFormNodeState()`](../form-node-state.md). This read-only facade normalizes supported Angular binding sources and does not expose node write operations.

## Declaration

```ts
type ControlState<TValue = unknown> = {
    readonly form: ClosestFormState;
    readonly formSubmitted: Signal<boolean>;
    readonly connected: Signal<boolean>;
    readonly source: Signal<ControlStateSource | null>;
    readonly value: Signal<TValue | undefined>;
    readonly disabled: Signal<boolean>;
    readonly disabledReasons: Signal<readonly ControlStateDisabledReason[]>;
    readonly dirty: Signal<boolean>;
    readonly errors: Signal<readonly ControlStateError[]>;
    readonly hidden: Signal<boolean>;
    readonly invalid: Signal<boolean>;
    readonly max: Signal<number | Date | undefined>;
    readonly maxLength: Signal<number | undefined>;
    readonly min: Signal<number | Date | undefined>;
    readonly minLength: Signal<number | undefined>;
    readonly name: Signal<string | undefined>;
    readonly pattern: Signal<readonly RegExp[]>;
    readonly pending: Signal<boolean>;
    readonly readonly: Signal<boolean>;
    readonly required: Signal<boolean>;
    readonly touched: Signal<boolean>;
    hasError(kind: string): boolean;
    getError(kind: string): ControlStateError | undefined;
    hasValidator(validator: unknown, options?: {
        resolve?: boolean;
    }): boolean | undefined;
    markAsTouched(): void;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | `unknown` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `form` | Nearest form submission state and optional Form Nodes API; independent of the host control connection. |
| `formSubmitted` | Shortcut to form.submitted: whether the nearest form recorded an attempt, including an invalid one. The same readonly signal; false without a supported form. |
| `connected` | Whether a supported form binding is attached to the component host. |
| `source` | API currently supplying the state, or `null` when the component is not bound. |
| `value` | Current committed bound value, independent of Form Nodes node equality and pending input, or `undefined` when disconnected. |
| `disabled` | Whether the bound control is disabled. |
| `disabledReasons` | Reasons currently disabling the bound control. |
| `dirty` | Whether the user has changed the bound control. |
| `errors` | Validation errors normalized to objects containing a `kind`. |
| `hidden` | Whether the bound control is hidden by form state. |
| `invalid` | Whether the bound control is invalid. |
| `max` | Effective maximum numeric or date constraint. Angular control bindings read the host MaxValidator input. |
| `maxLength` | Effective maximum-length constraint, including the host Angular MaxLengthValidator input. |
| `min` | Effective minimum numeric or date constraint. Angular control bindings read the host MinValidator input. |
| `minLength` | Effective minimum-length constraint, including the host Angular MinLengthValidator input. |
| `name` | Generated name associated with the binding, or `undefined` when disconnected. |
| `pattern` | Effective regular-expression patterns. Angular PatternValidator strings are anchored; RegExp objects retain their flags and identity. |
| `pending` | Whether validation is currently pending. |
| `readonly` | Whether the bound control is readonly. |
| `required` | Whether the bound control requires a non-empty value. For Reactive Forms and ngModel, recognizes directly registered Angular Validators.required / Validators.requiredTrue and an active required directive on the same host. Reads rule presence even when the current value is valid or disabled. Also true while the bound control has an own normalized error with kind `required` or `requiredTrue`, on any supported source. Arbitrary composed validators are not executed to discover this state. |
| `touched` | Whether the user has interacted with and left the bound control. |
| `hasError` | Whether the current normalized error list contains an exact, case-sensitive kind. Returns false when absent or disconnected, regardless of an error payload's truthiness. Queries only errors() and does not traverse child paths or explicitly trigger validation. |
| `getError` | Returns the first normalized error with an exact, case-sensitive kind, or undefined when absent or disconnected. Returns the same object as errors(), including kind and details. Queries only errors() and does not traverse child paths or explicitly trigger validation. |
| `hasValidator` | Queries a known rule or a validator function reference on the active binding. The exported Form Nodes `required` and Angular `Validators.required` are equivalent semantic queries: both return required(), including conditional rules, requiredTrue obligations, and active own required errors. Other functions use direct registration identity: Form Nodes checks its configured validators; Reactive Forms and ngModel check synchronous and asynchronous validator references. Angular Signal Forms cannot answer arbitrary reference queries and returns undefined. |
| `markAsTouched` | Marks the bound control touched. Does nothing when no supported binding is connected. |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [ClosestFormState](./closest-form-state.md)
- [ControlStateDisabledReason](./control-state-disabled-reason.md)
- [ControlStateError](./control-state-error.md)
- [ControlStateSource](./control-state-source.md)
