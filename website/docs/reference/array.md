---
title: array()
---

import CodeBlock from '@theme/CodeBlock';
import emptyPrimitivesSource from '!!raw-loader!../../examples/empty-primitives.example.ts';
import validationQueriesSource from '!!raw-loader!../../examples/validation-queries.example.ts';
import arrayFocusSource from '!!raw-loader!../../examples/array-focus.typecheck.ts';
import arrayValueEqualitySource from '!!raw-loader!../../examples/array-value-equality.example.ts';
import arrayTemplateFieldShorthandSource from '!!raw-loader!../../examples/array-template-field-shorthand.example.ts';

# array() {#array}

For the exported `ArrayNode` model type and its generic counterpart, see the
[Node types reference](./node-types.md#array-node).

`array()` creates a dynamic collection of independently cloned nodes. It is not required merely
because a value is an array. When one control owns the complete array—for example, a multi-select—
use a normal array-valued `field()` instead. Choose `array()` when items need independent nodes,
bindings, validation state, or structural operations.

Use [`FormNodeValue<typeof myArray>`](./form-node-value.md) to extract an array node's value type.

:::info Safe outside Angular injection contexts

`array()` can be safely created and used outside an Angular injection context. Value and structural
operations, state, synchronous validation, and asynchronous validation all continue to work. When
an injector is available, its `DestroyRef` provides deterministic cleanup; without one, Form Nodes
uses weak ownership so an unreachable array tree can be garbage-collected.

:::

:::info Array node or array-valued field?

Use `array()` when each item needs its own node, state, validation, binding, or structural
operations. When one control owns the complete array value, use `field([])` instead. See
[Choosing a primitive](../guides/choosing-a-primitive.md) for the complete comparison.

:::

```ts
import { array, field, form } from '@ngblocks/form-nodes';

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

## 🧭 API map {#api-map}

| I want to… | Start with | Details |
| --- | --- | --- |
| Choose a template and initial items | `array(template, ...)` | [Signatures](#signatures) and [options](#options) |
| Read values, nodes, or array position | `myArray()`, `items()`, `myArray[index]` | [Properties and methods](#properties-and-methods) |
| Search or iterate live item nodes | `at()`, `forEach()`, `map()`, `find()` | [Collection methods](#item-access-and-collection-methods) |
| Add, remove, move, swap, or clear items | `push()`, `removeAt()`, `move()`, `swap()` | [Structural methods](#structural-methods) |
| Replace, derive, patch, or reset values | `set()`, `update()`, `patch()`, `reset()`, `resetToInitial()` | [Value update methods](#value-update-methods) |
| Preserve identity across server updates | `trackBy` | [Reconciliation](#reconciliation-and-trackby) |
| Inspect aggregate state | Validation, interaction, and availability signals | [Validation](#validation-properties-and-methods), [interaction](#interaction-properties-and-methods), and [availability](#availability-properties-and-methods) |
| Commit, focus, or inspect submission state | `flush()`, `focus()`, `submitting()` | [Control and submission](#control-and-submission-properties-and-methods) |

Inline validators receive `ctx.node()` and `ctx.field()` typed as this primitive, preserving its
value type and any declared children or array items. Inline `validator()` and `asyncValidator()`
helpers retain that inference when their generics are omitted. See
[Inline node inference](../concepts/tree-and-api.md#inline-node-inference).

## 📐 Signatures {#signatures}

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

### ◆ `field()` shorthands in object templates {#field-shorthands-in-object-templates}

Inside an object template, field-value shorthands use the same normalization and TypeScript
inference as `form()` and `group()`. The object itself becomes a `group()`, while its concise leaf
values become independently cloned `field()` nodes:

<CodeBlock language="ts">{arrayTemplateFieldShorthandSource}</CodeBlock>

The template above is equivalent to `array({ name: field(''), age: field(0) }, ...)`. Every item
receives fresh field and group nodes; only the declared initial values are shared. This also works
for object templates returned by a factory.

The [declaration shorthand matrix](../concepts/creating-nodes.md#declaration-shorthand-matrix)
compares these template declarations with their explicit equivalents and explains when a nested
`array()` is required.

An array inside the object template becomes one array-valued `FieldNode`; its length and contents do
not affect that decision. Use an explicit nested `array(...)` when its items need independent
nodes. Use `field(objectValue)` when a plain object is an atomic application value rather than
nested group structure.

## ⚙️ Options {#options}

Arrays accept most of the options available to [`form()`](./form.md), together with array-specific
initialization and reconciliation options. They do not accept `onSubmit`: an array can report
the submission state inherited from an ancestor form, but cannot initiate submission itself.

Items created later from either a template or factory inherit the array's nearest injector by
default. Set `inheritInjector: false` on an item template or factory result to create a lifecycle
boundary for that item subtree.

Like every node, an array also adopts a directly bound `[formNode]` host injector by default. Use
`adoptBindingInjector: false` when rendering the array must not change its lifecycle owner.

| Option | Accepted value | Purpose |
| --- | --- | --- |
| [`equal`](#equal-option) | `'shallow'`, `'deep'`, or `(previous, next) => boolean` | Retains equivalent exposed array values; defaults to `Object.is`. |
| [`initialValue`](#initialvalue-option) | Item-value array, non-negative integer, `null`, or `undefined` | Creates items from supplied values or creates a requested number of items from the template defaults. Nullish values produce an empty array. |
| [`validators`](#validators-option) | Validator, validator array, `null`, or `undefined` | Validates the complete array value. Put validators on the item template instead when every item needs independent validation. |
| [`validatorMessages`](#validatormessages-option) | Message catalog or reactive catalog function | Overrides built-in validator messages for the array subtree. Validator-local messages still take precedence. |
| [`trackBy`](#trackby-option) | Item property name or `(value, index) => key` | Preserves logical item identity and state when `set()`, `update()`, or `reset(value)` reconciles the collection. |
| [`debounce`](#debounce-option) | Milliseconds, `'blur'`, or cancelable asynchronous function | Provides the default control-value debounce inherited by current and future items. |
| [`hidden`](#hidden-option) | Boolean or reactive function | Sets or reactively derives hidden state for the complete array subtree. |
| [`disabled`](#disabled-option) | Boolean, reason string, or reactive function | Sets or reactively derives disabled state for the complete array subtree. A string is exposed through `disabledReasons()`. |
| [`readonly`](#readonly-option) | Boolean or reactive function | Sets or reactively derives readonly state for the complete array subtree. |
| [`injector`](#injector-option) | Angular `Injector` | Explicitly owns injector-dependent work such as asynchronous validation watchers. Ordinary synchronous use does not require one. |
| [`inheritInjector`](#inheritinjector-option) | Boolean; defaults to `true` | Allows the array to use the nearest ancestor injector when it has no injector of its own. Set it to `false` to create an inheritance boundary. |
| [`adoptBindingInjector`](#adoptbindinginjector-option) | Boolean; defaults to `true` | Allows the array to adopt the injector of a directly bound `[formNode]` host while that binding exists. |

:::info trackBy is optional

You do not need to configure `trackBy` for ordinary arrays. Without it, complete value updates
reuse existing item nodes by index. Add `trackBy` only when items have a stable domain identity and
may be reordered or replaced with new objects while their node identity and state should be
preserved.

:::

:::caution Choose one initial-value signature

Keep `initialValue` either as the positional argument or inside the options object. In multiline
consumer examples, prefer `options.initialValue` so initialization and `trackBy` stay together.
TypeScript intentionally rejects providing it in both places.

:::

<div className="api-member-reference">

## ⚙️ Option reference {#option-reference}

Each option below includes its signature, default behavior, scope, and a complete example.

### ◆ Values and validation {#values-and-validation}

#### – equal {#equal-option}

**Signature:** `equal?: 'shallow' | 'deep' | ((previous: TValue, next: TValue) => boolean)`

Applies equality to the complete exposed array. The comparator receives the inferred array value,
including nullable item properties. The node call, equivalent `value()` signal, array validators,
public parents, and `update()` callbacks all observe the exposed value. Ancestor form submission
also receives that public representation.

<CodeBlock language="ts">{arrayValueEqualitySource}</CodeBlock>

- `'shallow'` compares array entries with `Object.is`; object entries need matching references.
- `'deep'` compares nested values using the same recursive semantics as
  [field equality](./field.md#field-equal-option).
- A custom comparator must treat values as interchangeable for consumers and validation.

Equality is captured at construction, is not inherited by items, and survives configured factories
and template cloning. It runs untracked during lazy exposed computation. The first evaluation
does not compare, intermediate writes may coalesce, and comparator errors affect exposed reads
after item writes or structural operations have already completed.

`equal` does not control node identity or structure. `items()`, indexed access, `length()`, paths,
and `trackBy` reconciliation always follow the current collection. If a comparator ignores order
or length, the retained exposed array may differ from the current item order or count. Render
dynamic rows from `items()` and track their nodes as shown in the [dynamic arrays guide](../guides/dynamic-arrays.md).

Controls, reset, and debounce use current committed values. Reordering equal-valued nodes still
invalidates obsolete pending control input. See
[Aggregate value equality](../concepts/values-and-state.md#aggregate-value-equality) for the shared contract.

#### – initialValue {#initialvalue-option}

**Signature:** `initialValue?: readonly ItemValue[] | number | null`

Creates the initial item nodes. An array supplies each item's value; a non-negative integer creates
that many items from the template defaults. `null`, `undefined`, and omission produce an empty
array.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [
    { username: 'ada', active: true },
    { username: 'grace', active: false },
  ],
});

users.length(); // 2
```

A numeric value creates that many independent items from the template defaults:

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: 3,
});

