---
title: Dynamic object children
---

# Dynamic object children

Use dynamic object children when a form or group gains named controls at runtime. For repeated
ordered entries, use [`array()`](./dynamic-arrays.md) instead.

The complete [executable example](../examples/executable-examples.mdx#dynamic-form-children)
verifies insertion, lookup, aggregate values, and detachment.

## Add one child

`add(name, definition)` accepts the same shorthand as an initial `form()` or `group()` declaration,
attaches the normalized node, and returns it with its exact inferred type:

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
`group()` nodes and concise values become `field()` nodes, just as they do in the original
`form()` declaration:

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

The operation validates every destination key and definition before normalizing or attaching
anything. Existing keys, and `$api` are rejected. Array values become fields; use an
explicit `array(...)` for a dynamic collection with item nodes. Use `field(objectValue)` whenever
a plain object should remain one atomic value instead of becoming a group.

Both `add()` signatures intentionally preserve the cardinality of their input. Adding one named
definition returns that exact attached node; adding an object returns an exact keyed map containing
all attached nodes. This keeps the common single-control call concise while retaining precise types
for an atomic multi-control addition.

Unlike keys in the initial `form()` definition, a dynamically added key is not installed as a
direct property. This keeps misspelled properties detectable by TypeScript and Angular's strict
template checker.

:::important Static children and dynamic children use different access paths

Children present in the original `form()` or `group()` declaration support direct property access.
Children attached later with `add()` do not.

| Child kind | Declaration | Supported access |
| --- | --- | --- |
| Initially declared | `form({ name: field('') })` | `profile.name` |
| Added dynamically | `profile.add('age', field(23))` | returned node, `profile.get('age')` |

Neither `profile.age` nor `profile['age']` is supported for a dynamically added child. This is
intentional: allowing arbitrary properties would also allow a typo such as
`profile.mistypedName` to pass type checking.

:::

## Look up a runtime key

Use `get(key)` for a runtime key. It returns `DynamicNode | undefined`.
`DynamicNode` exposes every state and operation shared by all node kinds, such as `value`,
`disabled`, `errors`, `set()`, and `reset()`. Primitive-specific operations such as `submit()` are
not available until the node is narrowed. Children declared in the original definition retain
their exact direct-property types.

```ts
profile.get('age')?.value(); // 23
profile.get('unknown'); // undefined
profile.name(); // string | null

const key: string = configuration.controlName;
profile.get(key); // DynamicNode | undefined
```

`profile.age` does not compile merely because `age` was added at runtime. Retain the exact node
returned by `add()` when its type matters. Assignment such as `profile.age = field(23)` is not an
alternative spelling of `add()`: structural mutation remains explicit.

The same rule applies in Angular templates. Narrow the optional lookup before binding it:

```html
<!-- Correct: name was part of the original declaration. -->
<input [formNode]="profile.name" />

<!-- Correct: age was added at runtime. -->
@if (profile.get('age'); as age) {
  <input [formNode]="age" />
}

<!-- Does not compile: age is not a declared direct property. -->
<input [formNode]="profile.age" />

<!-- Does not compile, catching the typo. -->
<input [formNode]="profile.mistypedName" />
```

If the code that adds the child also owns the template, retaining the result gives the clearest and
most precise binding:

```ts
const age = profile.add('age', field(23));
```

```html
<input [formNode]="age" />
```

## Remove a dynamic child

`remove(name)` detaches and returns a dynamically added child:

```ts
const removed = profile.remove('age'); // DynamicNode | undefined

profile.get('age'); // undefined
removed?.parent(); // null
```

The detached node remains usable. It no longer contributes value, validation, interaction state,
focus, or pending work to its former parent. Initially declared children cannot be removed because
their presence is guaranteed by the form's static type.

A removed node can be attached to another form or group. It then receives the new parent, path,
root, inherited state, debounce, and injector ownership. Replace a runtime child explicitly by
removing it and adding a new definition under the same key:

```ts
const previousAge = profile.remove('age');
const age = profile.add('age', field(36));

previousAge?.parent(); // null
age(); // 36
```

## Value typing

The original definition remains the form's statically known value shape. Runtime children appear
in the JavaScript object returned by the form, but code that needs their values should retain the
typed node returned by `add()` or narrow the result of `get()`.

`set()`, `patch()`, `update()`, and `reset(value)` keep their original fixed-shape input types.
They update matching dynamic keys when an untyped runtime object supplies them; omitted dynamic
children retain their current value. `reset()` still clears their interaction state recursively.

## Angular comparison

Angular Signal Forms 22.1.5 derives object and array children from the shape of its writable model;
it does not expose an `addControl()` operation on a field tree. Form Nodes owns explicit nodes, so
`add()` and `remove()` are deliberate library-specific structural operations.

## Related guides and reference

- [Creating nodes](../concepts/creating-nodes.md)
- [`form()` reference](../reference/form.md)
- [`group()` reference](../reference/group.md)
- [Dynamic arrays](./dynamic-arrays.md)
- [Tree navigation and API access](../concepts/tree-and-api.md)

## Enumerating children and static types

`Object.values(node.children)` uses the union of initially declared child types in TypeScript.
Runtime enumeration still includes nodes attached with `add()`, even if their types fall outside
that union. This is a deliberate approximation for declaration-based code.

`forEachChild()` excludes dynamically added nodes by default, so its callback's declared-child
union matches runtime iteration. Pass `{ includeDynamic: true }` as the second argument to
include all immediate children and receive `DynamicNode` callbacks. A runtime boolean also uses
`DynamicNode`; an omitted option or a literal false preserves the declared union.

## Start with an empty record

Use `form({})` or `group({})` for a container whose children will be attached with `add()`.
Call `forEachChild(callback, { includeDynamic: true })` to visit its added children with
`DynamicNode` callbacks. Without that option, iteration visits nothing and the callback child type
is `never`. `Object.values(children)` still returns all children as `DynamicNode[]`. For a requested runtime key, `get(key)` still returns `DynamicNode | undefined`. Definitions with declared children
retain the declared-child union described above. See the [form reference](../reference/form.md#empty-declarations-as-dynamic-records)
for a complete example.
