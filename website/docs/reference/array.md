---
title: array()
---

# `array()`

`array()` creates a dynamic collection of independently cloned nodes. It is not required merely
because a value is an array. When one control owns the complete array—for example, a multi-select—
use a normal array-valued `field()` instead. Choose `array()` when items need independent nodes,
bindings, validation state, or structural operations.

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

## API map

| I want to… | Start with | Details |
| --- | --- | --- |
| Choose a template and initial items | `array(template, ...)` | [Signatures](#signatures) and [options](#options) |
| Read values, nodes, or array position | `myArray()`, `items()`, `myArray[index]` | [Instance shape](#instance-shape) and [value and tree properties](#value-and-tree-properties) |
| Search or iterate live item nodes | `at()`, `forEach()`, `map()`, `find()` | [Collection methods](#item-access-and-collection-methods) |
| Add, remove, move, swap, or clear items | `push()`, `removeAt()`, `move()`, `swap()` | [Structural methods](#structural-methods) |
| Replace, derive, patch, or reset values | `set()`, `update()`, `patch()`, `reset()` | [Value update methods](#value-update-methods) |
| Preserve identity across server updates | `trackBy` | [Reconciliation](#reconciliation-and-trackby) |
| Inspect aggregate state | Validation, interaction, and availability signals | [Validation](#validation-properties-and-methods), [interaction](#interaction-properties-and-methods), and [availability](#availability-properties-and-methods) |
| Commit, focus, or inspect submission state | `flush()`, `focus()`, `submitting()` | [Control and submission](#control-and-submission-properties-and-methods) |

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

Items created later from either a template or factory inherit the array's nearest injector by
default. Set `inheritInjector: false` on an item template or factory result to create a lifecycle
boundary for that item subtree.

| Option | Accepted value | Purpose |
| --- | --- | --- |
| `initialValue` | item-value array, non-negative count, or `null` | Creates the initial items |
| `trackBy` | item property name or `(value, index) => key` | Preserves logical item identity during reconciliation |

Do not provide `initialValue` both positionally and inside options; TypeScript intentionally rejects
that ambiguity.

## Instance shape

An array node is both a callable value reader and an object with signals, methods, and live item
indexes:

| Member | Description |
| --- | --- |
| `myArray()` | Returns the current committed array value. This is the preferred way to read it. |
| `myArray[index]` | Returns the live item node at `index`, or `undefined` when it does not exist. |
| `api` | Exposes the complete array API. Direct members such as `myArray.push()` are preferred unless a generic API reference is useful. |
| `$api` | Collision-safe alias of `api`, shared by every node kind. Prefer `api` in application code. |

## Value and tree properties

Every property in this section is a reactive signal and must be called to read its current value.

| Property | Description |
| --- | --- |
| `value()` | Current committed array value. Equivalent to calling the node, but the callable form is preferred. |
| `controlValue()` | Immediate value from a control bound directly to the array. It can temporarily differ from the committed value during debounce. |
| `items()` | Readonly array of the current live item nodes. Its array reference changes when the structure changes; its items are not clones. |
| `length()` | Current number of item nodes. |
| `form()` | Root form that owns the array, or the array itself when it is a root array. |
| `parent()` | Direct parent node, or `null` when the array is a root node. |
| `path()` | Property path from the root. Array indexes appear as string segments. |
| `keyInParent()` | Property name or array index under which this node is stored, or `null` at the root. |

```ts
myForm.people();          // [{ name: 'Mark', age: 50 }]
myForm.people.length();   // 1
myForm.people.at(0);      // first live person node
myForm.people[0]?.name(); // 'Mark'
myForm.people.path();     // ['people']
```

Use `items()` when a reactive readonly node list is needed. Use spread syntax or `Array.from()` to
create a mutable copy; mutating that copy does not change the form array.

## Item access and collection methods

These methods operate on item **nodes**, not on their plain values. Their callbacks receive
`(item, index, arrayNode)`.

| Method | Description |
| --- | --- |
| `at(index)` | Returns the live item node at `index`, or `undefined`. |
| `forEach(callback)` | Invokes `callback` once for each current item node. |
| `map(callback)` | Maps the current item nodes into a new plain array. |
| `filter(predicate)` | Returns a new array containing the item nodes that match. Type-guard predicates narrow the result. |
| `find(predicate)` | Returns the first matching item node, or `undefined`. Type-guard predicates narrow the result. |
| `findIndex(predicate)` | Returns the index of the first matching node, or `-1`. |
| `some(predicate)` | Returns whether at least one item node matches. |
| `every(predicate)` | Returns whether every item node matches. |
| `includes(item, fromIndex?)` | Tests whether the exact node instance is present. |
| `indexOf(item, fromIndex?)` | Returns the position of an exact node instance, or `-1`. |
| `[Symbol.iterator]()` | Makes the array node iterable with `for...of` and spread syntax. Iteration yields nodes. |

```ts
for (const person of myForm.people) {
  console.log(person.name());
}

const adultNodes = myForm.people.filter(person => (person.age() ?? 0) >= 18);
const names = myForm.people.map(person => person.name());
```

In Angular templates, track the node to preserve DOM and control bindings while reordering:

```html
@for (person of myForm.people; track person) {
  <input [formNode]="person.name" />
}
```

## Structural methods

| Method | Description |
| --- | --- |
| `push()` | Appends a fresh item initialized from the template defaults and returns its node. |
| `push(value)` | Appends a fresh item initialized with `value` and returns its node. |
| `insert(index)` | Inserts a default-initialized item at `index` and returns its node. |
| `insert(index, value)` | Inserts an item initialized with `value` at `index` and returns its node. |
| `removeAt(index)` | Removes and returns the node at `index`; returns `undefined` when no item exists there. |
| `moveUp(index)` | Moves an item one position toward the start. The first item remains in place. |
| `moveDown(index)` | Moves an item one position toward the end. The last item remains in place. |
| `move(fromIndex, toIndex)` | Moves a node to another existing index and shifts the intervening nodes. |
| `swap(firstIndex, secondIndex)` | Exchanges two existing nodes. Passing the same index twice is a no-op. |
| `clear()` | Removes every item node. |

Reordering retains the exact node instances, including their interaction state, validation state,
and pending work. Paths are updated after the move. Invalid insertion, movement, and swap indexes
throw `RangeError`.

Structural operations are programmatic and do not mark the array dirty automatically.

## Value update methods

| Method | Description |
| --- | --- |
| `set(value)` | Reconciles the complete collection using indexes or `trackBy`. `null` and `undefined` clear it. |
| `update(updater)` | Passes the current plain value to `updater`, then reconciles its complete result. A nullish result clears the array. |
| `patch(values)` | Partially updates existing items by position without resizing the array. |
| `reset()` | Keeps the current value and structure while recursively clearing interaction state. |
| `reset(value)` | Reconciles `value` as the new current value, then recursively clears interaction state. A nullish value clears the array. |

## Structural examples

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

## Validation properties and methods

An array's validators receive its complete plain value. Validation and pending state aggregate the
array's own state with that of its current descendants.

Start with one collection validator and add an array only when multiple rules are needed:

```ts
const myForm = form({
  tags: array(field(''), {
    validators: minLength(1),
  }),
  roles: array(field(''), {
    validators: [minLength(1), uniqueItems],
  }),
});
```

These rules validate each complete array. Put validators on `field('')` instead when the rule must
run independently for every item.

| Member | Description |
| --- | --- |
| `validators()` | Current normalized validator collection. |
| `setValidators(source)` | Replaces the validator source and re-evaluates validation. The source can be static or reactive. |
| `errors()` | Errors owned directly by this array; descendant errors are excluded. |
| `allErrors()` | Errors owned by this array and every current descendant. Each error identifies its `targetNode`. |
| `getError(kind)` | Returns the first array-owned error with `kind`, or `undefined`. Known built-in kinds retain their inferred error type. |
| `valid()` | Whether this array and all current descendants are valid. |
| `invalid()` | Whether this array or any current descendant is invalid. |
| `pending()` | Whether asynchronous validation is currently pending in this array subtree. |
| `validationStatus()` | Current status: `'valid'`, `'invalid'`, or `'unknown'` while validation is pending without an existing error. |
| `required()` | Whether an active validator marks this array as required. This does not make the array nullable. |

```ts
myForm.people.errors();    // errors belonging to `people`
myForm.people.allErrors(); // errors from `people` and its item nodes
myForm.people.getError('uniqueItems');
```

## Interaction properties and methods

| Member | Description |
| --- | --- |
| `touched()` | Whether the array itself or any current descendant is touched. |
| `untouched()` | Inverse of `touched()`. |
| `markAsTouched()` | Marks the array and its current descendants as touched. |
| `markAsTouched({ skipDescendants: true })` | Marks only the array's own stored state as touched. |
| `markAsUntouched()` | Clears only the array's own stored touched state. Touched descendants can keep the aggregate array touched. |
| `dirty()` | Whether the array itself or any current descendant is dirty. |
| `pristine()` | Inverse of `dirty()`. |
| `markAsDirty()` | Marks the array's own stored state as dirty. |
| `markAsPristine()` | Clears the array's own stored dirty state. Dirty descendants can keep the aggregate array dirty. |

Programmatic value and structural operations do not mark nodes dirty. `reset()` recursively clears
interaction state after restoring or replacing the value.

When item controls use Angular `[formField]` through `$field`, these operations also reconcile the
Angular field paths that have actually been requested through `$field`. Retained connected items
keep their touched and dirty state across `move()`, `swap()`, and `trackBy` reconciliation; newly
rendered items connect when Angular evaluates their `$field`, and removed items detach cleanly. See
[Control binding](../guides/control-binding.md#dynamic-arrays-with-formfield).

## Availability properties and methods

| Member | Description |
| --- | --- |
| `disabled()` | Whether the array is disabled by its own state, configuration, or an ancestor. |
| `disabledReasons()` | Active local and inherited disabled causes, including their source nodes and optional messages. |
| `enabled()` | Inverse of `disabled()`. |
| `disable(message?)` | Disables the array subtree and optionally records a user-facing reason. |
| `enable()` | Removes the imperative disabled state; other configured or inherited causes can keep it disabled. |
| `readonly()` | Whether the array is readonly through its own state, configuration, or an ancestor. |
| `writable()` | Inverse of `readonly()`. |
| `markAsReadonly()` | Marks the array subtree as readonly. |
| `markAsWritable()` | Removes the imperative readonly state; other causes can keep it readonly. |
| `hidden()` | Whether the array is hidden through its own state, configuration, or an ancestor. |
| `visible()` | Inverse of `hidden()`. |
| `hide()` | Hides the array subtree. |
| `show()` | Removes the imperative hidden state; other causes can keep it hidden. |

## Control and submission properties and methods

| Member | Description |
| --- | --- |
| `debouncing()` | Whether a current descendant has a pending debounced control value. |
| `flush()` | Immediately commits every pending control value in the current item subtrees. |
| `focus(options?)` | Focuses the first bound control in the current item subtrees, following DOM order. Accepts standard `FocusOptions`. |
| `submitting()` | Whether this array or an ancestor form is currently running its submission action. |

See [Dynamic arrays](../guides/dynamic-arrays.md), the [reorderable-array recipe](../cookbook/reorderable-arrays.md),
and the [shared Node API](./node-api.md).