users.length(); // 3
users();
// [
//   { username: '', active: false },
//   { username: '', active: false },
//   { username: '', active: false },
// ]
```

#### – validators {#validators-option}

**Signature:** `validators?: ValidatorSource<ArrayValue, ArrayNode<TItem>>`

Assigns one validator or an array of validators to the complete collection value. Item-template
validators still validate each item independently.

```ts
const usernames = array(field(''), {
  initialValue: ['ada'],
  validators: [minLength(2), uniqueItems],
});

usernames.invalid(); // true
```

#### – validatorMessages {#validatormessages-option}

**Signature:** `validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined)`

Overrides built-in validator messages for this array and its descendants. It can be a static
catalog or a reactive function; a message configured directly on a validator has higher priority.

```ts
const users = array({
  username: field('', [required]),
}, {
  initialValue: [{ username: '' }],
  validatorMessages: {
    required: 'Enter a username.',
  },
});

users.allErrors()[0]?.message; // 'Enter a username.'
```

#### – trackBy {#trackby-option}

**Signature:** `trackBy?: keyof ItemValue | ((value: ItemValue, index: number) => unknown)`

Selects stable item identity during complete reconciliation. Matching keys preserve and, when
needed, move existing nodes with their interaction and validation state. Without this option,
nodes are reused by index.

```ts
const users = array({
  id: field(''),
  username: field(''),
}, {
  initialValue: [
    { id: 'user-1', username: 'ada' },
    { id: 'user-2', username: 'grace' },
  ],
  trackBy: 'id',
});
```

#### – debounce {#debounce-option}

**Signature:** `debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>)`

Provides the default control-value debounce inherited by current and future items. Omit it to
commit control-originated values immediately.

```ts
const usernames = array(field(''), {
  initialValue: ['ada'],
  debounce: 300,
});
```

### ◆ Availability {#availability}

#### – hidden {#hidden-option}

**Signature:** `hidden?: boolean | (() => boolean)`

Sets the initial hidden state or derives it reactively for the complete array subtree. It defaults
to `false`.

```ts
const usernames = array(field(''), {
  hidden: () => !showUsernames(),
});

usernames.hidden(); // follows showUsernames()
```

#### – disabled {#disabled-option}

**Signature:** `disabled?: boolean | string | (() => boolean | string)`

Sets or reactively derives disabled state for the complete subtree. A string both disables the
array and becomes a message in `disabledReasons()`. It defaults to `false`.

```ts
const usernames = array(field(''), {
  disabled: 'Profile is locked',
});

usernames.disabled(); // true
usernames.disabledReasons()[0]?.message; // 'Profile is locked'
```

#### – readonly {#readonly-option}

**Signature:** `readonly?: boolean | (() => boolean)`

Sets the initial readonly state or derives it reactively for the complete array subtree. It
defaults to `false`.

```ts
const usernames = array(field(''), {
  readonly: () => profileArchived(),
});

usernames.readonly(); // follows profileArchived()
```

### ◆ Injector ownership {#injector-ownership}

#### – injector {#injector-option}

**Signature:** `injector?: Injector`

Provides an explicit Angular injector for injector-dependent work. Its `DestroyRef` owns the
array's asynchronous-validation watcher. Synchronous array behavior does not require an injector.

```ts
const injector = inject(Injector);

