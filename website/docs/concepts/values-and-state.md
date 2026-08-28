---
title: Values and state
---

# Values and state

Nodes are callable signals. Calling a node or its `value()` signal reads the committed value:

```ts
profile();
profile.api.value();
profile.name();
profile.name.value();
```

For forms, prefer `.api` for form-level operations because children are also exposed as direct properties. `$api` is the collision-safe alternative when a form contains a child named `api`.

## Set, update, and patch

`set()` replaces a complete value. `update()` computes a complete value from the current committed value:

```ts
profile.api.set({ name: 'Ada', age: 36 });
profile.api.update(value => ({ ...value, age: (value.age ?? 0) + 1 }));
```

`patch()` updates only supplied form branches:

```ts
profile.api.patch({ name: 'Grace' });
```

Field `patch()` is available through `field.api` and behaves like `set()`. Array `patch()` is positional and does not resize the array; see [Dynamic arrays](../guides/dynamic-arrays.md).

Programmatic writes preserve dirty and touched state.

## Reset

`reset()` clears dirty and touched state while preserving current values. Pass a complete value to replace values and clear interaction state together:

```ts
profile.api.reset();
profile.api.reset({ name: '', age: null });
```

Resetting a nested node affects only that subtree. Validators remain configured and immediately evaluate the reset value.

## Control values and debounce

`controlValue()` is the immediate value buffered from a bound UI control. `value()` is the committed model value observed by validators and ancestors:

```ts
const search = field('', { debounce: 300, nullable: false });

search.setControlValue('angular');
search.controlValue(); // 'angular'
search.value(); // '' until the delay completes
search.debouncing(); // true
```

Use `debounce: 'blur'` to commit on focus loss, or provide a function that receives an `AbortSignal` and optionally returns a promise. A new control value cancels the previous debounce. `flush()` commits immediately.

Forms and arrays can define an inherited debounce for descendant fields and expose aggregate `debouncing()` and `flush()` operations. Programmatic `set()`, `update()`, `patch()`, and `reset(value)` are never debounced.

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
@if (profile.secret.visible()) {
  <input [formNode]="profile.secret" />
}
```

Passing a string to `disable()` or the `disabled` option records a user-facing reason:

```ts
profile.api.disable('Account is locked');
profile.api.disabledReasons();
```

## Tree navigation

Every node exposes reactive `parent()`, `form()`, `path()`, and `keyInParent()` signals:

```ts
profile.address.city.path(); // ['address', 'city']
profile.address.city.parent(); // profile.address
profile.address.city.form(); // profile
```

Forms expose a stable readonly `children` map. Arrays expose an `items()` signal and index access.
