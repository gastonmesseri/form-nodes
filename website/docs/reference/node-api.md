---
title: Node API
---

# Node API {#node-api}

This reference groups the public signals and operations available on fields, forms, and arrays. Exact value and parent types remain inferred from the node tree.

For constructor signatures, options, and primitive-specific examples, see [`form()`](./form.md),
[`field()`](./field.md), and [`array()`](./array.md).

Calling a node directly—such as `profile.name()` or `profile()`—is the preferred committed-value
read. Use `controlValue()` only when the immediate, potentially debounced value owned by a bound
control is specifically needed. The [Values and state](../concepts/values-and-state.md#alternative-value-access)
page documents the explicit alternative paths for generic infrastructure.

Use direct members for actions and state on every node: `name.set()`, `items.push()`,
`profile.patch()`, and `profile.valid()`. The [Tree navigation and API access](../concepts/tree-and-api.md)
guide documents `.api` only for name collisions and generic infrastructure.

## 🧭 API map {#api-map}

| Node concern | Details |
| --- | --- |
| Values, reset, parent, and path | [Shared value and tree API](#shared-value-and-tree-api) |
| Errors, validity, constraints, and pending state | [Validation API](#validation-api) |
| Touched, dirty, disabled, readonly, and hidden | [Interaction and availability API](#interaction-and-availability-api) |
| Form children, patching, debounce, focus, and submission | [Form-specific API](#form-specific-api) |
| Array items, collection helpers, and structural operations | [Array-specific API](#array-specific-api) |
| Concrete rendered controls | [Binding API](#binding-api) |

## 🌳 Shared value and tree API {#shared-value-and-tree-api}

| Member | Description |
| --- | --- |
| `myNode()` | Preferred read of the current committed value |
| `nodeType()` | Stable primitive discriminant: `'field'`, `'group'`, `'form'`, or `'array'` |
| `controlValue()` | Immediate value of a directly bound control; it may differ during debounce |
| `set(value)` | Assigns a complete value |
| `update(updater)` | Computes and assigns a complete value |
| `reset()` / `reset(value)` | Clears interaction state, optionally replacing the value |
| `form()` | Nearest explicit form workflow, or null when none owns the node |
| `root()` | Complete structural root; every standalone root returns itself |
| `parent()` | Direct parent or null at the root |
| `path()` | Reactive string path from the root |
| `keyInParent()` | Property name, array index, or null |

Forms and arrays additionally expose `patch()`, aggregate `flush()`, `debouncing()`, and subtree
`focus()`. Use `set()` rather than patching a leaf field.

`nodeType()` returns a precise literal for statically known nodes and the complete union for a
generic node. This is useful when generic infrastructure needs to branch by primitive without
testing for incidental members:

```ts
if (node.nodeType() === 'array') {
  // Handle an array node.
}
```

On forms and groups, a child named `nodeType` can shadow the direct method. Use
`myForm.$api.nodeType()` when code must be collision-safe.

## ✅ Validation API {#validation-api}

| Member | Description |
| --- | --- |
| `validators()` | Current normalized validator collection |
| `setValidators(source)` | Replaces validators |
| `errors()` | Errors owned directly by this node |
| `allErrors()` | Own and descendant errors |
| `getError(kind)` | First own error of a kind |
| `valid()` / `invalid()` | Aggregated validity |
| `pending()` | Current asynchronous validation state |
| `validationStatus()` | `'valid'`, `'invalid'`, or `'unknown'` while pending without errors |
| `required()` | Whether active validators require a value |

Fields also expose constraint metadata through `min()`, `max()`, `minLength()`, `maxLength()`, and `pattern()`.

## 👆 Interaction and availability API {#interaction-and-availability-api}

| Signals | Operations |
| --- | --- |
| `touched()` / `untouched()` | `markAsTouched()`, `markAsUntouched()` |
| `dirty()` / `pristine()` | `markAsDirty()`, `markAsPristine()` |
| `disabled()` / `enabled()` | `disable(message?)`, `enable()` |
| `readonly()` / `writable()` | `markAsReadonly()`, `markAsWritable()` |
| `hidden()` / `visible()` | `hide()`, `show()` |
| `submitting()` | Readonly submission state |
| `debouncing()` | `flush()` |

`disabledReasons()` lists inherited and local causes with their source nodes.

## 🧩 Form-specific API {#form-specific-api}

| Member | Description |
| --- | --- |
| `children` | Stable readonly map of named child nodes |
| `get(key)` | Reads a child by runtime key, or returns `undefined` |
| `add(...)` / `remove(key)` | Explicitly attaches or detaches runtime children |
| `patch(value)` | Recursively updates supplied branches |
| `submit()` | Runs configured submission behavior and returns `Promise<boolean>` |

Initially declared children are also direct properties. Runtime children are deliberately
available only through the node returned by `add()`, `get(key)`, which lets
TypeScript and Angular reject misspelled direct properties.

## 📚 Array-specific API {#array-specific-api}

| Member | Description |
| --- | --- |
| `items()` / `length()` | Reactive item collection and size |
| `[index]` / `at(index)` | Reads an item node |
| `push(value?)` / `insert(index, value?)` | Creates an item from the template |
| `removeAt(index)` / `clear()` | Removes items |
| `moveUp(index)` / `moveDown(index)` | Moves one position |
| `move(from, to)` / `swap(a, b)` | Reorders nodes without recreating them |
| `patch(values)` | Positionally patches existing items |

Arrays are iterable and expose `forEach`, `map`, `filter`, `find`, `findIndex`, `some`, `every`, `includes`, and `indexOf` over item nodes.

## 🔌 Binding API {#binding-api}

A `FormNode<TNode>` obtained through `viewChild()` exposes:

| Member | Description |
| --- | --- |
| `node()` | Currently bound typed node |
| `errors()` | Node errors relevant to this concrete binding |
| `element` | Host element |
| `injector` | Host injector |
| `focus()` | Focuses this concrete control |
| `flush()` | Commits this binding's pending control value |
| `reset()` | Resets this binding and its current node |

Import public APIs only from `@ngblocks/form-nodes`. `_FormNode` is exported solely for Angular AOT/linker infrastructure and is not an application API.

For compatibility with Angular `model()`, `ControlValueAccessor`, `NgControl`,
and native controls, see [Advanced custom controls](../guides/custom-controls-advanced.md#angular-api-compatibility).
For scheduling, detached-node lifetime, multiple bindings, and defensive runtime behavior, see
[Advanced behavior and edge cases](../advanced/behavior-details.md).