const usernames = array(field(''), {
  injector,
});
```

#### – inheritInjector {#inheritinjector-option}

**Signature:** `inheritInjector?: boolean`

Controls whether an otherwise injector-less array may use the nearest ancestor injector. It
defaults to `true`; `false` creates an inheritance boundary without discarding an explicit or
currently captured injector.

```ts
const profile = form({
  usernames: array(field(''), {
    inheritInjector: false,
  }),
});
```

#### – adoptBindingInjector {#adoptbindinginjector-option}

**Signature:** `adoptBindingInjector?: boolean`

Controls whether an otherwise injector-less array may temporarily adopt the injector of a directly
bound `[formNode]` host. It defaults to `true`; set it to `false` when rendering must not change the
array's lifecycle owner.

```ts
const usernames = array(field(''), {
  adoptBindingInjector: false,
});
```

</div>

## 📖 Properties and methods {#properties-and-methods}

An array node is a callable value reader with reactive signal properties, collection operations,
and the shared node state API. Signal properties must be called to read their current value.

| Member | Description |
| --- | --- |
| **Value and tree** | |
| [`myArray()`](#callable-value) | Returns the exposed array value, applying `equal`. This is the preferred value-reading form. |
| [`myArray[index]`](#indexed-access) | Returns the live item node at an index, or `undefined`. |
| [`value()`](#value) | Exposed value. Equivalent to calling the array node directly. |
| [`value.committed()`](#value-committed) | Latest committed data before configured equality checks. |
| [`value.committed.set(value)`](#value-committed-set) | Complete immediate write, equivalent to `set()`. |
| [`value.control()`](#controlvalue) | Immediate value from a control bound directly to the array; it can differ during debounce. |
| [`value.control.set(value)`](#value-control-set) | Receives control input with debounce and dirty tracking. |
| [`items()`](#items) | Readonly array of current live item nodes. Its reference changes with the structure. |
| [`length()`](#length) | Current number of item nodes. |
| [`nodeType()`](#nodetype) | Returns the literal `'array'`. |
| [`form()`](#form) | Nearest explicit form workflow, or `null` when none owns the array. |
| [`root()`](#root) | Complete structural root; a root array returns itself. |
| [`parent()`](#parent) | Direct parent node, or `null` at the root or after detachment. |
| [`path()`](#path) | Property path from the root; array indexes are string segments. |
| [`keyInParent()`](#keyinparent) | Property name or array index in the parent, or `null` at the root. |
| [`api`](#api) | Complete array API. Direct members are preferred in application code. |
| [`$api`](#api-1) | Collision-safe alias of `api` for generic infrastructure. |
| **Item access and collection** | |
| [`at(index)`](#at) | Returns the live item node at an index, or `undefined`. |
| [`forEach(callback)`](#foreach) | Invokes a callback once for every current item node. |
| [`map(callback)`](#map) | Maps item nodes into a new plain array. |
| [`filter(predicate)`](#filter) | Returns item nodes accepted by the predicate. |
| [`find(predicate)`](#find) | Returns the first matching item node, or `undefined`. |
| [`findIndex(predicate)`](#findindex) | Returns the first matching node index, or `-1`. |
| [`some(predicate)`](#some) | Whether at least one item node matches. |
| [`every(predicate)`](#every) | Whether every item node matches. |
| [`includes(item, fromIndex?)`](#includes) | Whether an exact node instance is present. |
| [`indexOf(item, fromIndex?)`](#indexof) | Position of an exact node instance, or `-1`. |
| [`[Symbol.iterator]()`](#symboliterator) | Iterates current item nodes with `for...of` or spread syntax. |
| **Structure** | |
| [`push(value?)`](#push) | Appends and returns a new item node, using template defaults when no value is supplied. |
| [`insert(index, value?)`](#insert) | Inserts and returns a new item node while shifting later items. |
| [`removeAt(index)`](#removeat) | Removes, detaches, and returns an item node, or `undefined`. |
| [`moveUp(index)`](#moveup) | Moves an item one position toward the start. |
| [`moveDown(index)`](#movedown) | Moves an item one position toward the end. |
| [`move(fromIndex, toIndex)`](#move) | Moves an existing node and shifts intervening items. |
| [`swap(firstIndex, secondIndex)`](#swap) | Exchanges two existing item nodes. |
| [`clear()`](#clear) | Removes and detaches every current item. |
| **Value updates** | |
| [`set(value)`](#set) | Reconciles the complete collection. A nullish value clears it. |
| [`update(updater)`](#update) | Derives and reconciles a complete value from the current plain value. |
| [`patch(values)`](#patch) | Partially updates existing items by index without resizing. |
| [`reset(value?)`](#reset) | Optionally reconciles a value, then recursively clears interaction state. |
| [`resetToInitial()`](#reset-to-initial) | Restores captured initial values and clears subtree interaction state. |
| **Validation** | |
| [`validators()`](#validators) | Current normalized validators owned by the array. |
| [`setValidators(source)`](#setvalidators) | Replaces the array validator source and revalidates. |
| [`errors()`](#errors) | Errors owned directly by this array, excluding descendants. |
| [`allErrors()`](#allerrors) | Errors from this array and every current descendant. |
| [`getError(kind)`](#geterror) | First array-owned error with a kind, or `undefined`. |
| [`valid()`](#valid) | Whether the complete array subtree is valid. |
| [`invalid()`](#invalid) | Whether the array or a current descendant is invalid. |
| [`required()`](#required) | Whether active metadata marks this array itself as required. |
| [`pending()`](#pending) | Whether asynchronous validation is active in the subtree. |
| [`validationStatus()`](#validationstatus) | Aggregated `'valid'`, `'invalid'`, or `'unknown'` phase. |
| **Interaction** | |
| [`touched()`](#touched) | Whether the array or a contributing descendant is touched. |
| [`untouched()`](#untouched) | Logical inverse of `touched()`. |
| [`markAsTouched(options?)`](#markastouched) | Marks the array and, by default, its item subtrees touched. |
| [`markAsUntouched()`](#markasuntouched) | Clears the array's own touched state. |
| [`dirty()`](#dirty) | Whether the array or a contributing descendant is dirty. |
| [`pristine()`](#pristine) | Logical inverse of `dirty()`. |
| [`markAsDirty()`](#markasdirty) | Marks the array's own state dirty. |
| [`markAsPristine()`](#markaspristine) | Clears the array's own dirty state. |
| **Availability** | |
| [`disabled()`](#disabled) | Whether the array is disabled locally or by an ancestor. |
| [`disabledReasons()`](#disabledreasons) | Active local and inherited disabled causes. |
| [`enabled()`](#enabled) | Logical inverse of `disabled()`. |
| [`disable(message?)`](#disable) | Disables the subtree and optionally records a reason. |
| [`enable()`](#enable) | Clears the imperative disabled state. |
| [`readonly()`](#readonly) | Whether the array is readonly locally or through an ancestor. |
| [`writable()`](#writable) | Logical inverse of `readonly()`. |
| [`markAsReadonly()`](#markasreadonly) | Marks the array subtree readonly. |
| [`markAsWritable()`](#markaswritable) | Clears the imperative readonly state. |
| [`hidden()`](#hidden) | Whether the array is hidden locally or through an ancestor. |
| [`visible()`](#visible) | Logical inverse of `hidden()`. |
| [`hide()`](#hide) | Marks the array subtree hidden. |
| [`show()`](#show) | Clears the imperative hidden state. |
| **Control and submission** | |
| [`debouncing()`](#debouncing) | Whether a descendant has a pending debounced control value. |
| [`flush()`](#flush) | Commits pending control values throughout the subtree. |
| [`focus(options?)`](#focus) | Focuses the first bound control in DOM order. |
| [`submitting()`](#submitting) | Whether an ancestor form is running its submission action. |


```ts
myForm.people();          // [{ name: 'Mark', age: 50 }]
myForm.people.length();   // 1
myForm.people.at(0);      // first live person node
myForm.people[0]?.name(); // 'Mark'
myForm.people.path();     // ['people']
```

Use `items()` when a reactive readonly node list is needed. Use spread syntax or `Array.from()` to
create a mutable copy; mutating that copy does not change the form array.

## 📚 Item access and collection methods {#item-access-and-collection-methods}

These methods operate on item **nodes**, not on their plain values. Their callbacks receive
`(item, index, arrayNode)`. See the consolidated [properties and methods](#properties-and-methods)
table for their signatures and summaries.

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

## 🌳 Structural methods {#structural-methods}

Reordering retains the exact node instances, including their interaction state, validation state,
and pending work. Paths are updated after the move. Invalid insertion, movement, and swap indexes
throw `RangeError`.

Structural operations are programmatic and do not mark the array dirty automatically.

## 📝 Value update methods {#value-update-methods}

## 🧪 Structural examples {#structural-examples}

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

## 📝 Complete and partial value updates {#complete-and-partial-value-updates}

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

Sparse patch entries are skipped, extra indexes are ignored with a warning in development mode, and existing nodes are
not recreated. Passing `null` or `undefined` to `set()`, returning it from `update()`, or supplying
it to `reset(value)` clears the array.

## 📚 Reconciliation and trackBy {#reconciliation-and-trackby}

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

## ✅ Validation properties and methods {#validation-properties-and-methods}

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
run independently for every item. The consolidated [properties and methods](#properties-and-methods)
table summarizes every validation member.

```ts
myForm.people.errors();    // errors belonging to `people`
myForm.people.allErrors(); // errors from `people` and its item nodes
myForm.people.getError('uniqueItems');
```

## 👆 Interaction properties and methods {#interaction-properties-and-methods}

See the consolidated [properties and methods](#properties-and-methods) table for every interaction
signal and operation.

Programmatic value and structural operations do not mark nodes dirty. `reset()` recursively clears
interaction state after restoring or replacing the value.



## 🎛️ Availability properties and methods {#availability-properties-and-methods}

See the consolidated [properties and methods](#properties-and-methods) table for every availability
signal and operation.

## 🔌 Control and submission properties and methods {#control-and-submission-properties-and-methods}

See the consolidated [properties and methods](#properties-and-methods) table for the control and
submission members.

<div className="api-member-reference">

## 📖 Property reference {#property-reference}

Each entry includes its consumer-facing signature, what it represents or returns, and a complete
example. In the signatures below, `ItemNode` means the node cloned from the array template,
`ItemValue` means that node's plain value, `ItemPatch` means the partial value accepted by that
node's `patch()`, and `ArrayValue` means `ItemValue[]`. `ParentNode` and `RootNode` represent the
precise parent and root types inferred from where the array is declared.

`min()` is not included because it is a field constraint signal, not an array property; see the
[`field()` reference](./field.md).

### ◆ Value and tree properties {#value-and-tree-properties}

#### – Callable value {#callable-value}

**Signature:** `(): ArrayValue`

Calls the array node as a signal and returns its exposed plain value, applying configured
[equality](#equal-option). This is the recommended way to read an array value.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames(); // ['ada', 'grace']
```

