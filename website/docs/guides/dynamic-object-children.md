---
title: Dynamic object children
---

# Dynamic object children

Use dynamic object children when a form or group gains named controls at runtime. For repeated
ordered entries, use [`array()`](./dynamic-arrays.md) instead.

The complete [executable example](../examples/executable-examples.mdx#dynamic-form-children)
verifies insertion, lookup, aggregate values, and detachment.

## Add one child

`add(name, definition)` attaches a standalone node and returns it with its exact inferred type:

```ts
const profile = form({ name: field('Marco') });

const age = profile.add('age', field(23));

age(); // 23
age.parent(); // profile
profile();
// Expected output: { name: 'Marco', age: 23 }
```

The new child immediately participates in aggregate value, validation, pending, touched, dirty,
disabled, readonly, hidden, debounce, focus, and injector inheritance.

## Add several children

Pass an object to add several definitions in one structural update. Plain nested objects become
`group()` nodes just as they do in the original `form()` declaration:

```ts
const added = profile.add({
  nickname: field('Mark'),
  address: {
    city: field('Zurich'),
  },
});

added.nickname(); // 'Mark'
added.address.city(); // 'Zurich'
```

The operation validates every destination key before attaching anything. Existing keys, `$api`,
and `$field` are rejected.

Unlike keys in the initial `form()` definition, a dynamically added key does not replace an
existing form or callable member. When such a name collides, read the child through `children`.

## Look up a runtime key

Access runtime keys directly with dot or bracket notation. Undeclared names have type
`DynamicNode | undefined` and evaluate to
`undefined` until added. `DynamicNode` exposes every state and operation shared by all node kinds,
such as `value`, `disabled`, `errors`, `set()`, and `reset()`. Native function members such as
`apply` and primitive-specific operations such as `submit()` remain hidden. Children declared in
the original definition retain their exact types.

```ts
profile.age; // DynamicNode | undefined
profile.age?.value(); // 23
profile.unknown; // DynamicNode | undefined
profile.name(); // string | null

const key: string = configuration.controlName;
profile[key]; // DynamicNode | undefined
```

When a dynamic name collides with an API operation such as `set`, or a native callable member such
as `name`, access that child through `children`; the existing member remains available normally.

## Remove a dynamic child

`remove(name)` detaches and returns a dynamically added child:

```ts
const removed = profile.remove('age'); // DynamicNode | undefined

profile.age; // undefined
removed?.parent(); // null
```

The detached node remains usable. It no longer contributes value, validation, interaction state,
focus, or pending work to its former parent. Initially declared children cannot be removed because
their presence is guaranteed by the form's static type.

## Value typing

The original definition remains the form's statically known value shape. Runtime children appear
in the JavaScript object returned by the form, but code that needs their values should retain the
typed node returned by `add()` or narrow the direct dynamic-property result.

`set()`, `patch()`, `update()`, and `reset(value)` keep their original fixed-shape input types.
They update matching dynamic keys when an untyped runtime object supplies them; omitted dynamic
children retain their current value. `reset()` still clears their interaction state recursively.

## Angular comparison

Angular Signal Forms 22.1.4 derives object and array children from the shape of its writable model;
it does not expose an `addControl()` operation on a field tree. Gem Forms owns explicit nodes, so
`add()` and `remove()` are deliberate library-specific structural operations.

## Related guides and reference

- [Creating nodes](../concepts/creating-nodes.md)
- [`form()` reference](../reference/form.md)
- [`group()` reference](../reference/group.md)
- [Dynamic arrays](./dynamic-arrays.md)
- [Tree navigation and API access](../concepts/tree-and-api.md)
