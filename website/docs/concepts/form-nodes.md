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
const name = field('Marco');

name();
name.value();
name.api.value();
name.set('David');
name.touched();
name.markAsTouched();
```

The three value reads are equivalent. Prefer `name()` in ordinary application code; use
`name.value()` or `name.api.value()` when explicitly naming the signal makes generic code easier to
understand. `controlValue()` has different semantics and represents an immediate value buffered
from a bound UI control before debounce completes.

Aggregate state is derived from descendants. A form becomes invalid when one of its descendants
is invalid, while `errors()` remains scoped to errors owned directly by the current node. Use
`allErrors()` to collect errors from the complete subtree.