#### – Indexed access {#indexed-access}

**Signature:** `readonly [index: number]: ItemNode | undefined`

Returns the live item node at an index, or `undefined` when that index does not exist.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

const username = usernames[1];
username?.(); // 'grace'
usernames[20]; // undefined
```

#### – value() {#value}

**Signature:** `value: NodeValueSignal<ArrayValue, ArraySet | null | undefined>`

Contains the exposed plain value, including any previous array retained by [equality](#equal-option).

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.value(); // ['ada', 'grace']
```

Prefer the equivalent callable form, `usernames()`, for ordinary value reads.

#### – value.committed() {#value-committed}

**Signature:** `value.committed: Signal<ArrayValue> & { set(value: ArraySet | null | undefined): void }`

Reads the latest committed data, bypassing configured `equal` checks on this node and its
children. Pending debounce is still respected. Normal signal identity checks still apply.
See the [value views reference](./node-value.md#value-committed) for an executable example.

#### – value.committed.set() {#value-committed-set}

**Signature:** `value.committed.set(value: ArraySet | null | undefined): void`

Equivalent to `set(value)`: commits immediately, cancels pending input, preserves dirty/touched
state, and follows normal validation and parent propagation. Exposed reads still honor `equal`.
See the [setter example](./node-value.md#value-committed-set).

#### – value.control() {#controlvalue}

**Signature:** `value.control: Signal<ArrayValue>`

Contains the immediate value reported by a control bound directly to the array.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.value.control(); // ['ada', 'grace']
```

This can temporarily differ from `usernames()` when a control is bound directly to the array and
its value is awaiting a debounced commit.

#### – value.control.set() {#value-control-set}

**Signature:** `value.control.set(value: ArraySet | null | undefined): void`

Receives a complete value for a control bound to this node, marks this node dirty, and applies
configured or inherited debounce. It does not mark touched or emit binding outputs by itself.
Read the [control setter example and propagation details](./node-value.md#value-control-set).


#### – items() {#items}

**Signature:** `items: Signal<readonly ItemNode[]>`

Contains the current live item nodes in index order. The returned array is readonly and is replaced
whenever the structure changes.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

const usernameNodes = usernames.items();
usernameNodes[0]?.(); // 'ada'
```

#### – length() {#length}

**Signature:** `length: Signal<number>`

Contains the current number of live item nodes and is equivalent to `items().length`.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.length(); // 2
```

#### – nodeType() {#nodetype}

**Signature:** `nodeType(): 'array'`

Returns the stable primitive discriminant for this node.

```ts
const usernames = array(field(''));

usernames.nodeType(); // 'array'
```

#### – form() {#form}

**Signature:** `form: Signal<FormNode | null>`

Returns the nearest explicit `form()` containing the array. A standalone or detached array returns
`null` because it does not own a form workflow.

```ts
const profile = form({
  usernames: array(field(''), {
    initialValue: ['ada', 'grace'],
  }),
});

profile.usernames.form() === profile; // true
```

#### – root() {#root}

**Signature:** `root: Signal<RootNode>`

Returns the complete structural root containing the array. A standalone or detached array returns
itself.

```ts
const usernames = array(field(''));

usernames.root() === usernames; // true
```

#### – parent() {#parent}

**Signature:** `parent: Signal<ParentNode | null>`

Returns the direct parent node, or `null` when the array is a root or has been detached.

```ts
const profile = form({
  usernames: array(field(''), {
    initialValue: ['ada', 'grace'],
  }),
});

profile.usernames.parent() === profile; // true
```

#### – path() {#path}

**Signature:** `path: Signal<readonly string[]>`

Returns the property and index segments from the root to the array.

```ts
const profile = form({
  usernames: array(field(''), {
    initialValue: ['ada', 'grace'],
  }),
});

profile.usernames.path(); // ['usernames']
```

#### – keyInParent() {#keyinparent}

**Signature:** `keyInParent: Signal<string | number | null>`

Returns the property name or array index under which the node is stored, or `null` at the root.

```ts
const profile = form({
  usernames: array(field(''), {
    initialValue: ['ada', 'grace'],
  }),
});

profile.usernames.keyInParent(); // 'usernames'
profile.usernames[0]?.keyInParent(); // 0
```

#### – api {#api}

**Signature:** `api: ArrayApi<ItemNode>`

Exposes the complete array API as a plain object.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.api.length(); // 2
```

Direct access such as `usernames.length()` is preferred. Use `api` when generic infrastructure
needs a consistent API object or when an object-form child collides with a native member name.

#### – $api {#api-1}

**Signature:** `$api: ArrayApi<ItemNode>`

Exposes the same API through a name that cannot collide with a user-defined child.

```ts
const profile = form({
  api: field('public-profile-api'),
  usernames: array(field(''), {
    initialValue: ['ada', 'grace'],
  }),
});

profile.api(); // 'public-profile-api'
profile.$api.valid(); // true
profile.usernames.$api.length(); // 2
```

`$api` is the guaranteed collision-safe API path.

### ◆ Validation properties {#validation-properties}

#### – validators() {#validators}

**Signature:** `validators: Signal<Validators<ArrayValue>> & { (options: { resolve?: boolean }): Validators<ArrayValue> }`

Contains the normalized validators owned directly by the array, in declaration order.

```ts
const usernames = array(field(''), {
  initialValue: ['ada'],
  validators: minLength(2),
});

usernames.validators().length; // 1
```

#### – errors() {#errors}

**Signature:** `errors: NodeErrorsSignal<TNode>`

Reads own errors by default. Pass `{ descendants: true }` to include every descendant, exactly as `allErrors()` does. `{ descendants: false }`, `{}`, and no arguments read only own errors. `TNode` is this concrete node type.

The property remains an Angular `Signal`. Own reads preserve the concrete `targetNode` type; descendant reads use `AnyNode` because errors can belong to different node kinds. See [error queries](./validation-errors.md#error-queries) for an executable example.

Contains validation errors owned directly by the array and excludes descendant errors.

```ts
const usernames = array(field(''), {
  initialValue: ['ada'],
  validators: minLength(2),
});

usernames.errors()[0]?.kind; // 'minLength'
```

Only errors owned directly by the array are returned.

#### – allErrors() {#allerrors}

**Signature:** `allErrors: Signal<readonly ValidationError[]>`

Shortcut for `errors({ descendants: true })`, returning the same cached array.

Contains errors from the array and every current descendant. Each error identifies its
`targetNode`.

```ts
const users = array({
  username: field('', [required]),
}, {
  initialValue: [{ username: '' }],
});

users.allErrors()[0]?.kind; // 'required'
users.errors(); // []
```

#### – valid() {#valid}

**Signature:** `valid: Signal<boolean>`

Returns whether the array and every current item subtree have completed validation without errors.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
  validators: minLength(2),
});

usernames.valid(); // true
```

#### – invalid() {#invalid}

**Signature:** `invalid: Signal<boolean>`

Returns whether the array or any current item subtree contributes a validation error.

```ts
const usernames = array(field(''), {
  initialValue: ['ada'],
  validators: minLength(2),
});

usernames.invalid(); // true
```

#### – required() {#required}

**Signature:** `required: Signal<boolean>`

Returns whether active validation metadata marks the array itself as required.

```ts
const usernames = array(field(''), {
  initialValue: [],
  validators: required,
});

usernames.required(); // true
```

#### – pending() {#pending}

**Signature:** `pending: Signal<boolean>`

Returns whether asynchronous validation is currently active on the array or an item subtree.

```ts
const usernames = array(field(''), {
  validators: asyncValidator(async () => {
    await checkUsernames();
    return null;
  }),
});

usernames.pending(); // true while checkUsernames() is running
```

#### – validationStatus() {#validationstatus}

**Signature:** `validationStatus: Signal<'valid' | 'invalid' | 'unknown'>`

Returns the aggregate validation phase for the array and its current item subtrees.

```ts
const usernames = array(field(''), {
  initialValue: ['ada'],
  validators: minLength(2),
});

usernames.validationStatus(); // 'invalid'
```

The other possible values are `'valid'` and `'unknown'`. Unknown means asynchronous validation is
pending and no error currently makes the subtree invalid.

### ◆ Interaction properties {#interaction-properties}

#### – touched() {#touched}

**Signature:** `touched: Signal<boolean>`

Returns whether the array or any contributing current item subtree has been marked touched.

```ts
const usernames = array(field(''), {
  initialValue: ['ada'],
});

usernames.markAsTouched();
usernames.touched(); // true
```

#### – untouched() {#untouched}

**Signature:** `untouched: Signal<boolean>`

Returns the logical inverse of `touched()`.

```ts
const usernames = array(field(''), {
  initialValue: ['ada'],
});

usernames.untouched(); // true
```

#### – dirty() {#dirty}

**Signature:** `dirty: Signal<boolean>`

Returns whether the array or any contributing current item subtree reports user-modified state.

```ts
const usernames = array(field(''), {
  initialValue: ['ada'],
});

usernames.markAsDirty();
usernames.dirty(); // true
```

#### – pristine() {#pristine}

**Signature:** `pristine: Signal<boolean>`

Returns the logical inverse of `dirty()`.

```ts
const usernames = array(field(''), {
  initialValue: ['ada'],
});

usernames.pristine(); // true
```

### ◆ Availability properties {#availability-properties}

#### – disabled() {#disabled}

**Signature:** `disabled: Signal<boolean>`

Returns whether the array is effectively disabled by its own state, configuration, or an ancestor.

```ts
const usernames = array(field(''), {
  disabled: true,
});

usernames.disabled(); // true
```

#### – disabledReasons() {#disabledreasons}

**Signature:** `disabledReasons: Signal<readonly DisabledReason[]>`

Contains every active local and inherited cause of the disabled state, including its source node
and optional message.

```ts
const usernames = array(field(''), {
  disabled: 'Locked',
});

usernames.disabledReasons();
// [{ sourceNode: usernames, message: 'Locked' }]
```

#### – enabled() {#enabled}

**Signature:** `enabled: Signal<boolean>`

Returns the logical inverse of `disabled()`.

```ts
const usernames = array(field(''));

usernames.enabled(); // true
```

#### – readonly() {#readonly}

**Signature:** `readonly: Signal<boolean>`

Returns whether the array is effectively readonly through its own state or an ancestor.

```ts
const usernames = array(field(''), {
  readonly: true,
});

usernames.readonly(); // true
```

#### – writable() {#writable}

**Signature:** `writable: Signal<boolean>`

Returns the logical inverse of `readonly()` and indicates whether a directly bound control may
commit value changes.

```ts
const usernames = array(field(''));

usernames.writable(); // true
```

#### – hidden() {#hidden}

**Signature:** `hidden: Signal<boolean>`

Returns whether the array is effectively hidden through its own state or an ancestor.

```ts
const usernames = array(field(''), {
  hidden: true,
});

usernames.hidden(); // true
```

#### – visible() {#visible}

**Signature:** `visible: Signal<boolean>`

Returns the logical inverse of `hidden()`.

```ts
const usernames = array(field(''));

usernames.visible(); // true
```

### ◆ Control and submission properties {#control-and-submission-properties}

#### – debouncing() {#debouncing}

**Signature:** `debouncing: Signal<boolean>`

Returns whether the array or a current item subtree has a control-originated value awaiting commit.

```ts
const usernames = array(field('', {
  debounce: 300,
}), {
  initialValue: ['ada'],
});

usernames.debouncing(); // false before a bound control has a pending value
```

#### – submitting() {#submitting}

**Signature:** `submitting: Signal<boolean>`

Returns whether an ancestor form is currently running its submission action. Arrays cannot initiate
submission themselves.

```ts
const profile = form({
  usernames: array(field(''), {
    initialValue: ['ada'],
  }),
}, {
  onSubmit: async () => saveProfile(),
});

profile.usernames.submitting(); // true while saveProfile() is running
```

## 📖 Method reference {#method-reference}

Each entry includes its consumer-facing signature, its behavior and return value, and a complete
example. The examples alternate between primitive `array(field())` items and form-object
`array({ username: field() })` items so both node shapes are represented.

### ◆ Read and iterate item nodes {#read-and-iterate-item-nodes}

#### – at() {#at}

**Signature:** `at(index: number): ItemNode | undefined`

Returns the live node at an index, or `undefined` when that index does not exist.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [
    { username: 'ada', active: true },
    { username: 'grace', active: false },
  ],
});

users.at(1)?.username(); // 'grace'
users.at(20); // undefined
```

#### – forEach() {#foreach}

**Signature:** `forEach(callback: (item: ItemNode, index: number, array: ArrayNode) => void): void`

Runs a callback once for every current item node, in index order. The callback receives the item,
its index, and the array node itself.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [
    { username: 'ada', active: true },
    { username: 'grace', active: false },
  ],
});
const labels: string[] = [];

