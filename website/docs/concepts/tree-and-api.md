---
title: Tree navigation and API access
---

import CodeBlock from '@theme/CodeBlock';

import ancestryLookupsSource from '!!raw-loader!../../examples/ancestry-lookups.example.ts';
import validatorAncestrySource from '!!raw-loader!../../examples/validator-ancestry.typecheck.ts';
import validatorFieldSignalSource from '!!raw-loader!../../examples/validator-field-signal.example.ts';
import inlineValidatorNodesSource from '!!raw-loader!../../examples/inline-validator-nodes.typecheck.ts';

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

A field's rarely needed leaf `patch()` is exposed in the public types only through this uniform API and behaves
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
detached, or moved. Validators access those signals through `ctx.node().form()` and `ctx.node().root()`.

### Navigation inside validators

`ctx.node` and `ctx.field` are the same readonly signal. Both return the validated node and never
return `null`. Prefer `ctx.node()` when writing validation that can apply to different primitives.

| Access | Result |
| --- | --- |
| `ctx.node()` or `ctx.field()` | The validated node |
| `ctx.node().form()` | Nearest explicit form workflow, or `null` |
| `ctx.node().root()` | Complete structural root; never `null` |
| `ctx.parent()` | Direct parent, or `null` |
| `ctx.value()` | Committed value with its inferred type |
| `ctx.node().touched()` / `ctx.node().dirty()` | Interaction state of the validated node |

There are no flat `ctx.form()` or `ctx.root()` properties. Read a value with `ctx.value()`, or use
`ctx.node().value()` / `ctx.field().value()` when accessing it through the node. The node signal
and its result stay stable across value changes and tree moves. Reading only `ctx.node()` does
not subscribe to the value; read the returned node's value, state, or ancestry to track it.

Interaction, availability, required, and submission signals live on the node. Use
`ctx.node().touched()`, `ctx.node().disabled()`, or `ctx.node().submitting()` instead of flat context
properties. This applies to synchronous validators and every `asyncValidator()` callback.

### Inline node inference

An inline validator knows the primitive being created. A field validator receives `Field<TValue>`;
a form or group validator retains its declared children; an array validator retains its item type.
This works for positional validators, `options.validators`, configured primitives, and inline
`validator()` / `asyncValidator()` helpers. Omit helper type arguments to let the enclosing
primitive infer both the value and the node. Explicit generics on the primitive, such as
`field.strict<string>('')`, still preserve this inference.

<CodeBlock language="ts" title="inline-validator-nodes.typecheck.ts">{inlineValidatorNodesSource}</CodeBlock>

A validator declared separately cannot acquire its future owner's type retroactively. Its node
uses the common field/form/group/array API union unless an exact node type is supplied explicitly.
Likewise, specifying only a helper's value generic uses its default owner type; omit the helper's
generics for inline inference, or supply its owner generic explicitly. Common members are
available on the union; operations unique to a primitive require narrowing.

Knowing the validated node does not infer the enclosing form's parents or sibling keys. Access
through the declared tree or an explicitly specialized context retains those exact relationships.
Access an API alias through `ctx.node().api` or `ctx.field().api`; its type follows the node.
Validators should normally read state and return errors rather than submit or mutate their node.

<CodeBlock language="ts" title="validator-ancestry.typecheck.ts">{validatorAncestrySource}</CodeBlock>

This executable example verifies both aliases, stable signal identity, and separate value tracking:

<CodeBlock language="ts" title="validator-field-signal.example.ts">{validatorFieldSignalSource}</CodeBlock>

The same context is available to synchronous and asynchronous validators, including `when`,
`params`, `validate`, and `onError`. Async execution adds `abortSignal`; parameterized execution
also adds `params`.

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
