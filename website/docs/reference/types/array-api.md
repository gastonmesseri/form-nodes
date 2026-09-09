---
title: ArrayApi
---

# ArrayApi

State and operations for an array node, including item access and reconciliation.

## Import

```ts
import type { ArrayApi } from '@ngblocks/form-nodes';
```

## When to use it

Use for item-management helpers that need array operations. The callable `$api` also preserves the array's `length` signal.

## Declaration

```ts
type ArrayApi<TItem extends AnyNode, TParent extends AnyNode = AnyNode> = {
    nodeType(): 'array';
    items: Signal<ArrayItems<TItem, TParent>>;
    length: Signal<number>;
    form: Signal<NearestForm<TParent> | null>;
    root: Signal<ArrayRoot<TItem, TParent>>;
    parent: Signal<TParent | null>;
    path: Signal<readonly string[]>;
    keyInParent: Signal<NodeKeyInParent<TParent>>;
    value: NodeValueSignal<ArrayValue<TItem>, ArraySet<TItem> | null | undefined>;
    at(index: number): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
    forEach(callback: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => void): void;
    map<TResult>(callback: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => TResult): TResult[];
    filter<TFiltered extends ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => item is TFiltered): TFiltered[];
    filter(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>[];
    find<TFound extends ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => item is TFound): TFound | undefined;
    find(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
    findIndex(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): number;
    some(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): boolean;
    every(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): boolean;
    includes(item: AnyNode, fromIndex?: number): boolean;
    indexOf(item: AnyNode, fromIndex?: number): number;
    [Symbol.iterator](): IterableIterator<ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>;
    push(...args: [
    ] | [
        value: NodeSet<TItem>
    ]): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>;
    insert(index: number, ...args: [
    ] | [
        value: NodeSet<TItem>
    ]): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>;
    removeAt(index: number): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
    moveUp(index: number): void;
    moveDown(index: number): void;
    move(fromIndex: number, toIndex: number): void;
    swap(firstIndex: number, secondIndex: number): void;
    clear(): void;
    set(value: ArraySet<TItem> | null | undefined): void;
    update(updater: (value: ArrayValue<TItem>) => ArraySet<TItem> | null | undefined): void;
    patch(value: ArrayPatch<TItem>): void;
    reset(...args: [
    ] | [
        value: ArraySet<TItem> | null | undefined
    ]): void;
    resetToInitial(): void;
    validators: Signal<Validators<ArrayValue<TItem>>> & {
        (options: {
            resolve?: boolean;
        }): Validators<ArrayValue<TItem>>;
    };
    setValidators(validators: ValidatorSource<ArrayValue<TItem>, ArrayNode<TItem, TParent>>): void;
    errors: Signal<readonly ValidationErrorWithTargetNode<ArrayNode<TItem, TParent>>[]>;
    allErrors: Signal<readonly ValidationErrorWithTargetNode<AnyNode>[]>;
    valid: Signal<boolean>;
    invalid: Signal<boolean>;
    getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<ArrayNode<TItem, TParent>> & ValidationErrorMap[TKind]) | undefined;
    getError<TKind extends string>(kind: TKind): (ValidationErrorWithTargetNode<ArrayNode<TItem, TParent>> & CustomValidationError<TKind>) | undefined;
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
| `TItem` | `AnyNode` | Required |
| `TParent` | `AnyNode` | `AnyNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `nodeType` | Returns the concrete primitive represented by this node. |
| `items` | Readonly signal containing the array node's current item nodes. Reading it participates in reactive tracking, and its array reference changes when the structure changes. The contained nodes are the live nodes owned by this array, not clones. Use spread syntax or Array.from() when a mutable copy of the node list is needed. |
| `length` | Current number of live item nodes. Equivalent to `items().length`. |
| `form` | Nearest explicit `form()` containing this array, or `null` when no form workflow owns it. A nested explicit form is the workflow owner instead of the complete structural root. |
| `root` | Complete structural root containing this array. A root or detached array returns itself. Use this signal when traversal must cross nested form workflow boundaries. |
| `parent` | Immediate structural parent of this array, or `null` when it is a root or has been detached. |
| `path` | Property and array-index segments from the complete root to this array. Root arrays use `[]`. |
| `keyInParent` | Property or array index under which this array is stored, or `null` when it is a root array. |
| `value` | Exposed aggregate of item values. The `equal` option can retain an earlier equivalent array independently of current item values and structure. |
| `at` | Returns the live item node at `index`, or `undefined` when no item exists there. |
| `forEach` | Invokes `callback` once for each current item node, in index order. |
| `map` | Transforms each current item node and returns the collected results without changing the array. |
| `filter` | Returns the current item nodes accepted by a type-guard predicate. Returns the current item nodes for which `predicate` produces a truthy result. |
| `find` | Returns the first current item node accepted by a type-guard predicate, or `undefined`. Returns the first current item node for which `predicate` is truthy, or `undefined`. |
| `findIndex` | Returns the index of the first item node matching `predicate`, or `-1` when none matches. |
| `some` | Whether at least one current item node matches `predicate`. |
| `every` | Whether every current item node matches `predicate`. Returns `true` for an empty array. |
| `includes` | Whether the exact item-node instance occurs at or after `fromIndex`. |
| `indexOf` | Returns the index of the exact item-node instance, or `-1` when it is absent. |
| `[Symbol.iterator]` | Iterates over a stable snapshot of the current item nodes in index order. |
| `push` | Creates and appends an item node, optionally initializing it with `value`, and returns the new live node. The new item starts pristine and untouched. |
| `insert` | Creates an item node at `index`, optionally initializes it with `value`, shifts later items, and returns the new live node. Throws `RangeError` when `index` is outside `0..length`. |
| `removeAt` | Removes, detaches, and returns the item at `index`, or returns `undefined` for an invalid index. A retained removed node remains independently usable. |
| `moveUp` | Moves the item one position toward the start. The first item remains in place. |
| `moveDown` | Moves the item one position toward the end. The last item remains in place. |
| `move` | Moves an item from `fromIndex` to `toIndex`, shifting the intervening items by one position. |
| `swap` | Exchanges two item positions without recreating either node. |
| `clear` | Removes and detaches every current item node without marking the array dirty. |
| `set` | Reconciles the complete array value while preserving matching item nodes. |
| `update` | Computes the complete array value using the configured index or `trackBy` reconciliation. |
| `patch` | Partially updates existing item nodes by array index without changing the array structure. |
| `reset` | Resets state, optionally reconciling a complete value first. |
| `resetToInitial` | Restores captured initial item values, count and order, and resets subtree interaction state. |
| `validators` | Current normalized validators assigned directly to this array, in declaration order. |
| `setValidators` | Replaces validators owned by this array and immediately validates its current aggregate value. |
| `errors` | A signal containing the validation errors of **this array node itself, excluding its descendants**. |
| `allErrors` | A signal containing the validation errors of **this array node and its descendants**. |
| `valid` | Whether this array and every current item subtree have completed validation without errors. |
| `invalid` | Whether this array or any current item subtree contributes a validation error. |
| `getError` | Returns the first validation error belonging directly to this array and matching `kind`. Returns the first custom error belonging directly to this array and matching `kind`. |
| `hasError` | Whether this node's own errors contain the given kind. Does not search descendants. |
| `hasValidator` | Whether the same validator function is directly registered on this node, including async validators. By default, does not run validators. Set resolve to true to inspect resolved leaf references. |
| `required` | Whether active validation metadata marks this array itself as required. |
| `pending` | Whether asynchronous validation is active on this array or any current item subtree. |
| `submitting` | Whether an ancestor form is currently running its submission action. Arrays cannot initiate submission. |
| `debouncing` | Whether this array or any current item subtree has a control-originated value awaiting commit. |
| `flush` | Immediately commits every pending control value in this array's current item subtrees. |
| `focus` | Focuses the first bound UI control in this array's current item subtrees, in DOM order. |
| `validationStatus` | Aggregated validation phase for this array and its item subtrees: `'valid'`, `'invalid'`, or `'unknown'`. |
| `touched` | Whether this array or any current item subtree has been marked touched. |
| `untouched` | Logical inverse of `touched()`. |
| `markAsTouched` | Marks this array and, by default, every item subtree as touched, making their effective `touched()` true and `untouched()` false while they are interactive. |
| `markAsUntouched` | Recursively clears touched state, making `touched()` false and `untouched()` true throughout the subtree. |
| `dirty` | Whether this array currently reports user-modified state. |
| `pristine` | Logical inverse of `dirty()`. |
| `markAsDirty` | Marks this array's own state dirty, making `dirty()` true and `pristine()` false while it is interactive. |
| `markAsPristine` | Clears this array's own dirty state. `pristine()` becomes true and `dirty()` false only when no contributing item remains dirty. |
| `disabled` | Whether this array is effectively disabled by its own state or an ancestor reason. |
| `disabledReasons` | Active inherited and local causes of this array's disabled state. |
| `enabled` | Logical inverse of `disabled()`. |
| `disable` | Disables this array subtree, optionally recording a user-facing reason. Sets `disabled()` to true and `enabled()` to false on this array and its item subtrees. |
| `enable` | Clears the imperative disabled state created by `disable()`. `enabled()` becomes true only on nodes without another configured or inherited disabled reason. |
| `readonly` | Whether this array is effectively readonly through its own state or an ancestor. |
| `writable` | Logical inverse of `readonly()`. |
| `markAsReadonly` | Marks this array subtree readonly, making `readonly()` true and `writable()` false throughout it. |
| `markAsWritable` | Clears this array's imperative readonly state. `writable()` becomes true only on nodes without another configured or inherited readonly state. |
| `hidden` | Whether this array is effectively hidden through its own state or an ancestor. |
| `visible` | Logical inverse of `hidden()`. |
| `hide` | Hides this array subtree, making `hidden()` true and `visible()` false throughout it. |
| `show` | Clears this array's imperative hidden state. `visible()` becomes true only on nodes without another configured or inherited hidden state. |

## Related reference

- [Node API and collision-safe access](../node-api.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ArrayItems](./array-items.md)
- [ArrayItemWithParent](./array-item-with-parent.md)
- [ArrayNode](./array-node.md)
- [ArrayPatch](./array-patch.md)
- [ArraySet](./array-set.md)
- [ArrayValue](./array-value.md)
- [CustomValidationError](./custom-validation-error.md)
- [DisabledReason](./disabled-reason.md)
- [NodeValueSignal](./node-value-signal.md)
- [ValidationErrorMap](./validation-error-map.md)
- [ValidationErrorWithTargetNode](./validation-error-with-target-node.md)
- [ValidationStatus](./validation-status.md)
- [Validators](./validators.md)
- [ValidatorSource](./validator-source.md)
