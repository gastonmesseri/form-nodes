---
title: FormApi
---

# FormApi

State and operations for a form, including typed children and submission.

## Import

```ts
import type { FormApi } from '@ngblocks/form-nodes';
```

## When to use it

Use for form API operations such as submission without exposing direct child-name collisions. The form's callable `$api` is described by `CallableNodeApi<FormApi<...>>`.

## Declaration

```ts
type FormApi<TNodes extends Nodes, TParent extends AnyNode = AnyNode> = {
    nodeType(): 'form';
    readonly children: FormChildren<TNodes, TParent> & Readonly<Record<string, DynamicNode>>;
    forEachChild(callback: (child: keyof TNodes extends never ? DynamicNode : FormChildren<TNodes, TParent>[keyof TNodes], key: string) => void, options?: {
        includeDynamic?: false;
    }): void;
    forEachChild(callback: (child: DynamicNode, key: string) => void, options: {
        includeDynamic?: boolean;
    }): void;
    get(key: string): DynamicNode | undefined;
    add<TKey extends string, TDefinition>(key: TKey extends keyof TNodes | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): AddedNode<TDefinition, FormNode<TNodes, TParent>>;
    add<TDefinitions extends ObjectNodeDefinitions>(definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions> & Partial<Record<keyof TNodes | '$api', never>>): {
        readonly [TKey in keyof TDefinitions]: AddedNode<TDefinitions[TKey], FormNode<TNodes, TParent>>;
    };
    remove(key: string): DynamicNode | undefined;
    form: Signal<FormNode<TNodes, TParent>>;
    root: Signal<FormRoot<TNodes, TParent>>;
    parent: Signal<TParent | null>;
    path: Signal<readonly string[]>;
    keyInParent: Signal<NodeKeyInParent<TParent>>;
    value: NodeValueSignal<{
        [K in keyof TNodes]: NodeValue<TNodes[K]>;
    }, FormSet<TNodes>>;
    set(value: FormSet<TNodes>): void;
    update(updater: (value: FormValue<TNodes>) => FormSet<TNodes>): void;
    patch(value: FormPatch<TNodes>): void;
    reset(...args: [
    ] | [
        value: FormSet<TNodes>
    ]): void;
    resetToInitial(): void;
    validators: Signal<Validators<FormValue<TNodes>>> & {
        (options: {
            resolve?: boolean;
        }): Validators<FormValue<TNodes>>;
    };
    setValidators(validators: ValidatorSource<FormValue<TNodes>, FormNode<TNodes, TParent>>): void;
    errors: NodeErrorsSignal<FormNode<TNodes, TParent>>;
    allErrors: Signal<readonly ValidationErrorWithTargetNode<AnyNode>[]>;
    valid: Signal<boolean>;
    invalid: Signal<boolean>;
    getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<FormNode<TNodes, TParent>> & ValidationErrorMap[TKind]) | undefined;
    getError<TKind extends string>(kind: TKind): (ValidationErrorWithTargetNode<FormNode<TNodes, TParent>> & CustomValidationError<TKind>) | undefined;
    hasError(kind: string): boolean;
    hasValidator(validator: (context: any) => unknown, options?: {
        resolve?: boolean;
    }): boolean;
    required: Signal<boolean>;
    pending: Signal<boolean>;
    submitted: Signal<boolean>;
    submitting: Signal<boolean>;
    submit(): Promise<boolean>;
    debouncing: Signal<boolean>;
    flush(): void;
    focus(options?: FocusOptions): void;
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
| `TNodes` | `Nodes` | Required |
| `TParent` | `AnyNode` | `AnyNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `nodeType` | Returns the concrete primitive represented by this node. |
| `children` | Readonly runtime child map. Declared properties retain exact node types; arbitrary keys use DynamicNode. |
| `forEachChild` | **Dynamically added nodes are excluded by default.** Pass `{ includeDynamic: true }` to visit them. |
| `get` | Returns a child by runtime key, or `undefined` when no current child has that key. |
| `add` | Adds one child node at runtime and returns that live node with its exact inferred type. |
| `remove` | Detaches and returns a dynamically added child, or `undefined` when the key is absent. Initially declared children are fixed and cannot be removed. |
| `form` | This explicit form workflow. Descendants resolve this form until another nested form begins. Unlike `root()`, this signal deliberately does not cross the form's workflow boundary. |
| `root` | Complete structural root containing this form. A root or detached form returns itself. A nested form therefore returns itself from `form()` and its outermost ancestor from `root()`. |
| `parent` | Immediate structural parent of this form, or `null` when it is a root or has been detached. |
| `path` | Property and array-index segments from the complete root to this form. Root forms use `[]`. |
| `keyInParent` | Property or array index under which this form is stored, or `null` when it is a root form. |
| `value` | Exposed aggregate of public child values. The `equal` option may retain a previous snapshot. |
| `set` | Assigns a complete form value immediately without marking the form or its descendants dirty. |
| `update` | Computes and sets the complete form value from its current value without marking nodes dirty. |
| `patch` | Assigns the supplied subset of child values immediately and ignores unknown runtime keys. |
| `reset` | Recursively clears touched and dirty state and cancels pending control input. Passing a complete value also assigns it; omitting the value preserves all current committed values. |
| `resetToInitial` | Restores the initial values of the current form/group subtree and resets interaction state. |
| `validators` | Current normalized validators assigned directly to this form, in declaration order. |
| `setValidators` | Replaces validators owned by this form and immediately validates its current aggregate value. |
| `errors` | A signal containing the validation errors of **this form node itself, excluding its descendants**. |
| `allErrors` | A signal containing the validation errors of **this form node and its descendants**. |
| `valid` | Whether this form and every descendant have completed validation without errors. |
| `invalid` | Whether this form or any descendant currently contributes a validation error. |
| `getError` | Returns the first validation error belonging directly to this form and matching `kind`. Returns the first custom error belonging directly to this form and matching `kind`. |
| `hasError` | Whether this node's own errors contain the given kind. Does not search descendants. |
| `hasValidator` | Whether the same validator function is directly registered on this node, including async validators. By default, does not run validators. Set resolve to true to inspect resolved leaf references. |
| `required` | Whether active validation metadata marks this form itself as required. |
| `pending` | Whether asynchronous validation is active on this form or any descendant. |
| `submitted` | Whether `submit()` has been called on this form since its last reset. |
| `submitting` | Whether this form or an ancestor form is currently running its submission action. |
| `submit` | Marks and flushes the subtree, then runs the configured submission action when validation allows it. Resolves to `false` without throwing when no action is configured. |
| `debouncing` | Whether any descendant field currently has a pending control-value debounce. |
| `flush` | Immediately commits every pending control value in this form's subtree. |
| `focus` | Focuses the first bound UI control in this form's subtree, in DOM order. |
| `validationStatus` | Aggregated validation phase for this form subtree: `'valid'`, `'invalid'`, or `'unknown'`. |
| `touched` | Whether this form or any descendant has been marked touched. |
| `untouched` | Logical inverse of `touched()`. |
| `markAsTouched` | Marks this form and, by default, every descendant as touched, making their effective `touched()` true and `untouched()` false while they are interactive. |
| `markAsUntouched` | Recursively clears touched state, making `touched()` false and `untouched()` true throughout the subtree. |
| `dirty` | Whether this form currently reports user-modified state. |
| `pristine` | Logical inverse of `dirty()`. |
| `markAsDirty` | Marks this form's own state dirty, making `dirty()` true and `pristine()` false while it is interactive. |
| `markAsPristine` | Clears this form's own dirty state. `pristine()` becomes true and `dirty()` false only when no contributing descendant remains dirty. |
| `disabled` | Whether this form is effectively disabled by its own state or an ancestor reason. |
| `disabledReasons` | Active inherited and local causes of this form's disabled state. |
| `enabled` | Logical inverse of `disabled()`. |
| `disable` | Disables this form subtree, optionally recording a user-facing reason. Sets `disabled()` to true and `enabled()` to false on this form and its descendants. |
| `enable` | Clears the imperative disabled state created by `disable()`. `enabled()` becomes true only on nodes without another configured or inherited disabled reason. |
| `readonly` | Whether this form is effectively readonly through its own state or an ancestor. |
| `writable` | Logical inverse of `readonly()`. |
| `markAsReadonly` | Marks this form subtree readonly, making `readonly()` true and `writable()` false throughout it. |
| `markAsWritable` | Clears this form's imperative readonly state. `writable()` becomes true only on nodes without another configured or inherited readonly state. |
| `hidden` | Whether this form is effectively hidden through its own state or an ancestor. |
| `visible` | Logical inverse of `hidden()`. |
| `hide` | Hides this form subtree, making `hidden()` true and `visible()` false throughout it. |
| `show` | Clears this form's imperative hidden state. `visible()` becomes true only on nodes without another configured or inherited hidden state. |

## Related reference

- [Node API and collision-safe access](../node-api.md)
- [Public types index](./index.md)
- [AddedNode](./added-node.md)
- [AnyNode](./any-node.md)
- [CustomValidationError](./custom-validation-error.md)
- [DisabledReason](./disabled-reason.md)
- [DynamicNode](./dynamic-node.md)
- [FormNode](./form-node.md)
- [FormPatch](./form-patch.md)
- [FormSet](./form-set.md)
- [FormValue](./form-value.md)
- [NodeErrorsSignal](./node-errors-signal.md)
- [NodeValueSignal](./node-value-signal.md)
- [ValidationErrorMap](./validation-error-map.md)
- [ValidationErrorWithTargetNode](./validation-error-with-target-node.md)
- [ValidationStatus](./validation-status.md)
- [Validators](./validators.md)
- [ValidatorSource](./validator-source.md)