users.forEach((user, index, arrayNode) => {
  labels.push(`${index + 1}/${arrayNode.length()}: ${user.username()}`);
});

// Expected output:
// ['1/2: ada', '2/2: grace']
```

#### – map() {#map}

**Signature:** `map<TResult>(callback: (item: ItemNode, index: number, array: ArrayNode) => TResult): TResult[]`

Transforms the current item nodes into a new plain array without changing the form array.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace', 'linus'],
});

const uppercaseUsernames = usernames.map(username => username().toUpperCase());
// ['ADA', 'GRACE', 'LINUS']
```

#### – filter() {#filter}

**Signature:** `filter(predicate: (item: ItemNode, index: number, array: ArrayNode) => unknown): ItemNode[]`

Returns a new plain array containing the live item nodes accepted by the predicate. It does not
remove items from the form array.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [
    { username: 'ada', active: true },
    { username: 'grace', active: false },
    { username: 'linus', active: true },
  ],
});

const activeUsers = users.filter(user => user.active());
activeUsers.map(user => user.username()); // ['ada', 'linus']
```

#### – find() {#find}

**Signature:** `find(predicate: (item: ItemNode, index: number, array: ArrayNode) => unknown): ItemNode | undefined`

Returns the first live item node accepted by the predicate, or `undefined` when none matches.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [
    { username: 'ada', active: true },
    { username: 'grace', active: false },
  ],
});

const user = users.find(user => user.username() === 'grace');
user?.active(); // false
```

