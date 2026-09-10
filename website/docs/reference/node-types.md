---
title: Node types
description: Reference for concrete and generic Form Nodes model types, component inputs, and common API access.
---

import CodeBlock from '@theme/CodeBlock';
import NodeTypesExample from '!!raw-loader!../../examples/node-types.typecheck.ts';
import GenericNodeApiExample from '!!raw-loader!../../examples/generic-node-api.example.ts';
import ConcreteNodeTypesExample from '!!raw-loader!../../examples/concrete-node-types.typecheck.ts';

# Node types {#node-types}

Import these types from `@ngblocks/form-nodes` with `import type` or an inline `type` import.
They describe existing nodes; they are not constructors or Angular dependencies. Create nodes
with [`field()`](./field.md), [`group()`](./group.md), [`form()`](./form.md), and [`array()`](./array.md). Let those factories infer types when you own
the declaration, and use explicit types for reusable functions, component inputs, and contracts.

## Choose a type {#choose-a-type}

| What the consumer knows | Type | API access |
| --- | --- | --- |
| Only that the value is a node | [`AnyNode`](#any-node) | `$api` |
| Common direct members are not shadowed by children | [`DynamicNode`](#dynamic-node) | Direct members, `.$api`, or `$api` |
| Field value type | [`FieldNode<TValue>`](#field-node) | Direct field members |
| Group child structure | [`GroupNode<TChildren>`](#group-node) | Inferred children and group members |
| Form child structure | [`FormNode<TChildren>`](#form-node) | Inferred children and form members |
| Array item node type | [`ArrayNode<TItem>`](#array-node) | Array operations and typed items |
| Field category, unspecified value | [`FieldNode`](#field-node) | Direct field members |
| Group category, unspecified children | [`GroupNode`](#group-node) | `$api` |
| Form category, unspecified children | [`FormNode`](#form-node) | `$api`, including `submit()` |
| Array category, unspecified items | [`ArrayNode`](#array-node) | Direct array members; item operations through `$api` |

For concrete groups and forms, a child can shadow a direct API member. Use `.$api` when that
known declaration needs it, or `$api` when even `api` may be a child. See
[Tree navigation and API access](../concepts/tree-and-api.md#api-for-collisions-and-generic-code).

## FieldNode {#field-node}

```ts
FieldNode<TValue = any, TParent = AnyNode>
```

Describes one field. `TValue` is its complete value type, including `null` or `undefined` when
those values are allowed. It can be a scalar, object, date, or array; an array-valued field
does not become an [`ArrayNode`](./types/array-node.md).

For example, `field('Marco')` infers [`FieldNode<string | null>`](./types/field-node.md), while `field.strict('Marco')`
infers `FieldNode<string>`. A `FieldNode<string>` input requires the non-nullable contract.
Omit the generic argument (`FieldNode`) to accept fields with unrelated value types. Its value
becomes `any`, so reads and writes no longer enforce a specific value shape. It still accepts
only fields, not forms, groups, or arrays.

Calling the node returns `TValue`. Direct state and actions include `valid()`, `set()`,
`reset()`, and `markAsTouched()`. Leaf `patch()` is available through the API access paths.
See the [`field()` reference](./field.md) for options and the full member list.

## GroupNode {#group-node}

```ts
GroupNode<TChildren = never, TParent = AnyNode>
```

Describes an object-shaped group. `TChildren` maps child names to **node types**, not raw value
types: `{ city: FieldNode<string | null> }` describes a group containing a nullable city field.
The group's value is computed from its children and retains their value types.

Groups provide structural and shared state operations but do not own an independent submission
workflow. Both `group({ ... })` and structural object shorthand create group nodes. Use explicit
`group()` when configuring group validators or options, or when teaching the primitive itself.
Without generic arguments, [`GroupNode`](./types/group-node.md) describes unspecified children, not an empty group.
**Use `$api` for state and operations**, because child names may shadow direct members. Child
enumeration exposes [`AnyNode`](./types/any-node.md); no direct child names are invented. `GroupNode<{}>` explicitly
describes an empty declared structure. See the [`group()` reference](./group.md).

## FormNode {#form-node}

```ts
FormNode<TChildren = never, TParent = AnyNode>
```

Describes a node created by `form()`. As with `GroupNode`, `TChildren` maps names to child node
types. A form additionally owns the submission workflow and exposes `submit()`.
Nested `form()` declarations are also `FormNode` instances; the type does not mean that a node
has no parent.

Without generic arguments, `FormNode` accepts root and nested forms with unspecified children.
**Use `$api` for state and operations**, including `node.$api.submit()`. Child enumeration exposes
`AnyNode`. `FormNode<{}>` explicitly describes an empty declared structure.

**`FormNode` means a form specifically; `AnyNode` accepts every primitive.**

`FormNode` is a **model type**. For Angular template imports and directive queries, use
[`FormNodeDirective`](./form-node-binding.md). See the [`form()` reference](./form.md)
for options and operations.

## ArrayNode {#array-node}

```ts
ArrayNode<TItem = AnyNode, TParent = AnyNode>
```

Describes a collection of item nodes. `TItem` is a **node type**, such as a group representing
one contact, or `FieldNode<number | null>` for numeric field items. It is not the raw item value
and it is not an array type.

`ArrayNode<GroupNode<{ email: FieldNode<string | null> }>>` describes object items.
`ArrayNode<FieldNode<number | null>>` describes numeric field items. The collection's value is
an array of the item values, and operations such as `at()` and `push()` preserve the item shape.
Omit the generic argument (`ArrayNode`) to accept arbitrary item and ancestor types, including
arrays nested under forms or groups. It exposes array operations directly and types its items
as `AnyNode`; use `item.$api` for their operations. Its value is `any[]`. Reading an index or
calling `at()` may return `undefined` when the item does not exist.
See the [`array()` reference](./array.md).

The `never` default in form and group signatures selects the unspecified view. It does not mean
that these nodes contain no values or children. Supply a child or item type to retain precision.

## Concrete types and parent inference {#concrete-types}

The second parameter on concrete node types is the parent node type. Factories and parent
composition infer it for attached children. You usually do not need to spell it out.
Use `typeof myForm.child` when a consumer must preserve the exact attached node type, including
its ancestry. A hand-written type with an omitted parent does not necessarily preserve those
navigation details, particularly for arrays.

<CodeBlock language="ts" title="concrete-node-types.typecheck.ts">{ConcreteNodeTypesExample}</CodeBlock>

For contracts expressed in raw values instead of child nodes, use
[`FormValueContract<TValue>`](./form-value-contract.md). To extract a node's value type, use
[`FormNodeValue<TNode>`](./form-node-value.md).

## AnyNode {#any-node}

`AnyNode` is the common callable contract for all four primitives. It has no generic parameters.
It accepts nodes with unknown child names, including nested and detached nodes. Its value type
is unspecified (`any`); retain the inferred or concrete type when value precision matters.

**Use `myAnyNode.$api` for state and operations.** Names such as `reset`, `valid`, and even `api`
can refer to children on a form or group. `$api` always refers to the node API. Calling the node
itself still reads its value.

TypeScript may suggest function members such as `call`, `apply`, `bind`, `name`, and `length`.
They are not a reliable generic node API. Hiding them with private type members would exclude
valid nodes that override those names, including arrays with a public `length()` signal.

[`isFormNode(value)`](./is-form-node.md) accepts `unknown` and narrows it to `AnyNode`.
It checks identity, not a particular primitive kind, value type, or absence of name collisions.

## DynamicNode {#dynamic-node}

`DynamicNode` has no generic parameters. It exposes the shared state and actions directly,
including `valid()`, `touched()`, `set()`, `reset()`, and `markAsTouched()`, plus `.$api` and `$api`.
The direct surface omits `patch()`, since leaf patching uses the API access paths. Native callable
members are hidden. Category-specific actions such as form submission or array insertion
require a category-specific type.

**Use this view when you know the declaration does not shadow its members.** It is not a
wrapper, a collision detector, or a way to make a shadowed method callable. Do not assert an
arbitrary `AnyNode` as `DynamicNode` just to bypass a type error. Prefer `$api` for nodes from
declarations you do not control, including nodes obtained through runtime lookup.

<CodeBlock language="ts" title="generic-node-api.example.ts">{GenericNodeApiExample}</CodeBlock>

## Component inputs {#component-inputs}

An input signal wraps the node. In these examples, `node()` reads the input and obtains the node;
`node()()` would read that node's value. Choose `AnyNode` for shared status and a category-specific
type only when the component needs that category's operations.

<CodeBlock language="ts" title="node-types.typecheck.ts">{NodeTypesExample}</CodeBlock>

## Related API and binding types {#related-types}

| Type | Purpose |
| --- | --- |
| `NodeApi` | Common state and operations object, accessed through `$api` |
| `FieldApi<TValue>`, `GroupApi<TChildren>`, `FormApi<TChildren>`, `ArrayApi<TItem>` | Primitive-specific API objects |
| [`FormNodeBinding<TNode>`](./form-node-binding.md) | A rendered binding with its host element and node signal |
| [`FormNodeDirective<TNode>`](./form-node-binding.md) | The public directive instance view; its value is used in Angular imports and queries |

All node views expose optional `message` (`string | undefined`) and binding-specific `formNode`
on errors returned by `errors()`, `allErrors()`, and `getError()`. This includes `AnyNode.$api`
and the direct `DynamicNode` API. A message can be absent on a custom error.

Error entries and `getError()` results retain the selected node category in `targetNode`,
including when generic arguments are omitted.

Node types belong in TypeScript annotations. `FormNodeDirective` or
[`FormNodesModule`](./form-nodes-module.md) belongs in Angular component `imports`.

## NodeValueSignal

`NodeValueSignal<TValue, TSet = TValue>` describes the nested `value` facade shared by all node kinds.
It is an Angular signal with `committed` and `control` signals, each exposing a complete-value
`set()` method. See [value views](./node-value.md) for signatures, examples, equality, and debounce.

Bare `FieldNode` annotations preserve `value.committed()` and `value.control()` with `any` values.
Use `FieldNode<TValue>` to preserve a known value type. The three value signals hide native
function members in IntelliSense; see the [typed example](./node-value.md#explicit-fieldnode-annotations-and-intellisense).

## CallableNodeApi

`CallableNodeApi<TApi>` combines an API contract with `Signal<ReturnType<TApi['value']>>`.
Node `$api` properties use this callable facade. It preserves
precise value and setter types while preventing children from overwriting operations.
See [callable API reads and examples](./node-api.md#callable-api).

Browse [Public types](./types/index.md) for a dedicated page for every exported type, including exact declarations, generic parameters, and related contracts.
