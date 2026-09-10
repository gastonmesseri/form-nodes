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
    onValueChange?(value: TValue, node: TForm): void;
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
    hidden?: boolean | (() => boolean);
    disabled?: boolean | string | (() => boolean | string);
    readonly?: boolean | (() => boolean);
    onSubmit?(value: TValue, form: TForm): void | null | ValidationErrorWithOptionalTargetNode<AnyNode> | readonly ValidationErrorWithOptionalTargetNode<AnyNode>[] | PromiseLike<void | null | ValidationErrorWithOptionalTargetNode<AnyNode> | readonly ValidationErrorWithOptionalTargetNode<AnyNode>[]>;
    onSubmitBlocked?(form: TForm): void;
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
| `onValueChange` | Runs synchronously after a committed public value changes, for control and programmatic writes. Skips initialization and values retained by equal. Control writes respect debounce. Aggregate operations notify once after their children are updated, with descendants first. Runs untracked, without requiring an injector; does not wait for asynchronous validation. Callback writes are delivered after the current callback. Return values are ignored. |
| `configure` | Configures this instance synchronously once, after its own API and children are ready. Receives the collision-safe callable `$api`, so child names cannot hide operations. Runs untracked; install validators here to track their reads when validation executes. Runs for every fresh template clone. Existing instances do not rerun on reset, moves, or edits. Ancestors may not be attached yet. Do not read the variable being initialized here. Returned values are ignored; this is not an async or cleanup lifecycle hook. |
| `syncInputs` | **EXPERIMENTAL — uses Angular internals. Disabled by default.** |
| `bindInputOutputPairs` | **EXPERIMENTAL — uses Angular internals. Disabled by default.** |
| `equal` | Equality for the exposed aggregate value. Defaults to `Object.is`. Equal results retain the previous public value for callable/value reads, value-dependent validation, submission values, and update callbacks. Child writes and internal control synchronization still use the latest committed values. The comparator is captured at construction and runs untracked when the exposed computed value is evaluated. |
| `validators` | One validator or an array of validators that validate the complete form value. |
| `injector` | Optional injector that owns the asynchronous validation watcher lifecycle. |
| `inheritInjector` | Whether this node may use the injector of its parent or another ancestor when it has no injector of its own. Defaults to `true`. Set to `false` to create an injector-inheritance boundary while preserving an explicit or currently captured injector on this node. |
| `adoptBindingInjector` | Whether this node may temporarily adopt the injector of a directly bound `[formNode]` host when it has no injector of its own. Defaults to `true`. The binding injector takes precedence over an inherited ancestor injector and is released when the binding is destroyed or rebound. |
| `validatorMessages` | Partial validator message catalog inherited by this form or array and its descendants. |
| `debounce` | Default control-value debounce inherited by descendants: milliseconds, `'blur'`, or a cancelable asynchronous function. |
| `hidden` | Initial or reactive visibility of the complete form subtree. |
| `disabled` | Initial or reactive disabled state for the complete subtree. Return a string to record a user-facing reason. |
| `readonly` | Initial or reactive readonly state for the complete subtree. |
| `onSubmit` | Runs when submitWhen permits submission. Receives the exposed value snapshot first and this form second. Return an error or readonly error array to reject the submission. Omitted targets belong to this form. Errors clear on target edits/reset or before retrying; obsolete responses are ignored. Thrown failures propagate. |
| `onSubmitBlocked` | Runs when validation blocks submission, including pending validation with submitWhen: 'valid'. Does not run for concurrent submissions or a missing onSubmit. For native attempts, formNodeSubmitBlocked emits first and also supports forms without onSubmit. |
| `submitWhen` | When validation permits submission: 'not-invalid' (default) allows pending validation, 'valid' requires valid(), and 'always' bypasses the validation gate without disabling validators. Pending validation blocks immediately; it is not awaited. |

## Related reference

- [Configuration reference](../configuration.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [FormNode](./form-node.md)
- [SyncInputName](./sync-input-name.md)
- [ValidationErrorWithOptionalTargetNode](./validation-error-with-optional-target-node.md)
- [ValidatorMessages](./validator-messages.md)
- [ValidatorSource](./validator-source.md)