#### – findIndex() {#findindex}

**Signature:** `findIndex(predicate: (item: ItemNode, index: number, array: ArrayNode) => unknown): number`

Returns the index of the first matching item node, or `-1` when none matches.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace', 'linus'],
});

usernames.findIndex(username => username() === 'linus'); // 2
usernames.findIndex(username => username() === 'noa'); // -1
```

#### – some() {#some}

**Signature:** `some(predicate: (item: ItemNode, index: number, array: ArrayNode) => unknown): boolean`

Returns `true` when at least one current item node satisfies the predicate.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace', 'linus'],
});

usernames.some(username => username().startsWith('g')); // true
```

#### – every() {#every}

**Signature:** `every(predicate: (item: ItemNode, index: number, array: ArrayNode) => unknown): boolean`

Returns `true` when every current item node satisfies the predicate. It also returns `true` for an
empty array.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace', 'linus'],
});

usernames.every(username => username().length >= 3); // true
```

#### – includes() {#includes}

**Signature:** `includes(item: AnyNode, fromIndex?: number): boolean`

Checks whether the exact node instance is present. It compares node identity, not item values. An
optional second argument selects the index at which the search begins.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace', 'linus'],
});
const username = usernames.at(0)!;

usernames.includes(username); // true
usernames.includes(username, 1); // false
```

#### – indexOf() {#indexof}

**Signature:** `indexOf(item: AnyNode, fromIndex?: number): number`

Returns the position of an exact node instance, or `-1` if it is absent. An optional second
argument selects the index at which the search begins.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace', 'linus'],
});
const username = usernames.at(1)!;

