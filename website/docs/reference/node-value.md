---
title: Node value views
---

import CodeBlock from '@theme/CodeBlock';
import viewsSource from '!!raw-loader!../../examples/node-value-views.example.ts';
import typedViewsSource from '!!raw-loader!../../examples/typed-node-value-views.example.ts';

# Node value views

Every field, group, form, and array exposes `value`, a [`NodeValueSignal<TValue, TSet>`](./types/node-value-signal.md).
`TValue` is its read type; `TSet` is the complete input accepted by `node.set()`.
This distinction preserves optional input defaults and array normalization. Array setters also
accept `null` or `undefined` to clear the array. Group/form setters accept complete objects,
not patches; use `patch()` for partial updates.

| Read | Configured custom equality | Pending input |
| --- | --- | --- |
| `node()` / `node.value()` | Applied, including exposed child values | Excluded |
| `node.value.committed()` | Bypassed, including descendants | Excluded |
| `node.value.control()` | Bypassed | Includes this node's own draft |

## value() {#value}

**Signature:** `value: NodeValueSignal<TValue, TSet>`; calling it returns `TValue`.

Reads the exposed committed value, exactly like calling the node. Prefer `profile.name()` for
ordinary application code. Configured `equal` may retain an earlier equivalent value; parent
exposed values compose exposed child values. Validator contexts, submission values, and `update()`
callbacks continue to use exposed values. Adding these views does not change those contracts.

**Example:** `profile.name.value(); // 'Ada'` in the complete example below.

## value.committed() {#value-committed}

**Signature:** `value.committed: Signal<TValue> & { set(value: TSet): void }`.

Reads the latest committed data before configured `equal` checks. An aggregate includes raw
committed child data, so a child equality rule cannot conceal a spelling or object change here.
**It still waits for debounce.** Use the control view to inspect pending input.

This is a reactive signal, not a notification for every assignment: Angular's ordinary identity
checks still apply. It does not make in-place object mutations reactive or produce defensive copies.

**Example:** after committing `'ADA'`, `profile.name.value.committed(); // 'ADA'`, even while the
case-insensitive exposed read remains `'Ada'`.

## value.committed.set() {#value-committed-set}

**Signature:** `value.committed.set(value: TSet): void`.

Equivalent to `node.set(value)`. Commits immediately, cancels pending control input in the affected
subtree, synchronizes control rendering, and preserves dirty/touched state. Normal committed-value
validation and parent propagation apply. Configured `equal` still governs exposed values; this
setter does not disable it. It does not restore initial values: use `resetToInitial()` for that.

**Example:** `profile.name.value.committed.set('Grace')` replaces a pending draft immediately.

## value.control() {#value-control}

**Signature:** `value.control: Signal<TValue> & { set(value: TSet): void }`.

Reads the latest control representation, including this node's pending numeric, blur, or
asynchronous debounce. Without pending input it follows committed data before custom equality.
It is useful for control integration and draft previews.

**An aggregate's control value is not a recursive snapshot of pending child input.** It contains
its own buffered complete value, or committed child data when it has no active buffer. Read each
child's `value.control()` when a draft preview needs pending child input. A committed model change
can invalidate a pending aggregate buffer; the model remains authoritative.

**Example:** immediately after the control write, `profile.name.value.control(); // 'ADA'`.

## value.control.set() {#value-control-set}

**Signature:** `value.control.set(value: TSet): void`.

Receives control input and marks the selected node dirty, even if the value is unchanged. It does
not mark touched. Applies configured or inherited debounce before committing; without debounce,
commit is synchronous. `flush()` commits pending input early, and blur/touch completes blur debounce.
Committed-data validation and parent values follow the eventual commit. Existing aggregate
propagation rules apply; a complete aggregate control write is not a separate user edit on each child.

A new control write replaces pending work. A committed setter or reset cancels pending input.
`reset()` discards the draft and clears subtree interaction state; `resetToInitial()` also restores
captured initial values.

**Example:** `profile.name.value.control.set('ADA')` buffers input and marks the field dirty.

Neither nested setter emits [`formNodeControlValueChange`](./form-node-binding.md#value-outputs) or `formNodeValueChange` by itself.
Those outputs originate in the bound adapter's input channel. Keep [`[formNode]`](./form-node-binding.md) for ordinary binding;
there is no need to call a setter from its output handler to synchronize the node again.

## Executable example

This example exercises all five entries, custom equality, debounce, cancellation, and restoration.

<CodeBlock language="typescript" title="node-value-views.ts">{viewsSource}</CodeBlock>

## Generic infrastructure and migration

`node.value` and `node.$api.value` expose the same facade. Child properties can
shadow `value` or `api`; **use `node.$api.value` for an [`AnyNode`](./types/any-node.md) whose child names are unknown**.
All three views are Angular signals. Nested views expose `set()` only, not `update()` or
`asReadonly()` from `WritableSignal`. Setters may be extracted without binding a receiver.

Public `controlValue()` and `setControlValue()` have been removed. Follow the
[migration table](../project/migrations.md#nested-value-views) to update calls and signal references.

## Explicit FieldNode annotations and IntelliSense

`const myFieldNodeTyped: FieldNode = field('')` retains both `value.committed()` and
`value.control()`, including their `set()` methods. Omitting the generic uses `any`; use
[`FieldNode<string>`](./types/field-node.md) for string reads and writes, or retain the inferred factory type.
The property is spelled **`committed`**, with two `t` characters.

Function members such as `call`, `apply`, `bind`, `name`, and `length` are hidden from IntelliSense
on `value`, `value.committed`, and `value.control`. Completion after `node.value.` shows
`committed` and `control`; completion on either nested view shows `set`. All three remain callable
Angular signals. This is a public typing restriction; it does not modify JavaScript's function prototype.

<CodeBlock language="typescript" title="typed-node-value-views.ts">{typedViewsSource}</CodeBlock>
