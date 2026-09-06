---
title: Dynamic arrays
---

# Dynamic arrays

For a complete program whose assertions verify keyed reconciliation and structural operations, see
the [executable array example](../examples/executable-examples.mdx#array-reconciliation-and-operations).

An `array()` owns an ordered collection of cloned node templates:

```ts
const myForm = form({
  people: array({
    name: field(''),
    age: field(18),
  }, {
    initialValue: 3,
  }),
});

const people = myForm.people;
```

`initialValue: 3` creates three independent form items from the template defaults. The initial value is:

```ts
myForm.people();
// Expected output:
// [
//   { name: '', age: 18 },
//   { name: '', age: 18 },
//   { name: '', age: 18 },
// ]
```

The options-object form keeps initial data and reconciliation configuration together. A non-negative number creates that many items from template defaults:

```ts
array(personTemplate);
array(personTemplate, {
  initialValue: initialPeople,
  trackBy: 'id',
});
array(personTemplate, {
  initialValue: 3,
});
```

The positional `array(template, initialValue)` signature remains available for concise declarations. Positional and option-based initial values are alternatives; TypeScript prevents specifying both.

## Templates and factories

A template may be a field, form, nested array, shorthand object, or explicit factory:

```ts
const myForm = form({
  tags: array(field(''), {
    initialValue: ['angular', 'signals'],
  }),
  people: array(() => ({
    name: field(''),
    age: field(0),
  })),
});
```

Object templates can also use field-value shorthand. Keep ordinary examples explicit and see
[`field()` shorthands in object templates](../reference/array.md#field-shorthands-in-object-templates)
for the concise syntax, inference, and ambiguity rules.

Declarative templates are compiled into a clone recipe. Every item receives fresh signals, descendants, validators, state, debounce ownership, and async watchers. Runtime values, touched/dirty flags, errors, pending work, parents, and paths are never shared.

The template node itself is not inserted. If application code retains it, it remains an independent live node. Use a factory when template construction itself must not start independent asynchronous work.

Compiling a template does not keep its original nodes or their parent tree alive through the clone recipe. Values, validator callbacks, and explicit injectors retain their existing identity; references held by your own configuration still apply.

A factory must return a fresh tree. Returning the same live node more than once throws rather than allowing items to share state.

## Reading items

Read values by calling the array and nodes through indexes, `at()`, `items()`, iteration, or familiar helpers:

```ts
people(); // [{ name: '', age: 18 }, { name: '', age: 18 }, { name: '', age: 18 }]
people[0]?.name(); // ''
people.at(0)?.name(); // ''
people.items();
people.map(person => person.name()); // ['', '', '']

for (const person of people) {
  console.log(person.name());
}
```

Angular templates can iterate the node directly. Track the node instance to retain rendered controls across moves:

```html
@for (person of people; track person) {
  <input [formNode]="person.name" />
}
```

Array traversal helpers snapshot `items()` when the operation begins. Structural changes made inside a callback do not alter that active traversal.

`items()` is a signal whose array reference changes when structure changes. Its nodes are live and readonly as a collection. Calling the array also produces a new value-array reference after a structural change, so `computed()` and `effect()` consumers react to `push()` and the other structural operations. Previously read item and value snapshots remain unchanged.

## Add and remove items

```ts
const created = people.push({ id: '2', name: 'Grace' });
people.insert(0, { id: '0', name: 'Lin' });
const removed = people.removeAt(1);
people.clear();
```

Omit the value from `push()` or `insert()` to use the template defaults.

New items start pristine and untouched. Structural mutations are programmatic and preserve the array's current dirty state. Removed nodes detach from parent state and validation; a retained reference remains usable as a standalone tree.

Detachment is immediate and observable. A removed node has `parent() === null`, a root path of `[]`,
and no longer contributes value, errors, pending work, touched state, or dirty state to its former
array. If the removed item is itself a form or array, its descendants remain attached to that
removed root and continue working normally.

## Reorder items

Structural operations preserve node identity, interaction state, validation state, and pending work:

```ts
people.moveUp(2);
people.moveDown(0);
people.move(3, 1);
people.swap(0, 2);
```

Paths and indexes update after each operation.

Boundary moves and same-index operations are no-ops. An index that does not identify an existing item throws `RangeError` for movement and swap operations.

Because moves preserve nodes rather than values alone, in-flight validation and current rendered
bindings remain owned by the moved item. Angular templates should continue tracking the item node,
not its current index.

## Complete reconciliation

`set()` and `update()` reconcile a complete value. Without `trackBy`, current nodes are reused by index:

```ts
people.set([
  { id: '2', name: 'Grace Hopper' },
  { id: '1', name: 'Ada Lovelace' },
]);
```

Use a stable property or callback when values can be reordered or replaced from a server:

:::warning Identity must be stable and unique

Choose `trackBy` from immutable domain identity, not the current index or another editable value.
Duplicate keys are rejected before the array mutates.

:::

```ts
const myForm = form({
  people: array(personTemplate, {
    initialValue: initialPeople,
    trackBy: 'id',
  }),
  keyedPeople: array(personTemplate, {
    initialValue: initialPeople,
    trackBy: person => person.id,
  }),
});
```

Matching keys reuse and move existing nodes. Keys must be unique among current and incoming items; duplicates throw before mutation.

Passing `null` or `undefined` to `set()`, returning it from `update()`, or supplying it to `reset(value)` clears the collection. The observable array value itself remains `[]`, never nullish.

## Positional patching

`patch()` partially updates existing nodes by index without resizing the array:

```ts
people.patch([{ name: 'Ada Byron' }]);
people.patch([, { name: 'Grace Murray Hopper' }]);
```

Sparse positions are skipped. Values beyond the current structure are ignored with a warning. Use `set()` for complete reconciliation and structural methods for explicit collection changes.

## State aggregation

Array validity, errors, dirty, touched, disabled, readonly, hidden, pending, debouncing, focus, and reset behavior aggregate or propagate like forms. Removed items detach from that aggregation immediately.

See [Advanced behavior and edge cases](../advanced/behavior-details.md#ownership-and-lifetime) for
retained removed nodes, stale async reconciliation work, and identity-related edge cases.
