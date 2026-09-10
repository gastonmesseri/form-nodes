---
title: Configuring nodes and sibling rules
---

# Configuring nodes and sibling rules

import CodeBlock from '@theme/CodeBlock';
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
`ctx.parent<(typeof this.deliveryForm.packages)[number]>()` both remove nullish members from the generic.
`ctx.parent<typeof this.deliveryForm.packages[0]>()` also works, though `[number]` more clearly describes
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
type PackageNode = ArrayItemNode<typeof deliveryForm.packages>;
```

Extract this type from an already inferred declaration. Referencing that same declaration's type
inside its initializer can introduce a circular inference dependency; the helper does not remove it.

The node returned by `ctx.parent<TParent>()` always uses the recursive read-only validation view,
even with an explicit generic. Read child values for conditions and return errors. Validation
outputs, metadata queries, and mutations remain unavailable through that view; `configure` itself
continues to receive the normal API for installing validators and initializing the node.
