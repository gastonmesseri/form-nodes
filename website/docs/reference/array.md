---
title: array()
---

# `array()`

`array()` creates a dynamic collection of independently cloned nodes. Prefer a form template for
object items—the most common form use case:

For the difference between an array node and an array-valued field, see
[Choosing a primitive](../guides/choosing-a-primitive.md).

```ts
import { array, field, form } from '@gem/ng-forms';

const myForm = form({
  people: array({
    name: field(''),
    age: field(18),
  }, {
    initialValue: [{ name: 'Mark', age: 50 }],
    trackBy: 'name',
  }),
});
```

Each item is its own form node. A primitive collection uses a field template:

```ts
const myForm = form({
  tags: array(field(''), {
    initialValue: ['angular', 'signals'],
  }),
});
```

## Signatures

```ts
array(templateOrFactory);
array(templateOrFactory, initialValue);
array(templateOrFactory, initialValue, options?);
array(templateOrFactory, initialValue, validators, options?);
array(templateOrFactory, options);
array(templateOrFactory, validators, options?);
```

`initialValue` accepts an item-value array, a non-negative item count, `null`, or `undefined`.
Nullish values normalize to `[]`; an array node itself is never nullable.

```ts
const myForm = form({
  attendees: array({
    name: field(''),
    confirmed: field(false),
  }, {
    initialValue: 3,
  }),
});
```

An explicit factory is available when construction must be deferred:

```ts
const myForm = form({
  rows: array(() => form({
    label: field(''),
  })),
});
```

The factory must return a fresh node each time.

## Options

Arrays accept the form options described in [`form()`](./form.md), plus:

| Option | Accepted value | Purpose |
| --- | --- | --- |
| `initialValue` | item-value array, non-negative count, or `null` | Creates the initial items |
| `trackBy` | item property name or `(value, index) => key` | Preserves logical item identity during reconciliation |

Do not provide `initialValue` both positionally and inside options; TypeScript intentionally rejects
that ambiguity.

## Reading values and items

```ts
myForm.people(); // [{ name: 'Mark', age: 50 }]
myForm.people.items();    // readonly live item nodes
myForm.people.length();
myForm.people.at(0);
myForm.people[0]?.name(); // 'Mark'
```

Arrays are iterable over nodes, not values. They also expose `forEach`, `map`, `filter`, `find`,
`findIndex`, `some`, `every`, `includes`, and `indexOf` as node-oriented conveniences.

```ts
for (const person of myForm.people) {
  console.log(person.name());
}

const adultNodes = myForm.people.filter(person => (person.age() ?? 0) >= 18);
```

In Angular templates, track the node to preserve DOM and control bindings while reordering:

```html
@for (person of myForm.people; track person) {
  <input [formNode]="person.name" />
}
```

## Structural operations

```ts
myForm.people.push();
myForm.people.push({ name: 'Lia', age: 28 });
myForm.people.insert(1, { name: 'Noa', age: 34 });
myForm.people.removeAt(0);
myForm.people.moveUp(2);
myForm.people.moveDown(0);
myForm.people.move(3, 1);
myForm.people.swap(0, 2);
myForm.people.clear();
```

`push()` and `insert()` without a value use the template defaults. Reordering preserves the exact
node instances, including interaction state, validation state, and pending work. Invalid insertion
or movement indexes throw `RangeError`; `removeAt()` returns `undefined` for a missing index.

Structural operations are programmatic and do not mark the array dirty automatically.

## Complete and partial value updates

`set()` and `update()` reconcile the complete collection. `patch()` updates existing items by
position without changing the structure.

```ts
myForm.people.set([
  { name: 'Ada', age: 36 },
  { name: 'Grace', age: 44 },
]);

myForm.people.update(people => [
  ...people,
  { name: 'Linus', age: 32 },
]);

myForm.people.patch([
  { age: 37 },
  { name: 'Grace Hopper' },
]);
```

Sparse patch entries are skipped, extra indexes are ignored with a warning, and existing nodes are
not recreated. Passing `null` or `undefined` to `set()`, returning it from `update()`, or supplying
it to `reset(value)` clears the array.

## Reconciliation and `trackBy`

Without `trackBy`, complete updates reuse nodes by index. Use a stable domain key when server data
can be reordered or replaced with new objects:

```ts
const myForm = form({
  people: array({
    id: field(''),
    name: field(''),
  }, {
    initialValue: [
      { id: 'ada', name: 'Ada' },
      { id: 'grace', name: 'Grace' },
    ],
    trackBy: 'id',
  }),
});
```

A callback supports computed or composite identities:

```ts
const people = array({
  organizationId: field(''),
  id: field(''),
  name: field(''),
}, {
  initialValue: initialPeople,
  trackBy: person => `${person.organizationId}:${person.id}`,
});
```

Matching keys retain nodes and their state while paths update. New keys create nodes, absent keys
detach nodes, and duplicate keys throw before mutation.

## State and validation

An array aggregates value, validity, pending, touched, dirty, and submission state from its current
items. Its own validators receive the complete value array. `errors()` reports only array-owned
errors; `allErrors()` includes item descendants.

`reset()` recursively clears interaction state. `markAsDirty()` and `markAsPristine()` affect only
the array's own stored state, so a dirty item can keep the aggregate array dirty. `markAsTouched()`
touches current descendants unless `{ skipDescendants: true }` is supplied.

See [Dynamic arrays](../guides/dynamic-arrays.md), the [reorderable-array recipe](../cookbook/reorderable-arrays.md),
and the [shared Node API](./node-api.md).
