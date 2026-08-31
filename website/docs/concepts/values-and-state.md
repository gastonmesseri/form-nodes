---
title: Values and state
---

# Values and state

Nodes are callable signals. **Prefer calling the node itself to read its committed value:**

```ts
import { field, form } from '@gem/ng-forms';

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

## Alternative value access

Examples throughout this documentation call nodes directly. The same committed value is also
available through `value()` directly or under `.api`:

```ts
profileForm.value(); // { name: 'Marco', age: null, address: { ... }, secret: '' }
profileForm.api.value(); // { name: 'Marco', age: null, address: { ... }, secret: '' }

profileForm.name.value(); // 'Marco'
profileForm.name.api.value(); // 'Marco'
```

These alternatives are mainly useful in generic infrastructure or when explicitly naming the
signal is important. They do not represent different snapshots: for any node, `myNode()`,
`myNode.value()`, and `myNode.api.value()` return the same committed value. Prefer `myNode()` in
application examples and ordinary consumer code.

The [Tree navigation and API access](./tree-and-api.md) guide documents `.api` for the uncommon case
where a child name collides with a node member and for generic infrastructure.

## Set, update, and patch

`set()` replaces a complete value. `update()` computes a complete value from the current committed value:

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

## Reset

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

## Control values and debounce

`controlValue()` is not another general-purpose value accessor. It is the immediate value buffered
from a bound UI control, while the node call reads the committed model observed by validators and
ancestors:

:::info Two snapshots during debounce

Read the node itself for application state. Reach for `controlValue()` only when control
infrastructure specifically needs the uncommitted UI representation.

:::

```ts
const myForm = form({
  search: field('', { debounce: 300 }),
});

myForm.search.setControlValue('angular');
myForm.search.controlValue(); // 'angular'
myForm.search(); // '' until the delay completes (preferred committed-value read)
myForm.search.debouncing(); // true
```

Without a pending control debounce, `controlValue()` and the committed value normally match.
Pending values from descendant controls are not composed into a form or array's
`controlValue()`; aggregate nodes continue exposing their last committed representation until the
descendant value commits.

Use `debounce: 'blur'` to commit on focus loss, or provide a function that receives an `AbortSignal` and optionally returns a promise. A new control value cancels the previous debounce. `flush()` commits immediately.

Forms and arrays can define an inherited debounce for descendant fields and expose aggregate `debouncing()` and `flush()` operations. Programmatic `set()`, `update()`, `patch()`, and `reset(value)` are never debounced.

See [Value flow and debounce](../guides/value-flow-and-debounce.md) for the complete transition table, custom debounce cancellation, aggregate buffers, and reset interaction.

## Interaction state

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

## Disabled, readonly, and hidden

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

## Tree navigation

Every node exposes reactive `parent()`, `form()`, `path()`, and `keyInParent()` signals:

```ts
profileForm.address.city.path(); // ['address', 'city']
profileForm.address.city.parent(); // profileForm.address
profileForm.address.city.form(); // profileForm
```

Forms expose a stable readonly `children` map. Arrays expose an `items()` signal and index access.

See [Tree navigation and API access](./tree-and-api.md) for paths, parents, child maps, and API-name collisions.
