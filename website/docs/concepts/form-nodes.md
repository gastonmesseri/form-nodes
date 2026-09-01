---
title: Form nodes
---

# Form nodes

Gem Forms represents every part of a form as a node:

- `field()` creates a leaf value.
- `form()` combines named child nodes into an object value.
- `array()` manages an ordered collection of repeated node definitions.

Nodes are callable signals. **Calling the node itself is the preferred way to read its committed
value.** Nodes also provide actions such as `set()`, `update()`, `reset()`, `markAsTouched()`, and
`disable()`.

```ts
const myForm = form({
  name: field('Marco'),
});

myForm.name(); // 'Marco'
myForm.name.set('David');
myForm.name.touched();
myForm.name.markAsTouched();
```

`controlValue()` has different semantics and represents an immediate value buffered from a bound
UI control before debounce completes. The [Values and state](./values-and-state.md) page documents
the explicit alternative value paths for generic infrastructure.

Aggregate state is derived from descendants. A form becomes invalid when one of its descendants
is invalid, while `errors()` remains scoped to errors owned directly by the current node. Use
`allErrors()` to collect errors from the complete subtree.
