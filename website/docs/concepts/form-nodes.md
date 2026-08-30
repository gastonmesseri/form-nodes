---
title: Form nodes
---

# Form nodes

Gem Forms represents every part of a form as a node:

- `field()` creates a leaf value.
- `form()` combines named child nodes into an object value.
- `array()` manages an ordered collection of repeated node definitions.

## Think of a field as a signal with form features

Conceptually, `field()` starts from the same value-access pattern as a normal writable Angular
`signal()`: call it to read its current value, and use `set()` or `update()` to change that value.

```ts
const angularName = signal('Marco');

angularName(); // 'Marco'
angularName.set('David');

const formName = field('Marco');

formName(); // 'Marco'
formName.set('David');
formName.update(name => name.toUpperCase());
```

The difference is that a field is also a form node. In addition to signal-style value access, it
provides validation, errors, touched and dirty state, disabled/readonly/hidden state, reset,
debounce, focus, tree navigation, and Angular control binding. A normal `signal()` that stores the
same value does not provide those form behaviors.

This mental model also applies to `form()`, `group()`, and `array()`: each primitive is callable to
read its aggregate committed value and exposes `set()` and `update()`, while adding the structural
and state behavior appropriate to that node kind.

**Calling the node itself is the preferred way to read its committed value.**

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