usernames.indexOf(username); // 1
usernames.indexOf(username, 2); // -1
```

#### – Symbol.iterator {#symboliterator}

**Signature:** `[Symbol.iterator](): IterableIterator<ItemNode>`

Iteration yields the live item nodes. This supports `for...of` and spread syntax.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace', 'linus'],
});

for (const username of usernames) {
  console.log(username());
}

const usernameNodes = [...usernames];
```

### ◆ Change the structure {#change-the-structure}

Structural methods preserve retained node identity and do not mark the array dirty automatically.

#### – push() {#push}

**Signatures:** `push(): ItemNode` · `push(value: ItemValue): ItemNode`

Creates a node at the end and returns it. Omit the value to use the item template defaults.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [{ username: 'ada', active: true }],
});

const user = users.push({ username: 'grace', active: false });
user.username(); // 'grace'

const emptyUser = users.push();
emptyUser(); // { username: '', active: false }
```

#### – insert() {#insert}

**Signatures:** `insert(index: number): ItemNode` · `insert(index: number, value: ItemValue): ItemNode`

Creates and returns a node at the requested insertion index, shifting later items to the right.
The index may range from `0` through the current length; an invalid index throws `RangeError`.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [
    { username: 'ada', active: true },
    { username: 'linus', active: true },
  ],
});

const user = users.insert(1, { username: 'grace', active: false });

user.keyInParent(); // 1
users.at(2)?.username(); // 'linus'
```

#### – removeAt() {#removeat}

**Signature:** `removeAt(index: number): ItemNode | undefined`

Removes, detaches, and returns the node at an index. It returns `undefined` for an invalid index;
a retained removed node remains independently usable.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [
    { username: 'ada', active: true },
    { username: 'grace', active: false },
  ],
});

const user = users.removeAt(1);

user?.username(); // 'grace'
user?.parent(); // null
users(); // [{ username: 'ada', active: true }]
```

#### – moveUp() {#moveup}

**Signature:** `moveUp(index: number): void`

Moves an existing item one position toward the start. Index `0` is a no-op; an invalid index throws
`RangeError`.

```ts
const myForm = form({
  usernames: array(field(''), {
    initialValue: ['ada', 'grace', 'linus'],
  }),
});

myForm.usernames(); // ['ada', 'grace', 'linus']

myForm.usernames.moveUp(2);

myForm.usernames(); // ['ada', 'linus', 'grace']
```

#### – moveDown() {#movedown}

**Signature:** `moveDown(index: number): void`

Moves an existing item one position toward the end. The final index is a no-op; an invalid index
throws `RangeError`.

```ts
const myForm = form({
  usernames: array(field(''), {
    initialValue: ['ada', 'grace', 'linus'],
  }),
});

myForm.usernames(); // ['ada', 'grace', 'linus']

myForm.usernames.moveDown(0);

myForm.usernames(); // ['grace', 'ada', 'linus']
```

#### – move() {#move}

**Signature:** `move(fromIndex: number, toIndex: number): void`

Moves an existing node between two indexes and shifts the intervening nodes. Both indexes must
exist; moving to the same index is a no-op.

```ts
const myForm = form({
  usernames: array(field(''), {
    initialValue: ['ada', 'grace', 'linus', 'noa'],
  }),
});

const username = myForm.usernames.at(3)!;

myForm.usernames(); // ['ada', 'grace', 'linus', 'noa']

myForm.usernames.move(3, 1);

myForm.usernames(); // ['ada', 'noa', 'grace', 'linus']
myForm.usernames.at(1) === username; // true
```

#### – swap() {#swap}

**Signature:** `swap(firstIndex: number, secondIndex: number): void`

Exchanges two existing item nodes. Both retain their identity and state; equal indexes are a no-op.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace', 'linus'],
});
const firstUsername = usernames.at(0)!;
const lastUsername = usernames.at(2)!;

usernames.swap(0, 2);

usernames(); // ['linus', 'grace', 'ada']
usernames.at(0) === lastUsername; // true
usernames.at(2) === firstUsername; // true
```

#### – clear() {#clear}

**Signature:** `clear(): void`

Removes and detaches every current item node.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace', 'linus'],
});

usernames.clear();
usernames(); // []
```

### ◆ Update values and reset state {#update-values-and-reset-state}

#### – set() {#set}

**Signature:** `set(value: readonly ItemValue[] | null | undefined): void`

Reconciles the complete value, adding or removing nodes as needed. Matching nodes are retained by
index, or by `trackBy` when configured. Passing `null` or `undefined` clears the array.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [{ username: 'ada', active: true }],
});

users.set([
  { username: 'linus', active: true },
  { username: 'noa', active: false },
]);

users();
// [{ username: 'linus', active: true }, { username: 'noa', active: false }]
```

#### – update() {#update}

**Signature:** `update(updater: (value: ArrayValue) => readonly ItemValue[] | null | undefined): void`

Passes the current plain value to a callback and reconciles the callback's complete result.
Returning `null` or `undefined` clears the array.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [{ username: 'ada', active: true }],
});

users.update(currentUsers => [
  ...currentUsers,
  { username: 'grace', active: false },
]);

users();
// [{ username: 'ada', active: true }, { username: 'grace', active: false }]
```

#### – patch() {#patch}

**Signature:** `patch(value: readonly ItemPatch[]): void`

Partially updates existing nodes by index without resizing the array. Sparse entries are skipped,
and entries beyond the current length are ignored with a warning in development mode.

```ts
const users = array({
  username: field(''),
  active: field(false),
}, {
  initialValue: [
    { username: 'ada', active: false },
    { username: 'grace', active: false },
  ],
});

users.patch([
  { active: true },
  { username: 'grace-hopper' },
]);

users();
// [{ username: 'ada', active: true }, { username: 'grace-hopper', active: false }]
```

#### – reset() {#reset}

**Signatures:** `reset(): void` · `reset(value: readonly ItemValue[] | null | undefined): void`

Without an argument, keeps the current structure and values while recursively clearing interaction
state. With a value, it reconciles that value first and then clears interaction state.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.markAsTouched();
usernames.reset();
usernames.touched(); // false

usernames.reset(['linus', 'noa']);
usernames(); // ['linus', 'noa']
```

### ◆ Validation, interaction, and control methods {#validation-interaction-and-control-methods}

#### – setValidators() {#setvalidators}

**Signature:** `setValidators(validators: ValidatorSource<ArrayValue, ArrayNode<TItem>>): void`

Replaces the validators owned by the array and immediately evaluates its current aggregate value.
It does not replace validators owned by item nodes.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.setValidators(minLength(3));
usernames.valid(); // false
```

#### – getError() {#geterror}

**Signature:** `getError(kind: string): ValidationError | undefined`

Returns the first error owned directly by the array with the requested kind. Descendant errors are
available through `allErrors()` instead.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'ada'],
  validators: uniqueItems,
});

usernames.getError('uniqueItems')?.kind; // 'uniqueItems'
```

