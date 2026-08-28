---
title: Node API
---

# Node API

This reference groups the public signals and operations available on fields, forms, and arrays. Exact value and parent types remain inferred from the node tree.

## Shared value and tree API

| Member | Description |
| --- | --- |
| `node()` | Reads the current committed value by calling the node |
| `value()` | Current committed value signal |
| `controlValue()` | Immediate value of a directly bound control |
| `set(value)` | Assigns a complete value |
| `update(updater)` | Computes and assigns a complete value |
| `reset()` / `reset(value)` | Clears interaction state, optionally replacing the value |
| `form()` | Root form or null for a standalone field |
| `parent()` | Direct parent or null at the root |
| `path()` | Reactive string path from the root |
| `keyInParent()` | Property name, array index, or null |

Forms and arrays additionally expose `patch()`, aggregate `flush()`, `debouncing()`, and subtree `focus()`. A field exposes its leaf `patch()` through `field.api`.

## Validation API

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

## Interaction and availability API

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

## Form-specific API

| Member | Description |
| --- | --- |
| `children` | Stable readonly map of named child nodes |
| `patch(value)` | Recursively updates supplied branches |
| `submit()` | Runs configured submission behavior and returns `Promise<boolean>` |

Form children are also direct properties. Prefer `form.api` for form operations. If a child is named `api`, use the guaranteed collision-safe `form.$api` path.

## Array-specific API

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

## Binding API

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

Import public APIs only from `@gem/ng-forms`. `_FormNode` is exported solely for Angular AOT/linker infrastructure and is not an application API.
