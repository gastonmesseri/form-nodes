---
title: NodeApi
---

# NodeApi

The common API surface shared by all node kinds.

## Import

```ts
import type { NodeApi } from '@ngblocks/form-nodes';
```

## When to use it

Use when a helper needs only shared state and operations. This is the API object contract; use [`AnyNode`](./any-node.md) for the node itself and access its `$api`.

## Declaration

```ts
type NodeApi = {
    nodeType(): NodeType;
    form: Signal<AnyNode | null>;
    root: Signal<AnyNode>;
    parent: Signal<AnyNode | null>;
    path: Signal<readonly string[]>;
    value: NodeValueSignal<any>;
    keyInParent: Signal<string | number | null>;
    set(value: any): void;
    update(updater: (value: any) => any): void;
    patch(value: any): void;
    reset(...args: [
    ] | [
        value: any
    ]): void;
    resetToInitial(): void;
    validationStatus: Signal<'valid' | 'invalid' | 'unknown'>;
    valid: Signal<boolean>;
    invalid: Signal<boolean>;
    errors: NodeErrorsSignal<AnyNode>;
    allErrors: Signal<readonly ValidationErrorWithTargetNode<AnyNode>[]>;
    getError<TKind extends string>(kind: TKind): (ValidationErrorWithTargetNode<AnyNode> & {
        readonly kind: TKind;
    }) | undefined;
    hasError(kind: string): boolean;
    hasValidator(validator: (context: any) => unknown, options?: {
        resolve?: boolean;
    }): boolean;
    required: Signal<boolean>;
    pending: Signal<boolean>;
    submitting: Signal<boolean>;
    debouncing: Signal<boolean>;
    flush(): void;
    focus(options?: FocusOptions): void;
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

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `nodeType` | Returns the concrete primitive represented by this node. |
| `form` | Nearest explicit `form()` containing this node, or `null` when no form workflow owns it. |
| `root` | Complete root node containing this node. A root node returns itself. |
| `parent` | Immediate structural parent of this node, or `null` when it is a root or has been detached. |
| `path` | Property and array-index segments from the complete root to this node. Root nodes use `[]`. Array indexes are represented as strings. |
| `value` | Current committed value represented by this node. Reading it participates in signal tracking. |
| `keyInParent` | Property or array index under which this node is stored, or `null` when it is a root node. |
| `set` | Assigns a complete committed value immediately without marking the node dirty. |
| `update` | Computes and assigns a complete committed value without marking the node dirty. |
| `patch` | Applies a node-specific partial update without marking the node dirty. |
| `reset` | Clears interaction state and pending control input throughout the reset scope, optionally assigning a new complete value first. |
| `resetToInitial` | Restores captured initial values, cancels buffered input, and clears subtree dirty/touched state. Object nodes keep their current schema; arrays restore their initial values, count, and order. Programmatic writes do not redefine the baseline. Current validators and availability remain. Supported data containers are copied; opaque instances and accessor state retain references. This does not emit control-originated value outputs. See concrete node APIs for full details. |
| `validationStatus` | Aggregated validation phase for this node and its subtree. |
| `valid` | Whether this node and its descendants have completed validation without errors. |
| `invalid` | Whether this node or any descendant currently contributes a validation error. |
| `errors` | Validation errors belonging directly to this node by default. Pass `{ descendants: true }` to include descendants, exactly as `allErrors()`. |
| `allErrors` | Validation errors from this node and its complete subtree in structural order. |
| `getError` | Returns the first error belonging directly to this node and matching `kind`. |
| `hasError` | Whether this node's own errors include the kind; does not search descendants. |
| `hasValidator` | Whether this exact validator is directly registered, or resolved when resolve is true. |
| `required` | Whether active validation metadata currently marks this node as required. |
| `pending` | Whether asynchronous validation is active on this node or any descendant. |
| `submitting` | Whether this node is a form running its submission action, or has an ancestor form that is currently running one. |
| `debouncing` | Whether a control-originated value is awaiting commit on this node or any descendant. |
| `flush` | Immediately commits pending control-originated values on this node and its flush scope. |
| `focus` | Focuses the first control bound to this node or its descendants, when one exists. |
| `touched` | Whether this node or any descendant has been marked touched. |
| `untouched` | Logical inverse of `touched()`. |
| `markAsTouched` | Marks this node and, by default, its descendants as touched, making effective `touched()` true and `untouched()` false while those nodes are interactive. |
| `markAsUntouched` | Clears touched state, making `touched()` false and `untouched()` true throughout the affected scope. |
| `dirty` | Whether this node currently reports user-modified state. |
| `pristine` | Logical inverse of `dirty()`. |
| `markAsDirty` | Marks this node's own state dirty, making `dirty()` true and `pristine()` false while it is interactive. |
| `markAsPristine` | Clears this node's own dirty state. `pristine()` becomes true and `dirty()` false only when no contributing descendant remains dirty. |
| `disabled` | Whether this node is effectively disabled by a local or inherited reason. |
| `disabledReasons` | Parent reasons followed by the active reasons originating on this node. |
| `enabled` | Logical inverse of `disabled()`. |
| `disable` | Disables this node, optionally recording a user-facing reason. Sets `disabled()` to true and `enabled()` to false on this node and its effective subtree. |
| `enable` | Clears the imperative disabled state created by `disable()`. `enabled()` becomes true only where no configured or inherited disabled reason remains active. |
| `readonly` | Whether this node is effectively readonly through local configuration or an ancestor. |
| `writable` | Logical inverse of `readonly()`. |
| `markAsReadonly` | Marks this node and its subtree readonly, making `readonly()` true and `writable()` false. |
| `markAsWritable` | Clears this node's imperative readonly state. `writable()` becomes true only where no configured or inherited readonly state remains active. |
| `hidden` | Whether this node is effectively hidden through local configuration or an ancestor. |
| `visible` | Logical inverse of `hidden()`. |
| `hide` | Hides this node and its subtree, making `hidden()` true and `visible()` false. |
| `show` | Clears this node's imperative hidden state. `visible()` becomes true only where no configured or inherited hidden state remains active. |

## Related reference

- [Node API and collision-safe access](../node-api.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [DisabledReason](./disabled-reason.md)
- [NodeErrorsSignal](./node-errors-signal.md)
- [NodeValueSignal](./node-value-signal.md)
- [ValidationErrorWithTargetNode](./validation-error-with-target-node.md)
