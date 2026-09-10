---
title: field()
---

import CodeBlock from '@theme/CodeBlock';
import fieldLiteralUnionSource from '!!raw-loader!../../examples/field-literal-union.example.ts';
import validationQueriesSource from '!!raw-loader!../../examples/validation-queries.example.ts';
import fieldFocusSource from '!!raw-loader!../../examples/field-focus.typecheck.ts';
import fieldEqualitySource from '!!raw-loader!../../examples/field-equality.example.ts';
import undefinedFieldSource from '!!raw-loader!../../examples/undefined-field.example.ts';

# field() {#field}

For the exported [`FieldNode`](./types/field-node.md) model type and its generic counterpart, see the
[Node types reference](./node-types.md#field-node).

`field()` creates a leaf node for a scalar, object, date, or any other application value. Fields
normally live inside a [`form()`](./form.md) so their parent, path, validation, and state participate in a tree.

Use [`FormNodeValue<typeof myField>`](./form-node-value.md) to extract a field's value type.

Not sure whether a structured value should be a field or child nodes? See
[Choosing a primitive](../guides/choosing-a-primitive.md).

:::info Safe outside Angular injection contexts

`field()` can be safely created and used outside an Angular injection context. Value operations,
state, synchronous validation, and asynchronous validation all continue to work. When an injector
is available, its `DestroyRef` provides deterministic cleanup; without one, Form Nodes uses weak
ownership so an unreachable field and its validation watcher can be garbage-collected.

:::

```ts
import { field, form, required } from '@ngblocks/form-nodes';

const myForm = form({
  name: field('', [required]),
  age: field<number>(),
});
```

## Validator input and results {#validator-results}

See the [validator argument and result contract](../guides/validation.md#validator-results) for
this primitive's positional and `options.validators` signatures. Callbacks accept the fully typed
node context and return [`ValidationResult`](./types/validation-result.md) or [`ComposableValidationResult<TValue, TNode>`](./types/composable-validation-result.md) at runtime:
no error, messages, errors with string/numeric kinds, or synchronous validator compositions.

:::info Declaration return inference

The TypeScript callback return is intentionally `any` so self-referencing declarations compile.
The node and context remain typed. Annotate the return with `ValidationResult` (or
`ComposableValidationResult` for composition), or use the checked context-taking [`validator()`](./validator.md)
helper when you want result checking. Numeric error kinds are exposed as strings.

:::

## 🧭 API map {#api-map}

| I want to… | Start with | Details |
| --- | --- | --- |
| Decide whether a value should be one field | `field<T>()` | [Arrays and objects](#fields-can-hold-arrays-and-objects) |
| Choose field nullability | Nullability shortcuts | [Nullability](#nullability) |
| Configure validation, debounce, or state | [`FieldOptions`](./types/field-options.md) | [Options](#options) |
| Read value, parent, or path | `myField()`, `parent()`, `path()` | [Properties and methods](#properties-and-methods) |
| Change or reset its value | `set()`, `update()`, `reset()` | [Method reference](#method-reference) |
| Inspect errors or constraints | `errors()`, `getError()`, `required()`, `min()` | [Validation properties](#validation-properties) |
| Manage touched, dirty, or availability | State signals and marker methods | [Interaction](#interaction-properties) and [availability](#availability-properties) |
| Connect it to an Angular control | [`FormNodeDirective`](./form-node-binding.md), `[formNode]` | [Binding in Angular](#binding-in-angular) |

## 📚 Fields can hold arrays and objects {#fields-can-hold-arrays-and-objects}

`field()` means “one leaf node,” not “one scalar.” A field can hold an array when the complete
array is edited as one value—for example, by a native multi-select or a multi-select component:

```ts
const myForm = form({
  selectedRoles: field<string[]>([]),
});
```

```html
<select multiple [formNode]="myForm.selectedRoles">
  <option value="admin">Administrator</option>
  <option value="editor">Editor</option>
  <option value="viewer">Viewer</option>
</select>
```

This field has one validation and interaction state for the complete `string[]`. Use [`array()`](./array.md) only
when items need independent nodes, bindings, errors, paths, or structural operations. See
[Array field or `array()`](../guides/choosing-a-primitive.md#array-field-or-array) for a complete
comparison.

When a value appears directly inside an object-node definition, consult the
[declaration shorthand matrix](../concepts/creating-nodes.md#declaration-shorthand-matrix) to see
whether it becomes an implicit field or structural group.

Inline validators receive `ctx.node()` and `ctx.field()` typed as this primitive, preserving its
value type and any declared children or array items. Inline `validator()` and [`asyncValidator()`](./async-validator.md)
helpers retain that inference when their generics are omitted. See
[Inline node inference](../concepts/tree-and-api.md#inline-node-inference).

## 📐 Signatures {#signatures}

```ts
field();
field(initialValue);
field(initialValue, options);
field(initialValue, validators, options?);
```

A field with no initial value starts at `null`.

## Literal union suggestions

With an explicit string-literal union, TypeScript IntelliSense suggests its string members when
you open the initial value's quotes. For `IborCode` below, the suggestions are `DAILY` and `MONTHLY`.
The empty string is only an editing state; it is not a valid completed initial value.

<CodeBlock language="ts" title="pricing-form.ts">{fieldLiteralUnionSource}</CodeBlock>

The same suggestions work with `field.nullable()`, `field.strict()` for non-nullable unions, and
fields from [`createFormPrimitives()`](./create-form-primitives.md), including calls with validators or options. Invalid strings
still produce a TypeScript error. Explicit `undefined` initialization retains its existing type.

## 📝 Nullability {#nullability}

```ts
field.strict(initialValue, options?);
field.strict(initialValue, validators, options?);
field.nullable(initialValue?, options?);
field.nullable(initialValue, validators, options?);
```

Fields are nullable by default. The initial value still determines the non-null part of the type:

```ts
const myForm = form({
  name: field(''),        // Field<string | null>
  age: field<number>(),   // Field<number | null>
});

myForm.name.set(null);
```

Applications that prefer non-nullable fields by default can create an isolated primitive set with
[`createFormPrimitives({ nullable: false })`](./create-form-primitives.md). The package-level `field()` remains
nullable by default. Use the explicit field methods below for local overrides.

Use the short methods when one declaration should be independent of that default:

```ts
const username = field.strict('');
// Field<string>

const nickname = field.nullable('');
// Field<string | null>

const nickname = field('');
// Field<string | null>
```

Both methods are also available on the `field` returned by `createFormPrimitives()`. Their names
describe the resulting field type: `strict()` always excludes `null`, while `nullable()` always
includes it.

When the literal initial value is `null` or `undefined`, there is no concrete value from which
TypeScript can infer a future type. Form Nodes uses `unknown`, rather than the unsafe `any`.
Omitting the initial value starts at `null`, while an explicit `undefined` is preserved:

```ts
const myForm = form({
  unspecified: field(null),         // Field<unknown>
  deferred: field(undefined),       // Field<unknown>; starts at undefined
  nickname: field<string>(null),    // Field<string | null>
});

myForm.unspecified.set('Marco');
myForm.unspecified.set(42);
```

With an explicit generic, `field<T>(undefined)` includes both the default nullable value and the
explicit initial value, producing `FieldNode<T | null | undefined>`.

The same distinction applies to an untyped `field()` from
`createFormPrimitives({ nullable: false })`: it returns `FieldNode<unknown>` initialized to `null`.
For a known future type without an initial value, use that factory's `field.nullable<T>()`.

<CodeBlock language="ts" title="undefined-field.example.ts">{undefinedFieldSource}</CodeBlock>

Use an explicit generic when the domain type is known. Although `FieldNode<unknown>` accepts `null`,
TypeScript displays it as `unknown` because `unknown | null` simplifies to `unknown`; reads must be
narrowed before use and therefore do not acquire `any`-like behavior.

`field.strict()` is the concise form when `null` is not a valid business value:

```ts
const myForm = form({
  countryCode: field.strict('CH'),
});

// myForm.countryCode.set(null); // TypeScript error
```

## ⚙️ Options {#options}

| Option | Accepted value | Purpose |
| --- | --- | --- |
| [`configure`](#configure) | `(api) => void` | Configure this instance once with its typed, collision-safe API. |
| [`validators`](#field-validators-option) | validator, validator array, or reactive source | Validates the field value |
| [`equal`](#field-equal-option) | `'shallow'`, `'deep'`, or `(previous, next) => boolean` | Retains equivalent exposed values; defaults to `Object.is` |
| [`injector`](#field-injector-option) | Angular `Injector` | Provides this node's preferred lifecycle owner |
| [`adoptBindingInjector`](#field-adoptbindinginjector-option) | `boolean` | Temporarily adopts a direct `[formNode]` host injector; defaults to `true` |
| [`inheritInjector`](#field-inheritinjector-option) | `boolean` | Uses the nearest ancestor injector when no own injector exists; defaults to `true` |
| [`debounce`](#field-debounce-option) | number, `'blur'`, or asynchronous function | Delays control-originated commits |
| [`disabled`](#field-disabled-option) | boolean, string, or reactive function | Disables the field |
| [`readonly`](#field-readonly-option) | boolean or reactive function | Makes the field readonly |
| [`hidden`](#field-hidden-option) | boolean or reactive function | Hides the field |

Start with a single built-in validator, then use an array when the field needs several rules:

```ts
const myForm = form({
  displayName: field('', [required]),
  username: field('', [required, minLength(3)]),
});
```

The same array can contain configured built-ins, custom callbacks, and `asyncValidator()` results.
See [Validation](../guides/validation.md) for the progressively more advanced forms.

State and debounce options inherit from ancestors. A local option can add a state cause or override
the inherited debounce.

<div className="api-member-reference">

## ⚙️ Option reference {#option-reference}

### configure {#configure}

**Signature:** `configure?: (api: FieldNode<TValue>['$api']) => void`

Synchronously configures each new instance with its callable, collision-safe API after its own
structure is ready. The callback is untracked; validators installed inside it remain reactive.
Fresh template clones run their own callback. Existing instances do not rerun it on reset or edits.
Ancestors may not be attached yet. Return values are ignored.

See [configuring nodes and sibling rules](../guides/configuring-nodes.md) for an executable example,
parent contracts, initialization order, and lifecycle details.


### ◆ Value and validation {#value-and-validation}

#### – equal {#field-equal-option}

**Signature:** `equal?: 'shallow' | 'deep' | ((previous: TValue, next: TValue) => boolean)`

Controls equality of the exposed value returned by the field and its `value()` signal. When the
comparison returns `true`, the previous value and reference are retained. Consumers and validators
depending only on that value do not rerun; other state or validator dependencies can still trigger
validation. Internal storage and controls still accept the latest committed write. Public parents
compose the field's exposed value, and `update()` callbacks receive that same exposed value.
Default equality remains `Object.is`.

The exposed value is a lazy `computed()`: its first evaluation publishes the current value without
comparing, and later evaluations compare against the last exposed value. Several writes can be
combined before a read. A comparator exception affects exposed reads after the write has committed;
a later internal value change permits recovery. Identical writes are skipped by internal
`Object.is` equality, even if the custom comparator would return `false`.

<CodeBlock language="ts">{fieldEqualitySource}</CodeBlock>

- `'shallow'` compares arrays and plain objects one level deep with `Object.is`; other objects use
  identity. Nested objects therefore need the same references.
- `'deep'` follows lodash `isEqual`-style semantics without importing lodash: it compares nested
  arrays, own enumerable string and symbol object properties, dates, errors, regular expressions,
  maps, sets, array buffers, data views, typed arrays, and boxed primitives. Circular references are
  supported. `NaN` equals `NaN`, and `0` equals `-0`. Functions and opaque values such as promises,
  weak collections, and DOM nodes use identity. Class instances also compare their constructors.
- Custom comparators receive the actual field value type, including `null` for nullable fields.
  They must be pure and describe interchangeable values. Comparison reads are untracked, and
  the comparator is not called for initial construction.

Map and set comparisons ignore ordering recursively, including arrays nested within them. Following
lodash's semantics, map entries are also compared as unordered pairs. Array properties outside
indexed elements are ignored; object properties that are inherited or non-enumerable are ignored.
Data views compare their offset, length, and complete backing buffers. BigInt primitives compare
by value; boxed BigInts and unsupported object kinds compare by identity.

The option is captured at construction, applies only to this field, and is preserved in array
template clones and configured field factories. `form()`, [`group()`](./group.md), and `array()` provide
[aggregate value equality](../concepts/values-and-state.md#aggregate-value-equality), which retains
their exposed snapshot independently of child storage.

For equality that belongs to one consumer, including comparisons of complete forms, groups, or
arrays, use [`computed()` with an equality function](../concepts/values-and-state.md#custom-equality-for-a-consumer).
That derived signal can retain its previous value independently of the node's committed value.

Equality does not suppress control input, `dirty`, or `touched`. Control input follows the normal
debounce policy even when it is equivalent to the exposed value. Only input identical to the
current internal value under `Object.is` cancels earlier work without scheduling another debounce.
`reset()` clears interaction and validation lifecycle state and restores the latest internally
committed value to the control. `reset(value)` stores the supplied value even if the exposed value
remains unchanged. Mutating an object in place does not create an old snapshot for deep comparison;
supply a new value when editing structured data.

#### – validators {#field-validators-option}

**Signature:** `validators?: ValidatorSource<TValue, FieldNode<TValue>>`

Assigns one validator, several validators, or a reactive validator source to this field.

```ts
const username = field('', {
  validators: [required, minLength(3)],
});
// or
const username = field('', [required, minLength(3)]);

username.invalid(); // true
```

#### – debounce {#field-debounce-option}

**Signature:** `debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>)`

Delays control-originated commits. Programmatic `set()` and `update()` calls remain immediate.

```ts
const username = field('', {
  debounce: 300,
});
```

### ◆ Availability {#availability}

#### – disabled {#field-disabled-option}

**Signature:** `disabled?: boolean | string | (() => boolean | string)`

Sets or reactively derives disabled state. A string also becomes a disabled reason.

```ts
const username = field('', {
  disabled: 'Profile is locked',
});

username.disabled(); // true
```

#### – readonly {#field-readonly-option}

**Signature:** `readonly?: boolean | (() => boolean)`

Sets or reactively derives readonly state. It defaults to `false`.

```ts
const username = field('', {
  readonly: () => profileArchived(),
});
```

#### – hidden {#field-hidden-option}

**Signature:** `hidden?: boolean | (() => boolean)`

Sets or reactively derives hidden state. It defaults to `false`.

```ts
const username = field('', {
  hidden: () => !showUsername(),
});
```

### ◆ Injector ownership {#injector-ownership}

#### – injector {#field-injector-option}

**Signature:** `injector?: Injector`

Provides an explicit lifecycle owner for injector-dependent work such as asynchronous validation.

```ts
const injector = inject(Injector);
const username = field('', { injector });
```

#### – inheritInjector {#field-inheritinjector-option}

**Signature:** `inheritInjector?: boolean`

Allows an otherwise injector-less field to use the nearest ancestor injector. It defaults to
`true`; `false` creates an inheritance boundary.

```ts
const username = field('', {
  inheritInjector: false,
});
```

#### – adoptBindingInjector {#field-adoptbindinginjector-option}

**Signature:** `adoptBindingInjector?: boolean`

Allows an otherwise injector-less field to adopt a directly bound `[formNode]` host injector. It
defaults to `true`.

```ts
const username = field('', {
  adoptBindingInjector: false,
});
```

</div>

## 📖 Properties and methods {#properties-and-methods}

A field is a callable committed-value reader with reactive signal properties and the shared node
state API. Signal properties must be called to read their current value.

| Member | Description |
| --- | --- |
| **Value and tree** | |
| [`myField()`](#callable-value) | Returns the current committed value. This is the preferred value-reading form. |
| [`value()`](#value) | Current committed value. Equivalent to calling the field directly. |
| [`value.committed()`](#value-committed) | Latest committed data before configured equality checks. |
| [`value.committed.set(value)`](#value-committed-set) | Complete immediate write, equivalent to `set()`. |
| [`value.control()`](#controlvalue) | Immediate value received from a bound control; it can differ during debounce. |
| [`value.control.set(value)`](#setcontrolvalue) | Receives a control value, marks dirty, and applies debounce. |
| [`nodeType()`](#nodetype) | Returns the literal `'field'`. |
| [`form()`](#form) | Nearest explicit form workflow, or `null` when none owns the field. |
| [`root()`](#root) | Complete structural root; a standalone field returns itself. |
| [`parent()`](#parent) | Direct parent node, or `null` at the root or after detachment. |
| [`path()`](#path) | Property path from the root; array indexes are string segments. |
| [`keyInParent()`](#keyinparent) | Property name or array index in the parent, or `null` at the root. |
| [`$api`](#api-1) | Callable, collision-safe API for generic infrastructure. |
| **Value and control** | |
| [`set(value)`](#set) | Immediately assigns a committed value without marking the field dirty. |
| [`update(updater)`](#update) | Derives and assigns a value from the current committed value. |
| [`reset(value?)`](#reset) | Optionally replaces the value, then clears interaction state and pending input. |
| [`resetToInitial()`](#reset-to-initial) | Restores captured initial values and clears subtree interaction state. |
| [`debouncing()`](#debouncing) | Whether a control value is waiting to be committed. |
| [`flush()`](#flush) | Immediately commits a pending control value. |
| [`focus(options?)`](#focus) | Focuses the first bound `[formNode]` control in DOM order. |
| **Validation** | |
| [`validators()`](#validators) | Current normalized validators owned by the field. |
| [`setValidators(source)`](#setvalidators) | Replaces the validator source and revalidates. |
| [`errors()`](#errors) | Errors owned directly by this field. |
| [`allErrors()`](#allerrors) | Same errors as `errors()` because fields have no descendants. |
| [`getError(kind)`](#geterror) | First field-owned error with a kind, or `undefined`. |
| [`valid()`](#valid) | Whether validation has completed without errors. |
| [`invalid()`](#invalid) | Whether the field currently has an error. |
| [`required()`](#required) | Whether active metadata marks the field as required. |
| [`pending()`](#pending) | Whether asynchronous validation is active. |
| [`validationStatus()`](#validationstatus) | Current `'valid'`, `'invalid'`, or `'unknown'` phase. |
| [`min()`](#min) | Strictest active numeric or date minimum, or `null`. |
| [`max()`](#max) | Strictest active numeric or date maximum, or `null`. |
| [`minLength()`](#minlength) | Strictest active minimum length, or `null`. |
| [`maxLength()`](#maxlength) | Strictest active maximum length, or `null`. |
| [`pattern()`](#pattern) | Every regular expression from active pattern validators. |
| **Interaction** | |
| [`touched()`](#touched) | Whether the field is touched and currently interactive. |
| [`untouched()`](#untouched) | Logical inverse of `touched()`. |
| [`markAsTouched(options?)`](#markastouched) | Marks the field touched and flushes pending control input. |
| [`markAsUntouched()`](#markasuntouched) | Clears the field's stored touched state. |
| [`dirty()`](#dirty) | Whether the field is dirty and currently interactive. |
| [`pristine()`](#pristine) | Logical inverse of `dirty()`. |
| [`markAsDirty()`](#markasdirty) | Marks the field dirty. |
| [`markAsPristine()`](#markaspristine) | Clears the field's stored dirty state. |
| **Availability** | |
| [`disabled()`](#disabled) | Whether the field is disabled locally or by an ancestor. |
| [`disabledReasons()`](#disabledreasons) | Active local and inherited disabled causes. |
| [`enabled()`](#enabled) | Logical inverse of `disabled()`. |
| [`disable(message?)`](#disable) | Disables the field and optionally records a reason. |
| [`enable()`](#enable) | Clears the imperative disabled state. |
| [`readonly()`](#readonly) | Whether the field is readonly locally or through an ancestor. |
| [`writable()`](#writable) | Logical inverse of `readonly()`. |
| [`markAsReadonly()`](#markasreadonly) | Marks the field readonly. |
| [`markAsWritable()`](#markaswritable) | Clears the imperative readonly state. |
| [`hidden()`](#hidden) | Whether the field is hidden locally or through an ancestor. |
| [`visible()`](#visible) | Logical inverse of `hidden()`. |
| [`hide()`](#hide) | Marks the field hidden. |
| [`show()`](#show) | Clears the imperative hidden state. |
| **Submission** | |
| [`submitting()`](#submitting) | Whether an ancestor form is running its submission action. |

Programmatic `set()` and `update()` do not mark a field dirty. `value.control.set()` does. A disabled,
readonly, or hidden field reports `touched()` and `dirty()` as `false` without discarding the stored
state; the state is visible again when the field becomes interactive.

<div className="api-member-reference">

## 📖 Property reference {#property-reference}

Each entry includes its consumer-facing signature, what it represents or returns, and a complete
example. `TValue` means the field's inferred value type. `ParentNode` and `RootNode` represent the
precise parent and root types inferred from where the field is declared.

### ◆ Value and tree properties {#value-and-tree-properties}

#### – Callable value {#callable-value}

**Signature:** `(): TValue`

Calls the field as a signal and returns its current committed value. This is the recommended value
read.

```ts
const username = field('ada');

username(); // 'ada'
```

#### – value() {#value}

**Signature:** `value: NodeValueSignal<TValue, TValue>`

Contains the exposed committed value. Configured `equal` checks may retain an earlier equivalent value. For all three views and their setters, see the [value views reference](./node-value.md).

```ts
const username = field('ada');

username.value(); // 'ada'
```

Prefer the equivalent callable form, `username()`, for ordinary value reads.

#### – value.committed() {#value-committed}

**Signature:** `value.committed: Signal<TValue> & { set(value: TValue): void }`

Reads the latest committed data, bypassing configured `equal` checks on this node and its
children. Pending debounce is still respected. Normal signal identity checks still apply.
See the [value views reference](./node-value.md#value-committed) for an executable example.

#### – value.committed.set() {#value-committed-set}

**Signature:** `value.committed.set(value: TValue): void`

Equivalent to `set(value)`: commits immediately, cancels pending input, preserves dirty/touched
state, and follows normal validation and parent propagation. Exposed reads still honor `equal`.
See the [setter example](./node-value.md#value-committed-set).

#### – value.control() {#controlvalue}

**Signature:** `value.control: Signal<TValue>`

Contains the immediate value most recently received from a bound UI control.

```ts
const username = field('ada', {
  debounce: 300,
});

username.value.control(); // 'ada'
```

During debounce, `value.control()` contains the pending control value while `username()` still
contains the last committed value.

#### – value.control.set() {#setcontrolvalue}

**Signature:** `value.control.set(value: TValue): void`

Receives a value from a UI control, marks the field dirty, and applies the configured debounce
before committing it. Control bindings normally call this method for you.

```ts
const username = field('', {
  debounce: 'blur',
});

username.value.control.set('ada');
username.value.control(); // 'ada'
username(); // ''
username.dirty(); // true
```

#### – nodeType() {#nodetype}

**Signature:** `nodeType(): 'field'`

Returns the stable primitive discriminant for this node.

```ts
const username = field('ada');

username.nodeType(); // 'field'
```

#### – form() {#form}

**Signature:** `form: Signal<FormNode | null>`

Returns the nearest explicit `form()` containing the field, or `null` when the field belongs only
to a standalone `group()` or `array()`, or is itself standalone. A nested explicit form owns its
descendant fields.

```ts
const profile = form({
  username: field('ada'),
});

profile.username.form() === profile; // true
```

#### – root() {#root}

**Signature:** `root: Signal<RootNode>`

Returns the complete structural root containing the field. A standalone or detached field returns
itself, and this lookup crosses nested form workflow boundaries.

```ts
const username = field('ada');

username.root() === username; // true
```

#### – parent() {#parent}

**Signature:** `parent: Signal<ParentNode | null>`

Returns the direct parent node, or `null` when the field is standalone or has been detached.

```ts
const profile = form({
  username: field('ada'),
});

profile.username.parent() === profile; // true
```

#### – path() {#path}

**Signature:** `path: Signal<readonly string[]>`

Returns the property and array-index segments from the root to the field. Array indexes are string
segments.

```ts
const profile = form({
  address: {
    city: field('Zurich'),
  },
});

profile.address.city.path(); // ['address', 'city']
```

#### – keyInParent() {#keyinparent}

**Signature:** `keyInParent: Signal<string | number | null>`

Returns the property name or array index under which the field is stored, or `null` at the root.

```ts
const profile = form({
  username: field('ada'),
});

profile.username.keyInParent(); // 'username'
```

#### – $api {#api-1}

**Signature:** `$api: CallableNodeApi<CallableNodeApi<FieldApi<TValue>>>`

Exposes the complete callable API through the collision-safe convention shared by every node kind.

```ts
const profile = form({
  api: field('public-profile-api'),
  username: field('ada'),
});

profile.api(); // 'public-profile-api'
profile.$api.valid(); // true
profile.username.$api.valid(); // true
```

### ◆ Validation properties {#validation-properties}

#### – validators() {#validators}

**Signature:** `validators: Signal<Validators<TValue>> & { (options: { resolve?: boolean }): Validators<TValue> }`

Contains the normalized validators owned directly by the field, in declaration order.

```ts
const username = field('', [required, minLength(3)]);

username.validators().length; // 2
```

#### – errors() {#errors}

**Signature:** `errors: NodeErrorsSignal<TNode>`

Reads own errors by default. Pass `{ descendants: true }` to include every descendant, exactly as `allErrors()` does. `{ descendants: false }`, `{}`, and no arguments read only own errors. `TNode` is this concrete node type.

The property remains an Angular `Signal`. Own reads preserve the concrete `targetNode` type; descendant reads use [`AnyNode`](./types/any-node.md) because errors can belong to different node kinds. See [error queries](./validation-errors.md#error-queries) for an executable example.

Contains the current validation errors owned by the field.

```ts
const username = field('', [required]);

username.errors()[0]?.kind; // 'required'
```

#### – allErrors() {#allerrors}

**Signature:** `allErrors: Signal<readonly ValidationError[]>`

Shortcut for `errors({ descendants: true })`, returning the same cached array.

Contains errors from the field and its descendants. A field has no descendants, so it contains the
same errors as `errors()`.

```ts
const username = field('', [required]);

username.allErrors()[0]?.targetNode === username; // true
```

#### – valid() {#valid}

**Signature:** `valid: Signal<boolean>`

Returns whether validation has completed without errors. It is `false` while validity is unknown.

```ts
const username = field('ada', [required]);

username.valid(); // true
```

#### – invalid() {#invalid}

**Signature:** `invalid: Signal<boolean>`

Returns whether the field currently has at least one validation error.

```ts
const username = field('', [required]);

username.invalid(); // true
```

#### – required() {#required}

**Signature:** `required: Signal<boolean>`

Returns whether active validation metadata currently marks the field as required.

```ts
const username = field('', [required]);

username.required(); // true
```

#### – pending() {#pending}

**Signature:** `pending: Signal<boolean>`

Returns whether one or more asynchronous validation operations are active on the field.

```ts
const username = field('', {
  validators: asyncValidator(async () => {
    await checkUsername();
    return null;
  }),
});

username.pending(); // true while checkUsername() is running
```

#### – validationStatus() {#validationstatus}

**Signature:** `validationStatus: Signal<'valid' | 'invalid' | 'unknown'>`

Returns the field's current validation phase.

```ts
const username = field('', [required]);

username.validationStatus(); // 'invalid'
```

`'unknown'` means asynchronous validation is pending and no existing error currently makes the
field invalid. In that phase, both `valid()` and `invalid()` are `false`.

### ◆ Constraint metadata {#constraint-metadata}

Built-in validators expose reactive metadata used by `[formNode]` to synchronize native control
constraints. See the [built-in validator reference](./built-in-validators.md) for each validator.

#### – min() {#min}

**Signature:** `min: Signal<NonNullable<TValue> | null>`

Contains the strictest minimum contributed by active numeric or date validators.

```ts
const age = field(18, [min(16), min(18)]);

age.min(); // 18
```

#### – max() {#max}

**Signature:** `max: Signal<NonNullable<TValue> | null>`

Contains the strictest maximum contributed by active numeric or date validators.

```ts
const age = field(18, [max(120), max(99)]);

age.max(); // 99
```

#### – minLength() {#minlength}

**Signature:** `minLength: Signal<number | null>`

Contains the strictest minimum length contributed by active length validators.

```ts
const username = field('', [minLength(3), minLength(5)]);

username.minLength(); // 5
```

#### – maxLength() {#maxlength}

**Signature:** `maxLength: Signal<number | null>`

Contains the strictest maximum length contributed by active length validators.

```ts
const username = field('', [maxLength(30), maxLength(20)]);

username.maxLength(); // 20
```

#### – pattern() {#pattern}

**Signature:** `pattern: Signal<readonly RegExp[]>`

Contains every regular expression contributed by active pattern validators.

```ts
const username = field('', [pattern(/^[a-z]+$/)]);

username.pattern(); // [/^[a-z]+$/]
```

### ◆ Interaction properties {#interaction-properties}

#### – touched() {#touched}

**Signature:** `touched: Signal<boolean>`

Returns whether the field has stored touched state and is currently interactive.

```ts
const username = field('ada');

username.markAsTouched();
username.touched(); // true
```

#### – untouched() {#untouched}

**Signature:** `untouched: Signal<boolean>`

Returns the logical inverse of `touched()`.

```ts
const username = field('ada');

username.untouched(); // true
```

#### – dirty() {#dirty}

**Signature:** `dirty: Signal<boolean>`

Returns whether the field has stored user-modified state and is currently interactive.

```ts
const username = field('ada');

username.markAsDirty();
username.dirty(); // true
```

#### – pristine() {#pristine}

**Signature:** `pristine: Signal<boolean>`

Returns the logical inverse of `dirty()`.

```ts
const username = field('ada');

username.pristine(); // true
```

### ◆ Availability properties {#availability-properties}

#### – disabled() {#disabled}

**Signature:** `disabled: Signal<boolean>`

Returns whether the field is effectively disabled by its own state, configuration, or an ancestor.

```ts
const username = field('', {
  disabled: true,
});

username.disabled(); // true
```

#### – disabledReasons() {#disabledreasons}

**Signature:** `disabledReasons: Signal<readonly DisabledReason[]>`

Contains all active local and inherited disabled causes, including each source node and optional
message.

```ts
const username = field('', {
  disabled: 'Profile is locked',
});

username.disabledReasons()[0]?.message; // 'Profile is locked'
```

#### – enabled() {#enabled}

**Signature:** `enabled: Signal<boolean>`

Returns the logical inverse of `disabled()`.

```ts
const username = field('ada');

username.enabled(); // true
```

#### – readonly() {#readonly}

**Signature:** `readonly: Signal<boolean>`

Returns whether the field is effectively readonly through its own state or an ancestor.

```ts
const username = field('', {
  readonly: true,
});

username.readonly(); // true
```

#### – writable() {#writable}

**Signature:** `writable: Signal<boolean>`

Returns the logical inverse of `readonly()` and indicates whether a bound control may commit value
changes.

```ts
const username = field('ada');

username.writable(); // true
```

#### – hidden() {#hidden}

**Signature:** `hidden: Signal<boolean>`

Returns whether the field is effectively hidden through its own state or an ancestor.

```ts
const username = field('', {
  hidden: true,
});

username.hidden(); // true
```

#### – visible() {#visible}

**Signature:** `visible: Signal<boolean>`

Returns the logical inverse of `hidden()`.

```ts
const username = field('ada');

username.visible(); // true
```

### ◆ Control and submission properties {#control-and-submission-properties}

#### – debouncing() {#debouncing}

**Signature:** `debouncing: Signal<boolean>`

Returns whether a control-originated value is waiting for the field's numeric, blur-based, or
asynchronous debounce to complete.

```ts
const username = field('', {
  debounce: 300,
});

username.debouncing(); // false before a bound control has a pending value
```

#### – submitting() {#submitting}

**Signature:** `submitting: Signal<boolean>`

Returns whether an ancestor form is currently running its submission action. A field cannot
initiate submission itself.

```ts
const profile = form({
  username: field('ada'),
}, {
  onSubmit: async () => saveProfile(),
});

profile.username.submitting(); // true while saveProfile() is running
```

## 📖 Method reference {#method-reference}

Each entry includes its consumer-facing signature, behavior, and return value.

### ◆ Update values and control state {#update-values-and-control-state}

#### – set() {#set}

**Signature:** `set(value: TValue): void`

Immediately assigns both the committed and control values, cancels pending debounce, and does not
mark the field dirty.

```ts
const username = field('ada');

username.set('grace');
username(); // 'grace'
username.dirty(); // false
```

#### – update() {#update}

**Signature:** `update(updater: (value: TValue) => TValue): void`

Passes the current committed value to a callback and immediately assigns its result without marking
the field dirty.

```ts
const username = field('  ada  ');

username.update(value => value?.trim() ?? null);
username(); // 'ada'
```

#### – reset() {#reset}

**Signatures:** `reset(): void` · `reset(value: TValue): void`

Cancels pending control input and clears touched and dirty state. Without an argument it keeps the
current committed value; with a value it assigns that value first.

```ts
const username = field('ada');

username.markAsTouched();
username.markAsDirty();
username.reset('grace');

username(); // 'grace'
username.touched(); // false
username.pristine(); // true
```

`api.patch(value)` also exists for a uniform node API and is equivalent to `set(value)`. Use
`set()` directly in ordinary field code. The callable field also carries `patch` at runtime, but
its public type exposes this operation only through `$api`.

#### – flush() {#flush}

**Signature:** `flush(): void`

Immediately commits a pending `value.control()` and ends its debounce. It is a no-op when nothing is
pending.

```ts
const username = field('', {
  debounce: 300,
});

username.value.control.set('ada');
username.flush();
username(); // 'ada'
username.debouncing(); // false
```

#### – focus() {#focus}

**Signature:** `focus(options?: FocusOptions): void`

Focuses the first `[formNode]` control bound to the field in DOM order. It forwards standard
`FocusOptions` and does nothing when no control is bound.

<CodeBlock language="ts">{fieldFocusSource}</CodeBlock>

### ◆ Validation and interaction {#validation-and-interaction}

#### – setValidators() {#setvalidators}

**Signature:** `setValidators(validators: ValidatorSource<TValue, FieldNode<TValue>>): void`

Replaces the field's validator source and immediately validates the current committed value. The
source may itself be reactive.

```ts
const username = field('ada');

username.setValidators(minLength(5));
username.invalid(); // true
```

#### – getError() {#geterror}

**Signature:** `getError(kind: string): ValidationError | undefined`

Returns the first field-owned error with the requested kind. Known built-in kinds preserve their
specific inferred error shape.

```ts
const username = field('', [required]);

username.getError('required')?.kind; // 'required'
username.getError('minLength'); // undefined
```

#### – markAsTouched() {#markastouched}

**Signature:** `markAsTouched(options?: { skipDescendants?: boolean }): void`

Marks the field touched and flushes pending control input. `skipDescendants` is accepted for API
consistency; a field has no descendants.

```ts
const username = field('ada');

username.markAsTouched();
username.touched(); // true
```

#### – markAsUntouched() {#markasuntouched}

**Signature:** `markAsUntouched(): void`

Clears the field's stored touched state.

```ts
const username = field('ada');

username.markAsTouched();
username.markAsUntouched();
username.untouched(); // true
```

#### – markAsDirty() {#markasdirty}

**Signature:** `markAsDirty(): void`

Marks the field's stored state as dirty without changing its value.

```ts
const username = field('ada');

username.markAsDirty();
username.dirty(); // true
```

#### – markAsPristine() {#markaspristine}

**Signature:** `markAsPristine(): void`

Clears the field's stored dirty state without changing its value.

```ts
const username = field('ada');

username.markAsDirty();
username.markAsPristine();
username.pristine(); // true
```

### ◆ Availability {#availability-1}

#### – disable() {#disable}

**Signature:** `disable(message?: string): void`

Disables the field. An optional message records a user-facing reason.

```ts
const username = field('ada');

username.disable('Profile is locked');
username.disabled(); // true
username.disabledReasons()[0]?.message; // 'Profile is locked'
```

#### – enable() {#enable}

**Signature:** `enable(): void`

Clears the disabled state created by `disable()`. A configured or inherited cause can still keep
the field disabled.

```ts
const username = field('ada');

username.disable();
username.enable();
username.enabled(); // true
```

#### – markAsReadonly() {#markasreadonly}

**Signature:** `markAsReadonly(): void`

Marks the field readonly, preventing bound controls from committing value changes.

```ts
const username = field('ada');

username.markAsReadonly();
username.writable(); // false
```

#### – markAsWritable() {#markaswritable}

**Signature:** `markAsWritable(): void`

Clears the state created by `markAsReadonly()`. Configured or inherited readonly state can still
apply.

```ts
const username = field('ada');

username.markAsReadonly();
username.markAsWritable();
username.writable(); // true
```

#### – hide() {#hide}

**Signature:** `hide(): void`

Marks the field hidden without changing its value.

```ts
const username = field('ada');

username.hide();
username.visible(); // false
```

#### – show() {#show}

**Signature:** `show(): void`

Clears the state created by `hide()`. Configured or inherited hidden state can still apply.

```ts
const username = field('ada');

username.hide();
username.show();
username.visible(); // true
```

</div>

## 🔌 Binding in Angular {#binding-in-angular}

```ts
import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNodeDirective],
  template: `<input [formNode]="myForm.name" />`,
})
export class ProfileEditor {
  myForm = form({
    name: field(''),
  });
}
```

The binding synchronizes values, interaction state, validation constraints, accessibility state,
and debounce. See [Control binding](../guides/control-binding.md) and the
[shared Node API](./node-api.md).

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

For this field, the baseline is its declaration value, or its effective supplied initialization
when created as part of an array item. Supported containers are copied; opaque objects retain
references and their in-place mutations cannot be undone.

See [Reset and restore initial values](../guides/reset-and-restore.md) for executable examples,
server-loaded records, nested arrays, dynamically added fields, snapshot boundaries, validation,
and native reset buttons.


## Value change callback {#onvaluechange}

```ts
onValueChange?(value: TValue, node: FieldNode<TValue>): void;
```

Add `onValueChange` to the options to react synchronously to committed public value changes.
The callback skips initialization, respects `equal` and control debounce, and receives the typed
node. Aggregate operations notify after their children are updated. It runs without dependency
tracking or an injection-context requirement and does not wait for asynchronous validation.
See [value change callbacks](../guides/configuring-nodes.md#value-changes) for the executable example,
reset and array behavior, callback ordering, and error handling.
