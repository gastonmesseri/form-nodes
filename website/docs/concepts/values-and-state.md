---
title: Values and state
---

import CodeBlock from '@theme/CodeBlock';
import aggregateValueEqualitySource from '!!raw-loader!../../examples/aggregate-value-equality.example.ts';
import consumerValueEqualitySource from '!!raw-loader!../../examples/consumer-value-equality.example.ts';

# Values and state {#values-and-state}

Nodes are callable signals. **Prefer calling the node itself to read its committed value:**

```ts
import { field, form } from '@ngblocks/form-nodes';

const profileForm = form({
  name: field('Marco'),
  age: field<number>(null),
  address: {
    city: field('Madrid'),
  },
  secret: field(''),
});

const profileValue = profileForm(); // { name: 'Marco', age: null, address: { ... }, secret: '' }
const nameValue = profileForm.name(); // 'Marco'
```

## 📝 Alternative value access {#alternative-value-access}

The callable `node.$api()` also reads the exposed value, just like
`node()` and `node.value()`. Their properties provide collision-safe state and operations.
See [callable APIs](./tree-and-api.md#callable-apis).

Examples throughout this documentation call nodes directly. The same committed value is also
available through `value()` directly or under `.$api`:

```ts
profileForm.value(); // { name: 'Marco', age: null, address: { ... }, secret: '' }
profileForm.$api.value(); // { name: 'Marco', age: null, address: { ... }, secret: '' }

profileForm.name.value(); // 'Marco'
profileForm.name.$api.value(); // 'Marco'
```

These alternatives are mainly useful in generic infrastructure or when explicitly naming the
signal is important. They do not represent different snapshots: for any node, `myNode()`,
`myNode.value()`, and `myNode.$api.value()` return the same committed value. Prefer `myNode()` in
application examples and ordinary consumer code.

The [Tree navigation and API access](./tree-and-api.md) guide documents `.$api` for the uncommon case
where a child name collides with a node member and for generic infrastructure.

## 📝 Custom equality for a consumer {#custom-equality-for-a-consumer}

When a particular consumer needs its own definition of equality, derive a signal with Angular's
`computed()` and supply an `equal` function. This works with `form()`, `group()`, `array()`, and
`field()`: read the selected node inside the computation and compare the resulting values.

The following preview treats name capitalization as irrelevant while still observing email changes:

<CodeBlock language="ts">{consumerValueEqualitySource}</CodeBlock>

Returning `true` retains the computed signal's **previous value and reference**. It does not keep
the latest value while merely silencing notifications. Consumers depending only on that derived
signal can skip recomputation; the source computation and equality check still run when needed
to compare a changed source. Other reactive dependencies can still cause a consumer to run.

In this example, `profile()` contains `'MARCO'` immediately, while `previewValue()` retains
`'Marco'` until a non-equivalent change occurs. Read the node directly whenever the latest committed
value matters. The derived signal does not alter the node's validation, submission, control values,
interaction state, or debounce cancellation; those continue to use the node's own model and state.

Keep the comparator pure and only treat values as equal when they are interchangeable for this
consumer. Its arguments are inferred from the computation, including any field nullability.
Signals read inside the equality function are not tracked as dependencies; read reactive inputs
in the computation itself when they must trigger updates.

This differs from configuring equality on a node, which affects its public value for all consumers.
[`field(..., { equal })`](../reference/field.md#field-equal-option), `form()`, `group()`, and `array()` apply
equality to their exposed values. Internal storage and controls still accept the latest writes.
A derived `computed()` remains useful when the comparison belongs to only one consumer.

## 📝 Aggregate value equality {#aggregate-value-equality}

`form()`, `group()`, and `array()` accept `equal: 'shallow'`, `'deep'`, or a typed
`(previous, next) => boolean` function. The default is `Object.is`. Equality controls the exposed
aggregate snapshot while each child continues to accept its own committed values and apply its
own public equality, if configured.

<CodeBlock language="ts">{aggregateValueEqualitySource}</CodeBlock>

| Operation or read | Value used |
| --- | --- |
| Node call and equivalent `value()` signal | Exposed aggregate value, retaining the previous value when equal. |
| Validator `ctx.value()` and value passed to `submit()` | Exposed value. |
| Input to an `update()` callback | Exposed value. |
| Public parent composition, including arrays | Exposed values of its children. |
| Child writes, reconciliation, and control synchronization | Current committed child values. |
| Aggregate control debounce invalidation | Current committed values, independently of public equality. |

`'shallow'` compares direct properties with `Object.is`. `'deep'` uses the same recursive comparison
as [field equality](../reference/field.md#field-equal-option). Custom comparator arguments preserve
the complete inferred object or array shape and child nullability. The option is captured at construction,
is not inherited, and is preserved in configured factories and array template clones.

The exposed aggregate is a lazy `computed()`. The first evaluation publishes the current snapshot
without comparing it; later evaluations compare against the last exposed value. Intermediate
writes may be combined before a read. Comparator reads are untracked. A throwing comparator can
make an exposed read fail after children have already accepted their values; a later dependency
change allows the computed to recover. Fields follow the same exposed-value strategy: equality
does not reject writes at storage time.

Value-only validators can retain their result or pending asynchronous work after an equal change.
Other dependencies still matter: a validator that reads `ctx.node().name()` directly observes that
child's public value, and child errors and interaction state continue propagating independently.
The comparator must therefore treat values as interchangeable for the aggregate's validation and
submission rules, as well as for its other consumers.

`reset()` clears interaction and pending control work while preserving current child values.
`reset(value)` assigns the supplied child values; the exposed aggregate may still retain an equal
previous snapshot. Bound controls follow current committed values. Consequently `value.control()`
may differ from the exposed aggregate even without a pending debounce; it remains a control-facing
signal, not an alternative general-purpose value accessor.

Array equality filters the public value independently of structure. `items()`, indexed access,
`length()`, paths, and reconciliation follow the current nodes even if the exposed value retains
an older array. A comparator that ignores ordering can retain the old public order while item nodes
move; one that ignores length can retain a different public item count. Use `items()` for rendering
dynamic rows. See [array equality](../reference/array.md#equal-option) for an executable example.

## 📝 Set, update, and patch {#set-update-and-patch}

`set()` replaces a complete value. `update()` computes a complete value from the current exposed value:

```ts
profileForm.set({
  name: 'Ada',
  age: 36,
  address: { city: 'London' },
  secret: '',
});
profileForm.update(value => ({ ...value, age: (value.age ?? 0) + 1 }));
```

`patch()` updates only supplied form branches:

```ts
profileForm.patch({ name: 'Grace' });
```

Use `set()` to replace a field value. Array `patch()` is positional and does not resize the array;
see [Dynamic arrays](../guides/dynamic-arrays.md).

Programmatic writes preserve dirty and touched state.

## ↩️ Reset {#reset}

`reset()` clears dirty and touched state while preserving current values. Pass a complete value to replace values and clear interaction state together:

```ts
profileForm.reset();
profileForm.reset({
  name: '',
  age: null,
  address: { city: '' },
  secret: '',
});
```

Resetting a nested node affects only that subtree. Validators remain configured and immediately evaluate the reset value.

## ⏱️ Control values and debounce {#control-values-and-debounce}

`value.control()` is not another general-purpose value accessor. It is the immediate value buffered
from a bound UI control, while the node call reads the committed model observed by validators and
ancestors:

:::info Two snapshots during debounce

Read the node itself for application state. Reach for `value.control()` only when control
infrastructure specifically needs the uncommitted UI representation.

:::

```ts
const myForm = form({
  search: field('', { debounce: 300 }),
});

myForm.search.value.control.set('angular');
myForm.search.value.control(); // 'angular'
myForm.search(); // '' until the delay completes (preferred committed-value read)
myForm.search.debouncing(); // true
```

Without a pending control debounce, `value.control()` and the committed value normally match.
Pending values from descendant controls are not composed into a form or array's
`value.control()`; aggregate nodes continue exposing their last committed representation until the
descendant value commits.

Use `debounce: 'blur'` to commit on focus loss, or provide a function that receives an `AbortSignal` and optionally returns a promise. A new control value cancels the previous debounce. `flush()` commits immediately.

Forms and arrays can define an inherited debounce for descendant fields and expose aggregate `debouncing()` and `flush()` operations. Programmatic `set()`, `update()`, `patch()`, and `reset(value)` are never debounced.

See [Value flow and debounce](../guides/value-flow-and-debounce.md) for the complete transition table, custom debounce cancellation, aggregate buffers, and reset interaction.

## 👆 Interaction state {#interaction-state}

Every node exposes paired state signals and actions:

| State | Complement | Actions |
| --- | --- | --- |
| `touched()` | `untouched()` | `markAsTouched()`, `markAsUntouched()` |
| `dirty()` | `pristine()` | `markAsDirty()`, `markAsPristine()` |
| `disabled()` | `enabled()` | `disable()`, `enable()` |
| `readonly()` | `writable()` | `markAsReadonly()`, `markAsWritable()` |
| `hidden()` | `visible()` | `hide()`, `show()` |

A control-originated value change marks its directly bound node dirty. Blur or a control touch event marks it touched. Aggregate touched and dirty state reflects descendants.

`markAsTouched()` applies to an aggregate subtree by default. Pass `{ skipDescendants: true }` to touch only that node.

## 🎛️ Disabled, readonly, and hidden {#disabled-readonly-and-hidden}

These states suppress a node's validation errors and exclude its invalid or pending state from ancestor validity. They do not prevent programmatic reads or writes.

- Disabled state propagates to descendants and records causes in `disabledReasons()`.
- Readonly state propagates to descendants and prevents UI edits.
- Hidden state propagates to descendants but does not remove DOM elements.

Templates should use `@if` to omit hidden controls:

```html
@if (profileForm.secret.visible()) {
  <input [formNode]="profileForm.secret" />
}
```

Passing a string to `disable()` or the `disabled` option records a user-facing reason:

```ts
profileForm.disable('Account is locked');
profileForm.disabledReasons();
```

See [Interaction and availability](../guides/interaction-and-availability.md) for exact propagation, stored state, and non-interactive validation behavior.

## 🌳 Tree navigation {#tree-navigation}

Every node exposes reactive `parent()`, `form()`, `root()`, `path()`, and `keyInParent()` signals:

```ts
profileForm.address.city.path(); // ['address', 'city']
profileForm.address.city.parent(); // profileForm.address
profileForm.address.city.form(); // profileForm
profileForm.address.city.root(); // profileForm
```

`form()` identifies the nearest explicit submission workflow, while `root()` returns the topmost
structural node. They differ when an explicit form is nested inside another tree.

Forms expose a stable readonly `children` map. Arrays expose an `items()` signal and index access.

See [Tree navigation and API access](./tree-and-api.md) for paths, parents, child maps, and API-name collisions.
