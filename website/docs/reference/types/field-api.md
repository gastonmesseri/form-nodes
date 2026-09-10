---
title: FieldApi
---

# FieldApi

State, value views, navigation, and operations available on a field node.

## Import

```ts
import type { FieldApi } from '@ngblocks/form-nodes';
```

## When to use it

Use for helpers that operate on field state and actions without accepting a node declaration. A field's `$api` additionally has the callable signal contract described by [`CallableNodeApi`](./callable-node-api.md).

## Declaration

```ts
type FieldApi<TValue, TParent extends AnyNode = AnyNode> = {
    nodeType(): 'field';
    form: Signal<NearestForm<TParent> | null>;
    root: Signal<AnyNode extends TParent ? NavigationRoot : RootNode<TParent>>;
    parent: Signal<TParent | null>;
    path: Signal<readonly string[]>;
    keyInParent: Signal<NodeKeyInParent<TParent>>;
    value: NodeValueSignal<TValue, TValue>;
    set(value: TValue): void;
    update(updater: (value: TValue) => TValue): void;
    debouncing: Signal<boolean>;
    flush(): void;
    focus(options?: FocusOptions): void;
    patch(value: TValue): void;
    reset(...args: [
    ] | [
        value: TValue
    ]): void;
    resetToInitial(): void;
    validators: Signal<Validators<TValue>> & {
        (options: {
            resolve?: boolean;
        }): Validators<TValue>;
    };
    setValidators(validators: ValidatorSource<TValue, FieldNode<TValue>>): void;
    errors: NodeErrorsSignal<FieldNode<TValue, TParent>>;
    allErrors: Signal<readonly ValidationErrorWithTargetNode<AnyNode>[]>;
    valid: Signal<boolean>;
    invalid: Signal<boolean>;
    getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<FieldNode<TValue, TParent>> & ValidationErrorMap[TKind]) | undefined;
    getError<TKind extends string>(kind: TKind): (ValidationErrorWithTargetNode<FieldNode<TValue, TParent>> & CustomValidationError<TKind>) | undefined;
    hasError(kind: string): boolean;
    hasValidator(validator: (context: any) => unknown, options?: {
        resolve?: boolean;
    }): boolean;
    min: Signal<NonNullable<TValue> | null>;
    max: Signal<NonNullable<TValue> | null>;
    minLength: Signal<number | null>;
    maxLength: Signal<number | null>;
    pattern: Signal<readonly RegExp[]>;
    required: Signal<boolean>;
    pending: Signal<boolean>;
    submitting: Signal<boolean>;
    validationStatus: Signal<ValidationStatus>;
    touched: Signal<boolean>;
    untouched: Signal<boolean>;
    markAsTouched(options?: {
        skipDescendants?: boolean;
    }): void;
    markAsUntouched(): void;
    dirty: Signal<boolean>;
    pristine: Signal<boolean>;
    markAsDirty(): void;
    markAsPristine(): void;
    disabled: Signal<boolean>;
    disabledReasons: Signal<readonly DisabledReason[]>;
    enabled: Signal<boolean>;
    disable(message?: string): void;
    enable(): void;
    readonly: Signal<boolean>;
    writable: Signal<boolean>;
    markAsReadonly(): void;
    markAsWritable(): void;
    hidden: Signal<boolean>;
    visible: Signal<boolean>;
    hide(): void;
    show(): void;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TParent` | `AnyNode` | `AnyNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `nodeType` | Returns the concrete primitive represented by this node. |
| `form` | Nearest explicit `form()` containing this field, or `null` when no form workflow owns it. A nested explicit form is the workflow owner instead of the complete structural root. |
| `root` | Complete structural root containing this field. A standalone or detached field returns itself. Use this signal when traversal must cross nested form workflow boundaries. |
| `parent` | Immediate structural parent of this field, or `null` when it is a root or has been detached. |
| `path` | Property and array-index segments from the complete root to this field. Root fields use `[]`. |
| `keyInParent` | Property or array index under which this field is stored, or `null` when it is a root field. |
| `value` | Exposed field value. The `equal` option may retain an earlier equivalent value independently of the latest committed write used by controls and reset. |
| `set` | Assigns a committed value immediately without marking the field dirty. |
| `update` | Computes and sets a complete value from the current exposed value without marking the field dirty. |
| `debouncing` | Whether a control-originated value is waiting to be committed by this field's numeric, blur-based, or asynchronous debounce. Programmatic writes do not activate this signal. |
| `flush` | Immediately commits the pending value.control(), ending its configured debounce. Has no observable effect when no control update is pending. |
| `focus` | Focuses the first `[formNode]` control currently bound to this field in DOM order. |
| `patch` | Assigns a committed value like `set()`. Provided for a uniform node API. |
| `reset` | Clears touched and dirty state and cancels pending control input. Passing a value also replaces internally committed value; omitting it preserves that value even when `equal` retains an older exposed value. Controls reset to the internally committed value. |
| `resetToInitial` | Restores the field's captured initial value and resets its interaction state. |
| `validators` | Current normalized validators assigned directly to this field, in declaration order. |
| `setValidators` | Replaces this field's validators and immediately validates the current exposed value. |
| `errors` | A signal containing the validation errors of **this field itself**. |
| `allErrors` | A signal containing the validation errors of **this field and its descendants**. Fields have no descendants, so this contains the same errors as `errors()`. |
| `valid` | Whether this field has completed validation without errors. False while validity is unknown. |
| `invalid` | Whether this field currently has at least one validation error. |
| `getError` | Returns the first validation error of this field matching `kind`. Returns the first custom error belonging directly to this field and matching `kind`. |
| `hasError` | Whether this node's own errors contain the given kind. Does not search descendants. |
| `hasValidator` | Whether the same validator function is directly registered on this node, including async validators. By default, does not run validators. Set resolve to true to inspect resolved leaf references. |
| `min` | Strictest minimum value contributed by active numeric or date validators, or `null` when absent. |
| `max` | Strictest maximum value contributed by active numeric or date validators, or `null` when absent. |
| `minLength` | Strictest minimum length contributed by active length validators, or `null` when absent. |
| `maxLength` | Strictest maximum length contributed by active length validators, or `null` when absent. |
| `pattern` | Every regular expression contributed by the field's active pattern validators. |
| `required` | Whether an active required validator currently marks this field as required. |
| `pending` | Whether this field has one or more active asynchronous validation operations. |
| `submitting` | Whether an ancestor form is currently running its submission action. |
| `validationStatus` | Current validation phase: `'valid'`, `'invalid'`, or `'unknown'`. |
| `touched` | Whether this field has been marked touched. |
| `untouched` | Logical inverse of `touched()`. |
| `markAsTouched` | Marks this field as touched, making `touched()` true and `untouched()` false while it is interactive. |
| `markAsUntouched` | Clears stored touched state, making `touched()` false and `untouched()` true. |
| `dirty` | Whether this field currently reports user-modified state. |
| `pristine` | Logical inverse of `dirty()`. |
| `markAsDirty` | Marks this field as dirty, making `dirty()` true and `pristine()` false while it is interactive. |
| `markAsPristine` | Clears stored dirty state, making `dirty()` false and `pristine()` true. |
| `disabled` | Whether this field is effectively disabled by its own state or an ancestor reason. |
| `disabledReasons` | Active inherited and local causes of this field's disabled state. |
| `enabled` | Logical inverse of `disabled()`. |
| `disable` | Disables this field, optionally recording a user-facing reason. Sets `disabled()` to true and `enabled()` to false. |
| `enable` | Clears the imperative disabled state created by `disable()`. This makes `enabled()` true and `disabled()` false only when no configured or inherited disabled reason remains active. |
| `readonly` | Whether this field is effectively readonly through its own state or an ancestor. |
| `writable` | Logical inverse of `readonly()`. |
| `markAsReadonly` | Marks this field readonly, making `readonly()` true and `writable()` false. |
| `markAsWritable` | Clears the imperative readonly state. This makes `writable()` true and `readonly()` false only when no configured or inherited readonly state remains active. |
| `hidden` | Whether this field is effectively hidden through its own state or an ancestor. |
| `visible` | Logical inverse of `hidden()`. |
| `hide` | Hides this field, making `hidden()` true and `visible()` false without changing its value. |
| `show` | Clears the imperative hidden state. This makes `visible()` true and `hidden()` false only when no configured or inherited hidden state remains active. |

## Related reference

- [Node API and collision-safe access](../node-api.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [CustomValidationError](./custom-validation-error.md)
- [DisabledReason](./disabled-reason.md)
- [FieldNode](./field-node.md)
- [NodeErrorsSignal](./node-errors-signal.md)
- [NodeValueSignal](./node-value-signal.md)
- [ValidationErrorMap](./validation-error-map.md)
- [ValidationErrorWithTargetNode](./validation-error-with-target-node.md)
- [ValidationStatus](./validation-status.md)
- [Validators](./validators.md)
- [ValidatorSource](./validator-source.md)
