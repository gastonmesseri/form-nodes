---
title: FormOptions
---

# FormOptions

Value, validation, interaction, ownership, and submission configuration for form().

## Import

```ts
import type { FormOptions } from '@ngblocks/form-nodes';
```

## When to use it

Use when sharing form configuration, including `submitWhen`, `onSubmit`, and `onSubmitBlocked`. Let the form declaration infer its concrete value and node callback types when possible. The `configure` callback receives this instance’s typed, collision-safe API synchronously once. See [configuration lifecycle and sibling rules](../../guides/configuring-nodes.md).

## Declaration

```ts
type FormOptions<TValue = any, TForm extends AnyNode = FormNode<any>> = {
    onValueChange?(value: TValue, node: TForm, context: NodeCallbackContext): void;
    configure?: (api: TForm['$api']) => void;
    syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | {
        inputs: 'declared' | 'all' | readonly SyncInputName[];
        target?: 'all' | 'signal-controls' | 'cva' | undefined;
    } | null | undefined;
    bindInputOutputPairs?: boolean | null | undefined;
    equal?: 'shallow' | 'deep' | ((previous: TValue, next: TValue) => boolean);
    validators?: ValidatorSource<TValue, TForm>;
    injector?: Injector;
    inheritInjector?: boolean;
    adoptBindingInjector?: boolean;
    validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined);
    debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);
    hidden?: boolean | ((context: NodeCallbackContext) => any);
    disabled?: boolean | string | ((context: NodeCallbackContext) => any);
    readonly?: boolean | ((context: NodeCallbackContext) => any);
    onSubmit?(value: TValue, form: TForm, context: NodeCallbackContext): void | null | ValidationErrorWithOptionalTargetNode<AnyNode> | readonly ValidationErrorWithOptionalTargetNode<AnyNode>[] | PromiseLike<void | null | ValidationErrorWithOptionalTargetNode<AnyNode> | readonly ValidationErrorWithOptionalTargetNode<AnyNode>[]>;
    onSubmitBlocked?(form: TForm, context: NodeCallbackContext): void;
    submitWhen?: 'valid' | 'not-invalid' | 'always';
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | `any` |
| `TForm` | `AnyNode` | `FormNode<any>` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `onValueChange` | Runs synchronously after the exposed value changes, including programmatic writes. The third argument provides the node's current nearest containing array index. Initialization and writes retained by `equal` do not notify. Control writes wait for debounce. Callbacks run untracked, without requiring an injector or waiting for async validation. Aggregate writes notify descendants before their parent, once after child updates. Reentrant writes are delivered after the current callback; returned values are ignored. |
| `configure` | Configures each new instance once, synchronously after its API and children are ready. Receives the collision-safe callable `$api`. Runs untracked; validators installed here track dependencies when they execute. Ancestors may not be attached yet. Use the callback argument rather than the variable being initialized. Fresh template clones run their own callback; reset, reordering, and edits do not rerun it. Returned values are ignored; this is neither an async hook nor a cleanup registration. |
| `syncInputs` | Reactively copies node state and constraints into matching custom-control inputs. This is one-way node-to-component synchronization; it does not enable value binding, execute validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs. |
| `bindInputOutputPairs` | Connects recognized value/valueChange or checked/checkedChange input/output pairs. CVAs and actual model signals keep priority. Enabling a pair connects values and interaction hooks; optional state inputs are selected independently by `syncInputs`. |
| `equal` | Compares exposed values and retains the previous exposed value when they are equal. Validators, submission, and `update()` read that exposed value. Committed storage and controls still accept new writes. The comparator is captured at construction and runs untracked when the exposed computed value evaluates; comparison errors propagate. |
| `validators` | Registers rules on this node's exposed value. Aggregate rules receive the complete object or array; put per-field rules on children. A synchronous composition may return validators; asynchronous rules must be wrapped with `asyncValidator()`. Null and undefined entries are ignored. Contexts are typed; inline returns intentionally allow self-reference inference. Use `validator()` or an explicit result annotation when returned errors also need strict checking. |
| `injector` | Provides an explicit owner for injector-dependent work, including async-validator watchers. Without one, construction captures the current injection context when available; binding adoption and ancestor inheritance provide temporary fallback ownership. Standalone nodes remain usable without dependency injection. |
| `inheritInjector` | Allows an otherwise unowned node to inherit its nearest ancestor injector. An explicit or construction-time injector takes precedence. Setting `false` creates an ancestor boundary; it does not disable an injector already owned by this node. |
| `adoptBindingInjector` | Allows an otherwise unowned node to borrow the injector of its directly bound `[formNode]` host. This binding owner takes precedence over an inherited ancestor. The lease ends on rebinding or destruction. Explicit and construction-time owners still take precedence. Setting `false` prevents only direct binding adoption. |
| `validatorMessages` | Overrides built-in validator messages for this scope and its descendants. An explicit validator message takes precedence. Returning `undefined` from the catalog or a selected message continues to ancestor, provider, global, and built-in fallbacks. Signals are tracked while the corresponding failing validator resolves its message. |
| `debounce` | Delays control-originated value commits. Descendants inherit this strategy unless they supply their own. Programmatic writes commit immediately. A later edit aborts the previous delay; `flush()` or an interactive `markAsTouched()` commits pending input. |
| `hidden` | Controls this node's local hidden state. Descendants inherit active hidden state; programmatic writes remain available. Hidden nodes suppress their own validation and reported interaction state. Hiding does not delete values or stored dirty/touched state. |
| `disabled` | Controls this node's local disabled state, inherited by descendants. A static string disables and supplies a reason even when empty; callback strings follow truthiness. Disabled nodes retain their values and accept programmatic writes; their own validation and reported interaction state are suppressed. Ancestor reasons cannot be cleared locally. |
| `readonly` | Controls this node's local readonly state. Descendants inherit active readonly state. It prevents control-originated edits, not programmatic writes. Readonly nodes suppress their own validation and reported dirty/touched state without discarding stored interaction. |
| `onSubmit` | Handles permitted submissions with the exposed value snapshot and this form. Return void/null for success, or an error/error array to reject the attempt. Untargeted errors belong to this form. Errors clear on target edits/reset or retry; obsolete async responses are ignored. Rejections and thrown exceptions propagate. Only one submission runs at a time. The third argument provides this form's current nearest containing array index. |
| `onSubmitBlocked` | Runs when validation blocks a submission, including pending validation under `valid`. Does not run for concurrent attempts or when `onSubmit` is absent. Native attempts emit `formNodeSubmitBlocked` first; that output also works without a submission handler. The second argument provides this form's current nearest containing array index. |
| `submitWhen` | Selects the validation gate for submission. Pending validation is checked immediately and is not awaited. This option never disables validators. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FormNode](./form-node.md)
- [NodeCallbackContext](./node-callback-context.md)
- [SyncInputName](./sync-input-name.md)
- [ValidationErrorWithOptionalTargetNode](./validation-error-with-optional-target-node.md)
- [ValidatorMessages](./validator-messages.md)
- [ValidatorSource](./validator-source.md)
