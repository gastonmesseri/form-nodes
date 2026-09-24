---
title: ArrayOptions
---

# ArrayOptions

Template, initial-data, validation, and ownership configuration for array().

## Import

```ts
import type { ArrayOptions } from '@ngblocks/form-nodes';
```

## When to use it

Use for array initialization and reconciliation options. Keep initial records and options such as `trackBy` together in the array declaration. The `configure` callback receives this instance’s typed, collision-safe API synchronously once. See [configuration lifecycle and sibling rules](../../guides/configuring-nodes.md).

## Declaration

```ts
type ArrayOptions<TValue = any, TArray extends AnyNode = ArrayNode<AnyNode>> = Omit<FormOptions<TValue>, 'configure' | 'onValueChange' | 'onSubmit' | 'onSubmitBlocked' | 'submitWhen' | 'validators' | 'debounce' | 'hidden' | 'disabled' | 'readonly'> & {
    onValueChange?(value: TValue, node: TArray, context: NodeCallbackContext): void;
    configure?: (api: TArray['$api']) => void;
    configureEach?: (api: TArray extends {
        readonly [index: number]: AnyNode | undefined;
    } ? NonNullable<TArray[number]>['$api'] : never) => void;
    validators?: ValidatorSource<TValue, TArray>;
    debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);
    hidden?: boolean | ((context: NodeCallbackContext) => any);
    disabled?: boolean | string | ((context: NodeCallbackContext) => any);
    readonly?: boolean | ((context: NodeCallbackContext) => any);
    initialValue?: TValue | number | null;
    initialLength?: number;
    trackBy?: TValue extends readonly (infer TItemValue)[] ? ((value: TItemValue, index: number) => unknown) | (TItemValue extends object ? Extract<keyof TItemValue, string> : never) : never;
} & ({
    initialValue?: never;
} | {
    initialLength?: never;
});
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | `any` |
| `TArray` | `AnyNode` | `ArrayNode<AnyNode>` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `onValueChange` | Runs synchronously after the exposed value changes, including programmatic writes. The third argument provides the node's current nearest containing array index. Initialization and writes retained by `equal` do not notify. Control writes wait for debounce. Callbacks run untracked, without requiring an injector or waiting for async validation. Aggregate writes notify descendants before their parent, once after child updates. Reentrant writes are delivered after the current callback; returned values are ignored. |
| `configure` | Configures each new instance once, synchronously after its API and children are ready. Receives the collision-safe callable `$api`. Runs untracked; validators installed here track dependencies when they execute. Ancestors may not be attached yet. Use the callback argument rather than the variable being initialized. Fresh template clones run their own callback; reset, reordering, and edits do not rerun it. Returned values are ignored; this is neither an async hook nor a cleanup registration. |
| `configureEach` | Configures each newly created item once with its typed, collision-safe callable `$api`. Runs after the item's own configure callback and supplied initial value, before attachment to this array and capture of its reset-to-initial baseline. Children are ready; ancestors may not be attached. Works with templates and factories, without requiring an injector. Runs synchronously and untracked, with value-change notifications suppressed. Returned values are ignored; promises are not awaited and returned functions are not cleanup hooks. Edits, moves, and resets of reused items do not rerun it; newly created items do. The original template and templateValue() drafts do not run this callback. |
| `validators` | Registers rules on this node's exposed value. Aggregate rules receive the complete object or array; put per-field rules on children. A synchronous composition may return validators; asynchronous rules must be wrapped with `asyncValidator()`. Null and undefined entries are ignored. Contexts are typed; inline returns intentionally allow self-reference inference. Use `validator()` or an explicit result annotation when returned errors also need strict checking. |
| `debounce` | Delays control-originated value commits. Descendants inherit this strategy unless they supply their own. Programmatic writes commit immediately. A later edit aborts the previous delay; `flush()` or an interactive `markAsTouched()` commits pending input. |
| `hidden` | Controls this node's local hidden state. Descendants inherit active hidden state; programmatic writes remain available. Hidden nodes suppress their own validation and reported interaction state. Hiding does not delete values or stored dirty/touched state. |
| `disabled` | Controls this node's local disabled state, inherited by descendants. A static string disables and supplies a reason even when empty; callback strings follow truthiness. Disabled nodes retain their values and accept programmatic writes; their own validation and reported interaction state are suppressed. Ancestor reasons cannot be cleared locally. |
| `readonly` | Controls this node's local readonly state. Descendants inherit active readonly state. It prevents control-originated edits, not programmatic writes. Readonly nodes suppress their own validation and reported dirty/touched state without discarding stored interaction. |
| `initialValue` | Initializes collection items from complete values or the template defaults. Null and undefined normalize to an empty array; the collection value is never nullable. Cannot be combined with initialLength or a positional initial value. Numeric values remain supported for compatibility; prefer initialLength for a count. |
| `initialLength` | Creates this many independent items from the template or factory defaults. Runs configureEach for every new item. Only controls initialization, not a minimum or fixed length; structural edits remain available and resetToInitial restores the baseline. Cannot be combined with initialValue or a positional initial value/count. |
| `trackBy` | Selects stable item identity during `set()`, `patch()`, `update()`, and value-reset reconciliation. Matching keys retain and move existing nodes; new keys create nodes and removed keys detach them. Retained nodes keep their identity and interaction state while their values and paths update. Every current and incoming key must be unique; duplicate keys throw before mutation. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ArrayNode](./array-node.md)
- [FormOptions](./form-options.md)
- [NodeCallbackContext](./node-callback-context.md)
- [ValidatorSource](./validator-source.md)
