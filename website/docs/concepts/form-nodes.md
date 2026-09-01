---
title: Form nodes
---

# Form nodes

Gem Forms represents every part of a form as a node:

- `field()` creates a leaf value.
- `form()` combines named child nodes into an object value.
- `array()` manages an ordered collection of repeated node definitions.

Nodes expose their value as a signal and provide actions such as `set()`, `update()`, `reset()`,
`markAsTouched()`, and `disable()`.

```ts
const name = field('Marco');

name();
name.set('David');
name.touched();
name.markAsTouched();
```

Aggregate state is derived from descendants. A form becomes invalid when one of its descendants
is invalid, while `errors()` remains scoped to errors owned directly by the current node. Use
`allErrors()` to collect errors from the complete subtree.
