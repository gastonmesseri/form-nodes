---
title: FormNodeBinding
---

# FormNodeBinding

Public view of a concrete `[formNode]` binding.

## Import

```ts
import type { FormNodeBinding } from '@ngblocks/form-nodes';
```

## When to use it

Use for an injected binding, directive query, or integration callback. It describes the rendered binding, including outputs and host access; it is not a form node.

## Declaration

```ts
type FormNodeBinding<TNode extends AnyNode = AnyNode> = {
    readonly formNodeValueChange: OutputRef<NodeValue<TNode>>;
    readonly formNodeControlValueChange: OutputRef<NodeValue<TNode>>;
    readonly formNodeSubmit: OutputRef<FormNodeSubmitEvent<TNode>>;
    readonly formNodeSubmitBlocked: OutputRef<FormNodeSubmitEvent<TNode>>;
    readonly element: HTMLElement;
    readonly injector: Injector;
    readonly node: Signal<TNode>;
    readonly errors: Signal<readonly ValidationErrorWithTargetNode<TNode>[]>;
    focus(options?: FocusOptions): void;
    flush(): void;
    reset(): void;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNode` | `AnyNode` | `AnyNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `formNodeValueChange` | Control-originated value after it is committed, respecting debounce and flush. Programmatic node writes do not emit. Synchronous state is current in the handler; asynchronous validation may still be pending. |
| `formNodeControlValueChange` | Latest parsed value received from the selected control adapter, before waiting for debounce. This does not guarantee a physical user interaction: custom controls can emit from code. |
| `formNodeSubmit` | Native submission attempt on a form() binding, after preparing values and interaction state, before the validation gate and declared action. Emits even without onSubmit or when blocked. Programmatic submit() does not emit. Async listeners are not awaited. |
| `formNodeSubmitBlocked` | Native attempt rejected by submitWhen, including pending validation with 'valid'. Emits after formNodeSubmit, even without a declared onSubmit action. Concurrent attempts, group bindings, and programmatic submit() do not emit this output. |
| `element` | Host element carrying the `[formNode]` directive. |
| `injector` | Injector belonging to the binding's host element. |
| `node` | Reactive reference to the node currently bound to the host. |
| `errors` | Errors visible to this binding, excluding errors owned by another binding. |
| `focus` | Focuses this binding using its native or custom-control focus behavior. |
| `flush` | Commits pending control-originated values for the bound node. |
| `reset` | Resets interaction state and control-specific parsing state. |

## Related reference

- [Custom control contracts](../custom-control-contracts.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FormNodeSubmitEvent](./form-node-submit-event.md)
- [ValidationErrorWithTargetNode](./validation-error-with-target-node.md)
