---
title: Dynamic arrays
---

# Dynamic arrays

An `array()` owns an ordered collection of cloned node templates:

```ts
const people = array(
  {
    id: field('', { nullable: false }),
    name: field('', { nullable: false }),
  },
  [{ id: '1', name: 'Ada' }],
  { trackBy: 'id' },
);
```

## Reading items

Read values by calling the array and nodes through indexes, `at()`, `items()`, iteration, or familiar helpers:

```ts
people();
people[0]?.name();
people.at(0)?.name();
people.items();
people.map(person => person.name());

for (const person of people) {
  console.log(person.name());
}
```

`items()` is a signal whose array reference changes when structure changes. Its nodes are live and readonly as a collection.

## Add and remove items

```ts
const created = people.push({ id: '2', name: 'Grace' });
people.insert(0, { id: '0', name: 'Lin' });
const removed = people.removeAt(1);
people.clear();
```

Omit the value from `push()` or `insert()` to use the template defaults.

## Reorder items

Structural operations preserve node identity, interaction state, validation state, and pending work:

```ts
people.moveUp(2);
people.moveDown(0);
people.move(3, 1);
people.swap(0, 2);
```

Paths and indexes update after each operation.

## Complete reconciliation

`set()` and `update()` reconcile a complete value. Without `trackBy`, current nodes are reused by index:

```ts
people.set([
  { id: '2', name: 'Grace Hopper' },
  { id: '1', name: 'Ada Lovelace' },
]);
```

Use a stable property or callback when values can be reordered or replaced from a server:

```ts
const people = array(personTemplate, initialPeople, { trackBy: 'id' });

const keyed = array(personTemplate, initialPeople, {
  trackBy: person => person.id,
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
