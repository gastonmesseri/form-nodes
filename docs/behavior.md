# Behavior reference

This document records the implemented behavior of the library. It is intended to become the source for complete public documentation and should evolve with the code and tests.

## Core primitives

- `field()` creates a leaf node that stores one value.
- `form()` creates a container node from fields, explicit nested forms, or shorthand nested objects.
- A shorthand object is normalized to an ordinary nested form without validators or options.
- Use an explicit nested `form()` when that level needs validators or options.
- Both primitives can be created and used without an Angular injection context.

## Values

- Calling a field returns its current value.
- Calling a form returns an object containing the current value of every descendant.
- `set()` requires the complete value for its node and marks affected fields as dirty.
- `patch()` accepts partial form values and only updates the supplied branches.
- `reset()` without a value preserves values and clears touched and dirty state.
- `reset(value)` assigns the supplied value and clears touched and dirty state.
- Values remain readable and programmatically writable while a node is disabled, readonly, or hidden.

## State sources

The `disabled`, `readonly`, and `hidden` options accept:

- A boolean initial state.
- An Angular `Signal<boolean>`, including a computed signal.
- A function returning a boolean.

Functions are evaluated inside Angular `computed()` state. Signals read by a function are therefore tracked automatically:

```ts
const formGroup = form({
  age: field(17),
  guardian: field('', undefined, {
    hidden: (): boolean => formGroup.age() >= 18,
  }),
});
```

Under TypeScript `strict` mode, a function that references the `const` being initialized needs an explicit return type to break the circular inference. Functions that only read previously declared signals do not need this annotation:

```ts
const age = signal(17);

const guardian = field('', undefined, {
  hidden: () => age() >= 18,
});
```

A boolean initializes the node's mutable own state. An action such as `enable()`, `markAsWritable()`, or `show()` can clear that state. A signal or function is a continuing configured condition, so an action cannot override it while it evaluates to `true`.

## State inheritance

- A node is disabled when it is disabled by its own mutable state, its configured source, or its parent.
- A node is readonly when it is readonly by its own mutable state, its configured source, or its parent.
- A node is hidden when it is hidden by its own mutable state, its configured source, or its parent.
- State propagates from parent to descendants, never from children to their parent.
- A child's own state is preserved when a parent enters and leaves the same state.

## Non-interactive nodes

A node is non-interactive while it is disabled, readonly, or hidden.

- Validation is skipped and the node is considered valid.
- Public touched and dirty state is reported as false.
- Existing touched and dirty state is preserved and becomes observable again when the node becomes interactive.
- `markAsTouched()` is ignored while the node is non-interactive.
- Dirty state can still be recorded by programmatic value changes or `markAsDirty()` and becomes observable when the node is interactive again.

## Validation

- Validators run against the current node value.
- Multiple validation error objects are merged.
- A form is valid when its own validators pass and all interactive descendants are valid.
- Validators are reevaluated when their tracked values or validator collections change.

## Structural relationships

- Every nested node keeps a reactive reference to its parent.
- Inherited state is computed by reading the parent rather than manually copying state into descendants.
- Runtime-only structural operations are omitted from public API types and prefixed with `_`.
