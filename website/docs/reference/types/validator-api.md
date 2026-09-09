---
title: ValidatorApi
---

# ValidatorApi

Common node API exposed to validators when no exact owner API is specified.

## Import

```ts
import type { ValidatorApi } from '@ngblocks/form-nodes';
```

## When to use it

Use for the generic node API available inside synchronous validator contexts. Supply a more specific owner through the validator's generics only when the consuming contract guarantees it.

## Declaration

```ts
type ValidatorApi<TValue> = AsyncValidatorState & {
    readonly form: Signal<ValidatorForm | null>;
    readonly root: Signal<ValidatorNode>;
    readonly parent: Signal<ValidatorForm | ValidatorGroup | ArrayNode<DynamicNode> | null>;
    readonly path: Signal<readonly string[]>;
    readonly value: Signal<TValue>;
    readonly errors: NodeErrorsSignal;
    readonly allErrors: Signal<readonly ValidationError[]>;
    readonly valid: Signal<boolean>;
    readonly invalid: Signal<boolean>;
    readonly pending: Signal<boolean>;
    readonly debouncing: Signal<boolean>;
    readonly validationStatus: Signal<ValidationStatus>;
    getError<TKind extends string>(kind: TKind): ValidationErrorForKind<TKind> | undefined;
    set(value: TValue): void;
    update(updater: (value: TValue) => TValue): void;
    flush(): void;
    reset(...args: [
    ] | [
        value: TValue
    ]): void;
    markAsTouched(options?: {
        skipDescendants?: boolean;
    }): void;
    markAsUntouched(): void;
    markAsDirty(): void;
    markAsPristine(): void;
    disable(message?: string): void;
    enable(): void;
    markAsReadonly(): void;
    markAsWritable(): void;
    hide(): void;
    show(): void;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `form` | Nearest explicit form workflow, or `null` when none owns the validated node. Exposes the complete form API directly; unknown child keys are available through `get()`. |
| `root` | Complete structural root, including a standalone field. Common node members are available directly; narrow the node kind before using primitive-specific operations. |
| `parent` | Immediate form, group, or array parent, or `null` for a standalone node. Common node members are available directly. A field can never be a parent. |
| `path` | Property names and array indexes locating the node from its root. |
| `value` | Current committed value of the node being validated. |
| `errors` | Own validation errors by default; pass `{ descendants: true }` to include descendants. |
| `allErrors` | Errors owned by this node and every descendant. |
| `valid` | Whether this node and its descendants have no active errors or unresolved validation. |
| `invalid` | Whether this node or a descendant currently contributes an error. False while unknown. |
| `pending` | Whether asynchronous validation is running on this node or a descendant. |
| `debouncing` | Whether asynchronous validation is waiting for its debounce delay. |
| `validationStatus` | Current aggregate result: valid, invalid, or unknown while validation is unresolved. |
| `getError` | Returns this node's first direct error with `kind`, or `undefined` when none exists. |
| `set` | Replaces the node's committed value and triggers the corresponding state and validation updates. |
| `update` | Replaces the value with the result of applying `updater` to its current committed value. |
| `flush` | Commits any buffered control value immediately and runs validation that was waiting for it. |
| `reset` | Clears interaction state; preserves the current value unless a replacement is provided. |
| `markAsTouched` | Marks this node as touched and, unless skipped, propagates the operation to descendants. |
| `markAsUntouched` | Marks this node as untouched without changing its value. |
| `markAsDirty` | Marks this node as dirty without changing its value. |
| `markAsPristine` | Clears stored dirty state without changing the current value. |
| `disable` | Adds an imperative disabled reason, excluding this node from validation and aggregate values. |
| `enable` | Removes disabled reasons previously added through `disable()`. |
| `markAsReadonly` | Adds the imperative readonly state, making `readonly()` true. |
| `markAsWritable` | Removes the readonly state previously added through `markAsReadonly()`. |
| `hide` | Adds the imperative hidden state, making `visible()` false. |
| `show` | Removes the hidden state previously added through `hide()`, making `visible()` true. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [ArrayNode](./array-node.md)
- [AsyncValidatorState](./async-validator-state.md)
- [DynamicNode](./dynamic-node.md)
- [NodeErrorsSignal](./node-errors-signal.md)
- [ValidationError](./validation-error.md)
- [ValidationErrorForKind](./validation-error-for-kind.md)
- [ValidationStatus](./validation-status.md)
