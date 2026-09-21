---
title: Configuring nodes and sibling rules
---

# Configuring nodes and sibling rules

import CodeBlock from '@theme/CodeBlock';
import subscriptionsSource from '!!raw-loader!../../examples/node-value-subscriptions.example.ts';
import subscriptionOwnerSource from '!!raw-loader!../../examples/node-value-subscriptions.typecheck.ts';
import valueChangeSource from '!!raw-loader!../../examples/on-value-change.example.ts';
import indexedParentSource from '!!raw-loader!../../examples/indexed-validator-parent.typecheck.ts';
import configureSource from '!!raw-loader!../../examples/configure-nodes.example.ts';

Use the `configure` option when a rule needs several already-created children. Its callback receives
the node's callable, [collision-safe `$api`](../reference/node-api.md), with the children inferred from
your declaration. No parent assertion or reference to the variable being initialized is necessary.

## One callback for each node instance

| Primitive | Callback argument | Typical use |
| --- | --- | --- |
| [`field()`](../reference/field.md#configure) | The field API, including `value` and `setValidators` | Install a reusable rule on the created field. |
| [`group()`](../reference/group.md#configure) | The group API, including typed `children` | Connect sibling validators. |
| [`form()`](../reference/form.md#configure) | The form API, including typed `children` and submission operations | Configure rules involving several branches. |
| [`array()`](../reference/array.md#configure) | The array API, including typed `items()` | Configure the collection itself. |

`array(..., { configure })` configures the **array**, not each row. To configure rows, put the
callback on the template: `array(group({ ... }, { configure }))`. An explicit `form()` template
also supports this if each row should own a submission workflow. A [factory](./dynamic-arrays.md)
remains useful when you prefer capturing locally declared sibling nodes.

<CodeBlock language="ts" title="configure-nodes.ts">{configureSource}</CodeBlock>

## Timing and lifecycle

- The callback runs synchronously once per new instance, before its factory returns. The node's
  own API, declared children, and initial array items are ready. Immediate children are attached
  to this node, but the node itself may not yet have an ancestor.
- A template is an independent node and runs its own callback. Each fresh clone runs the callback
  again with its own API. This includes new rows created by `push()`, insertion, or value reconciliation.
- Existing nodes do not rerun configuration on edits, reset, movement, or keyed reuse. A reset or
  set that creates new nodes configures those new instances normally.
- Configuration runs **untracked**. Reading a signal in the callback does not subscribe the outer
  declaration to it. Reads inside the validators you install remain reactive in the usual way.
- Configuration works outside an Angular injection context. It does not create an injection context
  or wait for bindings. Do not assume ancestors, DOM controls, or injected providers are available.
- Do not reference the variable being initialized from the callback: it has not been assigned yet.
  Use the callback argument. Avoid synchronous validity rules that depend on that outer variable.
- Return values are ignored. Use a synchronous callback; promises are not awaited and returned
  functions are not registered as cleanup handlers. Thrown exceptions propagate from construction.
- `setValidators()` replaces the node's validators. If it should retain declaration rules, include
  those rules in the replacement list. This follows the ordinary `setValidators()` contract.

Prefer configuration for installing rules rather than changing initial values. A callback's `set()`
changes current state; it does not redefine a field's declared reset default. Supplied array row
values are applied after the template instance is constructed, so they can overwrite construction-time
value changes. Install a validator that reads live values instead of capturing a value snapshot.

## Declaring a parent contract

`ctx.parent<TParent>()` is available in synchronous and asynchronous validator contexts. It returns
a read-only validation view of `NonNullable<TParent>`, or `null`. It retains reactive parent
tracking and refers to the **immediate structural parent**.
It does not skip an array to find a group. A field cannot be used as the parent type.

Array index types may include `undefined`; pass them directly without writing `NonNullable`:

<CodeBlock language="ts" title="indexed-validator-parent.typecheck.ts">{indexedParentSource}</CodeBlock>

`ctx.parent<DeliveryForm['packages'][number]>()` and
`ctx.parent<(typeof this.form.packages)[number]>()` both remove nullish members from the generic.
`ctx.parent<typeof this.form.packages[0]>()` also works, though `[number]` more clearly describes
any row type. The return still includes `null` for a missing parent and never includes `undefined`.
The generic only describes the immediate parent; it does not select a row or look up index zero.

:::info A declared contract, not automatic inference

The generic is a consumer-supplied type assertion. It does not check the parent's kind or child names
at runtime, or verify where the field will eventually be attached. A missing parent still returns
`null`; a mismatched attached parent is not converted to `null`. Use this for reusable fields with a
known placement contract. Prefer `configure` when the surrounding declaration can infer the siblings.

:::

Without a generic, `ctx.parent()` retains its existing inferred or general navigation type. This
convenience belongs to validator contexts; ordinary node `parent()` signals keep their existing API.

## Extracting an array item type

[`ArrayItemNode<TArray>`](../reference/types/array-item-node.md) extracts the type of an existing row,
including its child nodes and parent navigation. Unlike a numeric lookup or `at()`, the type itself
excludes `undefined`; actual lookups can still fail and must be checked.

```ts
type PackageNode = ArrayItemNode<DeliveryEditor['form']['packages']>;
```

Extract this type from an already inferred declaration. Referencing that same declaration's type
inside its initializer can introduce a circular inference dependency; the helper does not remove it.

The node returned by `ctx.parent<TParent>()` always uses the recursive read-only validation view,
even with an explicit generic. Read child values for conditions and return errors. Validation
outputs, metadata queries, and mutations remain unavailable through that view; `configure` itself
continues to receive the normal API for installing validators and initializing the node.


## React after value changes {#value-changes}

:::info Observe the node or a specific control

`onValueChange` observes committed value changes from both control edits and programmatic writes.
Use the [binding outputs](../reference/form-node-binding.md#value-outputs) to observe only edits from
a specific control: `(formNodeValueChange)` reports committed input after debounce, and
`(formNodeControlValueChange)` reports the control value immediately, before debounce.
Programmatic writes do not emit either output.

:::

Use `onValueChange(value, node)` in the options of `field()`, `form()`, `group()`, or `array()`
to react to a change in the node's committed public value. Both arguments retain the inferred
value and node types. The callback runs synchronously before the operation returns; reading
other signals inside it does not subscribe the callback to those signals. No injector is needed.

<CodeBlock language="ts" title="on-value-change.ts">{valueChangeSource}</CodeBlock>

The callback observes control input and programmatic changes through `set()`, `update()`, aggregate
`patch()`, and resets that change the value. `value.committed.set()` also notifies. Control input
waits for its debounce or an explicit flush; a canceled pending input never notifies. As with all
public value consumers, the node's `equal` option can retain a previous value and suppress a
notification. Installing this callback observes values at operation boundaries, so comparisons
are evaluated then instead of waiting for an unrelated consumer to read the value.

Declaration, `configure`, and initial values assigned to new array rows do not notify.
Array template callbacks are copied to new rows and run on their later edits. Array insertions,
removals, reorders, and reconciliation notify the array and its ancestors when their exposed value
changes. Removed children no longer notify former ancestors. Options are captured on construction;
callbacks are not inherited by descendants.

A single aggregate `set()`, `patch()`, reset, or flush updates its children before notifying.
Changed descendants run before their ancestors; ancestor callbacks see the complete resulting
value once, including changes made by descendant callbacks. Separate operations notify separately.
Calls made inside a callback queue further notifications until that callback returns. Callbacks
that repeatedly modify their own dependencies must settle: more than 100 notifications for one
node in a single operation throws an error and clears the pending queue.

`onValueChange` does not change dirty/touched state and does not wait for asynchronous validation.
An invalid, disabled, readonly, or hidden node can still report a programmatic value change.
Validation completion and changes to interaction or availability alone do not notify. Return
values are ignored; asynchronous callback work is not awaited or canceled by the library.

If a synchronous callback throws, committed writes remain applied and other pending callbacks
still run. The operation then throws that error; multiple failures use `AggregateError`. For timer- or promise-delayed commits,
errors surface during that scheduled delivery, not from the earlier input call. A comparator
failure can be recovered by a later write; an unreadable public value does not notify. A failed
operation that already changed part of a tree reports the resulting changes as well. Notifications
are released at the operation boundary, with no live watcher or global strong registration keeping
an unreachable node alive.

The callback receives the node itself. Use `node.$api` when a child name hides an API member, as
explained in [API access](../reference/node-api.md). To observe only control-originated input, use
the [binding outputs](../reference/form-node-binding.md) instead.


### Subscribe to an existing node {#value-subscriptions}

Call `node.onValueChange(callback, { injector? })` after creating a field, form, group, or array.
The callback receives the inferred value and original node. Each call creates an independent
subscription and returns an idempotent cancellation function. The method also exists on `$api`
when an object child is named `onValueChange`.

<CodeBlock language="ts" title="node-value-subscriptions.ts">{subscriptionsSource}</CodeBlock>

Instance subscriptions follow the same equality, debounce, batching, validation, and error rules
as the construction callback above. They emit no initial value, coexist with the construction
callback, and are not copied to array template clones. Registration during `configure` works;
construction-time writes remain silent. For each notification, the construction callback runs
first, then instance listeners in registration order. Canceling a listener before its turn skips
it. New listeners do not receive an update already in progress, but can receive subsequent
reentrant changes. Every listener in a delivery receives the same value snapshot, even if an
earlier listener makes another write.

### Automatic subscription cleanup {#subscription-ownership}

Choose the consumer owner in this order: the explicit `options.injector`, the context where
`onValueChange()` is called, or the node's current injector. The explicit option only owns this
subscription and does not change the node's injector. The subscription also ends if the node's
current owner is destroyed, even when the consumer has a longer lifetime.

<CodeBlock language="ts" title="profile-page.ts">{subscriptionOwnerSource}</CodeBlock>

A node keeps its explicit or captured injector ahead of direct binding and ancestor injectors.
When it temporarily adopts a `[formNode]` binding injector or inherits an ancestor injector,
subscriptions follow ownership changes: rebinding or detachment removes the old association.
A detached node can still notify. Destruction of the former owner does not cancel a subscription
that has already moved away, unless that injector was also chosen explicitly or captured as the
consumer owner. A canceled subscription does not restart on later attachment.

Without an injector, subscriptions still work synchronously. Use the returned cancellation function
when the node outlives its consumer. Unreachable nodes and callbacks can be garbage-collected;
keeping an injector or cancellation function alive does not retain the node tree. Canceling early
also unregisters lifecycle hooks. Unsubscribing does not reset the node or change its validation rules.

The callback provided in factory options keeps its existing node-lifetime behavior and is copied
into template clones. Use instance subscriptions for consumers that need automatic injector cleanup.
Callback return values do not register cleanup; asynchronous work started by a callback remains
owned by the application.