#### – flush() {#flush}

**Signature:** `flush(): void`

Immediately commits pending debounced control values throughout the array subtree. It is a no-op
when no bound control is debouncing.

```ts
const usernames = array(field('', {
  debounce: 300,
}), {
  initialValue: ['ada', 'grace'],
});

usernames.flush();
usernames.debouncing(); // false
```

#### – focus() {#focus}

**Signature:** `focus(options?: FocusOptions): void`

Focuses the first bound UI control in the array subtree, following DOM order. Standard
`FocusOptions` can be forwarded.

<CodeBlock language="ts">{arrayFocusSource}</CodeBlock>

#### – markAsTouched() {#markastouched}

**Signature:** `markAsTouched(options?: { skipDescendants?: boolean }): void`

Marks the array and all current item subtrees as touched. Pass `skipDescendants: true` to mark only
the array's own state.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.markAsTouched();
usernames.at(0)?.touched(); // true

usernames.reset();
usernames.markAsTouched({ skipDescendants: true });
usernames.at(0)?.touched(); // false
```

#### – markAsUntouched() {#markasuntouched}

**Signature:** `markAsUntouched(): void`

Clears the array's own touched state. A touched descendant can keep the aggregate `touched()` signal
equal to `true`; use `reset()` when the complete subtree should become untouched.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.markAsTouched({ skipDescendants: true });
usernames.markAsUntouched();
usernames.touched(); // false
```

#### – markAsDirty() {#markasdirty}

**Signature:** `markAsDirty(): void`

Marks the array's own state as dirty. Programmatic value and structural changes do not call this
method automatically.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.markAsDirty();
usernames.dirty(); // true
```

#### – markAsPristine() {#markaspristine}

**Signature:** `markAsPristine(): void`

Clears the array's own dirty state. A dirty descendant can keep the aggregate `dirty()` signal equal
to `true`.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.markAsDirty();
usernames.markAsPristine();
usernames.pristine(); // true
```

#### – disable() {#disable}

**Signature:** `disable(message?: string): void`

Disables the array subtree. An optional short message records why it was disabled.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.disable();
usernames.disabled(); // true

usernames.enable();
usernames.disable('Locked');
usernames.disabledReasons()[0]?.message; // 'Locked'
```

#### – enable() {#enable}

**Signature:** `enable(): void`

Clears the disabled state created by `disable()`. A configured or inherited reason can still keep
the array disabled.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.disable();
usernames.enable();
usernames.enabled(); // true
```

#### – markAsReadonly() {#markasreadonly}

**Signature:** `markAsReadonly(): void`

Marks the array subtree readonly, so bound controls cannot commit value changes to it.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.markAsReadonly();
usernames.writable(); // false
```

#### – markAsWritable() {#markaswritable}

**Signature:** `markAsWritable(): void`

Clears the readonly state created by `markAsReadonly()`. Other configured or inherited readonly
state can still apply.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.markAsReadonly();
usernames.markAsWritable();
usernames.writable(); // true
```

#### – hide() {#hide}

**Signature:** `hide(): void`

Marks the array subtree hidden and sets its effective `visible()` state to `false`.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.hide();
usernames.visible(); // false
```

#### – show() {#show}

**Signature:** `show(): void`

Clears the hidden state created by `hide()`. Other configured or inherited hidden state can still
keep the array hidden.

```ts
const usernames = array(field(''), {
  initialValue: ['ada', 'grace'],
});

usernames.hide();
usernames.show();
usernames.visible(); // true
```

</div>

See [Dynamic arrays](../guides/dynamic-arrays.md), the [reorderable-array recipe](../cookbook/reorderable-arrays.md),
and the [shared Node API](./node-api.md).

## 🚨 Query errors and registered validators {#query-errors-and-registered-validators}

`hasError(kind: string): boolean` checks the node's own current `errors()`, like
`getError(kind) !== undefined`. It does not search descendants or `allErrors()`. Synchronous,
asynchronous, and bound-control errors are included when present in `errors()`.

`hasValidator(validator, options?: { resolve?: boolean }): boolean` checks the directly registered validator list by function
identity, including async validators. Retain a factory's returned function to query it later.
A registered validator remains present while passing, disabled, or skipped by a condition.
By default, returned compositions are not expanded. With `{ resolve: true }`, this checks the same
leaf references as `validators({ resolve: true })`, reusing synchronous validation evaluation.
This can execute synchronous validators; async validators are listed without starting their work.
External control validators and descendants are not searched. See
[Inspect resolved validators](../guides/validation.md#inspect-resolved-validators) for conditional
branches, successful leaves, interaction-state suppression, and exceptions.

<CodeBlock language="ts">{validationQueriesSource}</CodeBlock>

Both queries participate in reactive tracking when read inside `computed()` or `effect()` and
memoize their boolean result by argument. `hasError()` follows error changes; `hasValidator()`
follows `setValidators()` and, with resolution enabled, dependencies read by synchronous validators.
The default registration query does not execute validators.
For a child named `hasError` or `hasValidator`, use the parent's `$api` to call that operation.

## ↩️ resetToInitial() {#reset-to-initial}

**Signature:** `resetToInitial(): void`

Restores captured initial values and clears dirty/touched state in this subtree. It cancels pending
control input, synchronizes rendered controls, and retains current validators and availability
configuration. It does not emit control-originated value outputs. Unlike `reset()`, it replaces
values; unlike `reset(value)`, it needs no value argument and does not use the last loaded record.

Object branches keep their current schema and restore each existing field to its own baseline.
Arrays restore their initial values, count, and order through ordinary index or `trackBy`
reconciliation. Factories can run to reconstruct missing nodes; restored data uses captured values.

See [Reset and restore initial values](../guides/reset-and-restore.md) for executable examples,
server-loaded records, nested arrays, dynamically added fields, snapshot boundaries, validation,
and native reset buttons.

## Empty declaration

`array(): ArrayNode<FieldNode<unknown>>` creates `[]` with a template equivalent to `field()`.
`push()` adds a fresh field initialized to `null`; `push(value)` accepts an unknown value.
Objects remain whole field values, not groups with child properties. Reads return `unknown[]`, so
narrow item values before using them. The first pushed value does not determine later item types.

Prefer an explicit object or node template when the item structure is known, or when you need
validators, options, or a typed value contract. `resetToInitial()` restores the initial empty array.
`createFormPrimitives().array()` uses a configured unknown-valued field template. Its missing-value
placeholder remains `null` even with `nullable: false`, matching an unspecified configured field.

<CodeBlock language="ts" title="empty-primitives.ts">{emptyPrimitivesSource}</CodeBlock>
