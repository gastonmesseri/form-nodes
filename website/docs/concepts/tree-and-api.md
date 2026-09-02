---
title: Tree navigation and API access
---

import CodeBlock from '@theme/CodeBlock';

import ancestryLookupsSource from '!!raw-loader!../../examples/ancestry-lookups.example.ts';

# Tree navigation and API access

A form is both a callable value signal and a typed tree of child nodes. Gem Forms keeps those two views connected without requiring string paths.

## Direct child access

Every form child is exposed directly on the form under its definition key. This is the normal and
preferred way to navigate the tree:

```ts
const profile = form({
  name: field('Marco'),
  address: {
    city: field('Madrid'),
  },
});

profile.name(); // 'Marco'
profile.address.city(); // 'Madrid'
```

The same children are also available through a stable readonly `children` map:

```ts
profile.children.name === profile.name; // true
profile.children.address.children.city === profile.address.city; // true
```

The map does not contain a second set of nodes: its entries are the exact nodes already exposed
directly. It is useful when code should be deliberately explicit about traversing children, or when
generic infrastructure needs the complete named-child collection.

Every key supplied by the user in the initial `form()` definition takes precedence in the public
type over ordinary node API and native callable members. This includes `value`, `reset`, `api`,
`children`, `name`, and `apply`. The only reserved exceptions are `$api` and `$field`; neither can
be declared as a child. `$api` always provides collision-safe API access, and `$field` remains the
opaque Angular binding adapter.

For example, a declared child takes precedence over `children` itself:

```ts
const response = form({
  children: field('domain value'),
  status: field(200),
});

response.children(); // 'domain value'
response.api.children.children(); // 'domain value'
response.api.children.status(); // 200
```

In ordinary application code, continue to prefer `profile.name` and `profile.address.city` over
their longer `children` paths.

## Direct members by default

Use node members directly in application code:

| Situation | Preferred style | Reason |
| --- | --- | --- |
| Read any node value | `myNode()` | Nodes are callable value signals |
| Read field or array state | `myField.valid()`, `myArray.length()` | The direct API is concise and unambiguous |
| Run a field or array operation | `myField.set(value)`, `myArray.push(value)` | Prefer the operation directly on the node |
| Read form state or run a form operation | `myForm.valid()`, `myForm.patch(value)` | Forms expose their API directly too |

Calling a form remains the preferred way to read its complete value. Call its operations and state
directly as well:

```ts
profile(); // { name: 'Marco', address: { city: 'Madrid' } }
profile.patch({ name: 'Ada' });
profile.reset();
profile.valid();
```

## .api for collisions and generic code

Every node also exposes the same members through `.api`, but ordinary application examples should
not use that longer path. It exists for two specific situations:

- a form child has the same name as an API member; or
- generic infrastructure needs one uniform object API for fields, forms, and arrays.

Domain names take precedence over direct form API members:

```ts
const settings = form({
  readonly: field(false),
  value: field('domain value'),
});

settings.readonly(); // false
settings.value(); // 'domain value'
settings.api.readonly(); // form state
settings(); // { readonly: false, value: 'domain value' }
```

Generic code can use `.api` without first narrowing the node kind:

```ts
const isNodeValid = (node: Node): boolean => {
  return node.api.valid();
};
```

A field's rarely needed leaf `patch()` is also available only through this uniform API and behaves
like `set()`; application code should normally call `field.set(value)`.

The name `api` is also a valid child name. `$api` is the reserved, collision-safe escape hatch:

```ts
const response = form({ api: field('v2') });

response.api(); // 'v2'
response(); // { api: 'v2' }
response.$api.valid(); // collision-safe form state
```

Do not use `$api` merely because it exists. Reserve it for infrastructure requiring a guaranteed
path or for a form that actually declares an `api` child. The `$api` property is supported and not
scheduled for removal; its deprecation annotation only keeps it less prominent in autocomplete.

## Parent, root, and path

Every node exposes reactive tree-location signals:

```ts
profile.address.city.keyInParent(); // 'city'
profile.address.city.parent(); // profile.address
profile.address.city.form(); // profile
profile.address.city.root(); // profile
profile.address.city.path(); // ['address', 'city']
```

- A root node has `parent() === null` and path `[]`.
- `form()` returns the nearest explicit `form()` workflow. A nested form returns itself, and every
  descendant resolves that nested form until another explicit form begins.
- A standalone field, group, or array has `form() === null`.
- `root()` returns the complete structural root and therefore never returns `null`. A standalone
  node returns itself, including a standalone field, group, form, or array.
- Array item paths use decimal string segments such as `['people', '0', 'name']`.
- Moving an array item updates its path without recreating the node.
- Detaching an array item clears its parent and path; a retained reference becomes its own root and
  remains independently usable. Attaching or reparenting it updates both lookups immediately.

An explicit nested form separates workflow ownership from structural ownership. This complete
example also covers standalone fields, groups, and arrays:

<CodeBlock language="ts" title="ancestry-lookups.example.ts">{ancestryLookupsSource}</CodeBlock>

Both signals are stable and reactive, so validators and effects can observe a node being attached,
detached, or moved. Validator callbacks receive the same `form()` and `root()` signals.

## Function property names

Native JavaScript function members such as `name`, `apply`, `call`, and `length` are hidden from node IntelliSense. A form may use those names for children, and the child remains available normally:

```ts
const command = form({
  name: field('deploy'),
  apply: field(false),
});

command.name(); // 'deploy'
command.apply(); // false
```

This hiding affects the public type only; node callability and the documented API remain unchanged.
