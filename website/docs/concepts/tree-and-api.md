---
title: Tree navigation and API access
---

# Tree navigation and API access

A form is both a callable value signal and a typed tree of child nodes. Gem Forms keeps those two views connected without requiring string paths.

## Direct child access

Every form child is exposed under its definition key:

```ts
const profile = form({
  name: field('Marco'),
  address: {
    city: field('Madrid'),
  },
});

profile.name();
profile.address.city();
```

The form also exposes a stable readonly `children` map for explicit traversal:

```ts
profile.children.name === profile.name; // true
profile.children.address.children.city === profile.address.city; // true
profile.api.children === profile.children; // true
```

## The `.api` convention

Use this access convention in application code:

| Situation | Preferred style | Reason |
| --- | --- | --- |
| Read any node value | `myNode()` | Nodes are callable value signals |
| Read field or array state | `myField.valid()`, `myArray.length()` | The direct API is concise and unambiguous |
| Run a field or array operation | `myField.set(value)`, `myArray.push(value)` | Prefer the operation directly on the node |
| Read form state or run a form operation | `myForm.api.valid()`, `myForm.api.patch(value)` | Form children can collide with direct API names |
| Write generic node infrastructure | `node.api` | Provides one consistent API surface for every node kind |
| Guarantee access despite an `api` child | `myForm.$api` | `$api` is reserved and collision-safe |

Calling a form remains the preferred way to read its complete value. For other form state and
operations, form children and API members share the same property space, so prefer `.api`:

```ts
profile(); // preferred value read
profile.api.patch({ name: 'Ada' });
profile.api.reset();
profile.api.valid();
```

Fields and arrays also expose `.api`, but their direct members are normally clearer:

```ts
profile.name.set('Ada'); // preferred
profile.name.api.set('Ada'); // equivalent

people.push({ name: 'Grace' }); // preferred
people.api.push({ name: 'Grace' }); // equivalent
```

One intentional field exception is `patch()`, which is available only as `field.api.patch()` because
patching a leaf is rarely needed and behaves exactly like `set()`.

## Name collisions

Domain names take precedence over direct form API members:

```ts
const settings = form({
  readonly: field(false),
  value: field('domain value'),
});

settings.readonly(); // child value
settings.value(); // child value
settings.api.readonly(); // form state
settings.api.value(); // complete form value
```

The name `api` is also a valid child name. `$api` is the reserved, collision-safe escape hatch:

```ts
const response = form({ api: field('v2') });

response.api(); // child named api
response.$api.value(); // complete form value
```

Use `.api` normally. Do not use `$api` merely because it exists: reserve it for generic code that
requires a guaranteed path or for a form that actually declares an `api` child. The `$api` property
is supported and not scheduled for removal; its deprecation annotation only keeps it less
prominent in autocomplete.

## Parent, root, and path

Every node exposes reactive tree-location signals:

```ts
profile.address.city.keyInParent(); // 'city'
profile.address.city.parent(); // profile.address
profile.address.city.form(); // profile
profile.address.city.path(); // ['address', 'city']
```

- A root node has `parent() === null` and path `[]`.
- A standalone field has `form() === null`.
- Array item paths use decimal string segments such as `['people', '0', 'name']`.
- Moving an array item updates its path without recreating the node.
- Detaching an array item clears its parent and path; a retained reference remains independently usable.

The signals are stable and reactive, so validators and effects can observe a node being attached, detached, or moved.

## Function property names

Native JavaScript function members such as `name`, `apply`, `call`, and `length` are hidden from node IntelliSense. A form may use those names for children, and the child remains available normally:

```ts
const command = form({
  name: field('deploy'),
  apply: field(false),
});

command.name();
command.apply();
```

This hiding affects the public type only; node callability and the documented API remain unchanged.
