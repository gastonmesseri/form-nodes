---
title: form()
---

import CodeBlock from '@theme/CodeBlock';
import emptyChildRecordSource from '!!raw-loader!../../examples/empty-child-record.example.ts';
import childInferenceSource from '!!raw-loader!../../examples/for-each-child-inference.typecheck.ts';
import validationQueriesSource from '!!raw-loader!../../examples/validation-queries.example.ts';
import childrenUnionSource from '!!raw-loader!../../examples/children-union.example.ts';
import forEachChildSource from '!!raw-loader!../../examples/for-each-child.example.ts';
import formFocusSource from '!!raw-loader!../../examples/form-focus.typecheck.ts';
import formValueContractSource from '!!raw-loader!../../examples/form-value-contract.typecheck.ts';
import formFieldShorthandSource from '!!raw-loader!../../examples/form-field-shorthand.typecheck.ts';
import objectShorthandFormNodeSource from '!!raw-loader!../../examples/object-shorthand-form-node.typecheck.ts';

# form() {#form}

`form()` creates a typed object tree that owns a submission workflow. Its initial children are
fixed and precisely inferred; named children can also be attached and detached explicitly at
runtime. Use groups or nested object shorthand for ordinary structural branches.

Not sure which node shape fits a value? See [Choosing a primitive](../guides/choosing-a-primitive.md).

:::info Safe outside Angular injection contexts

`form()` can be safely created and used outside an Angular injection context. Value and tree
operations, state, submission invoked directly, synchronous validation, and asynchronous validation
all continue to work. When an injector is available, its `DestroyRef` provides deterministic
cleanup; without one, Form Nodes uses weak ownership so an unreachable form tree can be
garbage-collected.

:::

```ts
import { array, field, form, group } from '@ngblocks/form-nodes';

const myForm = form({
  name: field(''),
  address: {
    city: field(''),
    country: field(''),
  },
  tags: array(field('')),
});
```

## 🧭 API map {#api-map}

| I want to… | Start with | Details |
| --- | --- | --- |
| Create or configure a form | `form(...)`, `FormOptions` | [Signatures](#signatures) and [options](#options) |
| Read its value or navigate children | `myForm()`, direct children, `children` | [Properties and methods](#properties-and-methods) |
| Replace, derive, patch, or reset values | `set()`, `update()`, `patch()`, `reset()` | [Method reference](#method-reference) |
| Add, find, or remove runtime children | `add()`, `get()`, `remove()` | [Dynamic children](#dynamic-children) |
| Inspect or replace validation | `errors()`, `allErrors()`, `valid()`, `setValidators()` | [Validation properties](#validation-properties) |
| Manage touched and dirty state | `markAsTouched()`, `markAsDirty()`, `reset()` | [Interaction properties](#interaction-properties) |
| Manage disabled, readonly, or hidden state | `disable()`, `markAsReadonly()`, `hide()` | [Availability properties](#availability-properties) |
| Commit or focus bound controls | `flush()`, `focus()` | [Control and submission properties](#control-and-submission-properties) |
| Run a configured action | `submit()`, `submitting()` | [Submission methods](#submission-methods) |
| Handle a child/API name collision | `$api` | [API properties](#api-properties) |

Inline validators receive `ctx.node()` and `ctx.field()` typed as this primitive, preserving its
value type and any declared children or array items. Inline `validator()` and `asyncValidator()`
helpers retain that inference when their generics are omitted. See
[Inline node inference](../concepts/tree-and-api.md#inline-node-inference).

## 📐 Signatures {#signatures}

```ts
form(definitions, options?);
form(definitions, validators, options?);
```

### 🔸 Extract the value type {#extract-the-value-type}

Use `FormNodeValue<typeof myForm>` to derive a reusable value type from a form instance, including
nested objects, arrays, and field nullability:

```ts
type MyFormValue = FormNodeValue<typeof myForm>;
```

Import the type from `@ngblocks/form-nodes`. See the dedicated
[`FormNodeValue` reference](./form-node-value.md) for a complete example and the distinction from
the child-map helper `FormValue<TNodes>`.

### 🔸 Check a named value model {#check-a-named-value-model}

Use `satisfies FormValueContract<Model>` when the complete value must conform to a named domain
model. `satisfies` checks the callable form value and its `value` signal without replacing the type
inferred from `definitions`:

<CodeBlock language="ts">{formValueContractSource}</CodeBlock>

Here `profile()` and `profile.value()` conform to `Profile`, while each child retains its inferred
field type. `field.strict<string>('Switzerland')` gives `country` the non-nullable `string` type
required by the model; ordinary `field()` declarations keep `username` and `age` nullable. An
incompatible child value produces a TypeScript error at the `satisfies` expression. The same contract can check a `group()` because both primitives expose a callable
aggregate value and a `value` signal. See the dedicated
[`FormValueContract` reference](./form-value-contract.md) for nullability, incompatible-model,
annotation, and structural-compatibility details.

Nested object definitions are normalized to groups. Use an explicit `group()` when that level needs
validators, structural options, or validator messages. Use an explicit nested `form()` only when
that branch needs an independent submission workflow.

### 🔸 `field()` shorthand {#field-shorthand}

Values such as `string`, `number`, `boolean`, `Date`, `null`, and `undefined`, as well as arrays
and class instances, are concise alternatives to calling `field()`. Nested plain object literals
remain group shorthand:

<CodeBlock language="ts">{formFieldShorthandSource}</CodeBlock>

You can inspect how each shorthand was normalized with `nodeType()`:

```ts
myForm.name.nodeType() === 'field'; // true
myForm.birthday.nodeType() === 'field'; // true
myForm.address.nodeType() === 'group'; // true
myForm.company.nodeType() === 'group'; // true
myForm.roles.nodeType() === 'field'; // true
myForm.recentCompanies.nodeType() === 'field'; // true
```

The equivalent explicit declarations are `field('')`, `field(null)`, `field(2)`,
`field(new Date())`, and `field(undefined)`. As with those calls, `null` and `undefined` infer
`FieldNode&lt;unknown&gt;`; other values infer their widened value type plus `null`.
Use an explicit `field()` when the child needs validators, state options, debounce, or a more
specific generic than the initial value can provide.

See the [declaration shorthand matrix](../concepts/creating-nodes.md#declaration-shorthand-matrix)
for every normalization category, its explicit equivalent, and the cases that require
`field()`, `group()`, or `array()`.

Every array value, including an empty array, populated array, readonly tuple, or array of plain
objects, becomes one `FieldNode`. Its interpretation never depends on its length or first item. To
create a dynamic `ArrayNode` with independently addressable item nodes, declare `array(...)`
explicitly. Use `field([...])` when making the atomic array-value intent visually explicit or when
the field needs configuration. An empty `[]` shorthand infers `FieldNode<unknown[] | null>` instead of
the unusably narrow `FieldNode<never[] | null>`; use `field<Item[]>([])` when the item type is known.

:::info Declaration property rules

Definitions use own enumerable string-keyed data properties. Inherited and non-enumerable
properties are ignored. Enumerable getters/setters, symbol keys, and the prototype-sensitive
`__proto__` key are rejected before any node is created. The error includes the complete path, for
example `profile.roles`, and recommends an explicit primitive where applicable. String keys such
as `constructor` and `prototype` remain valid children.

:::

Every other value becomes an implicit field. This includes arrays, ordinary functions, and non-plain
objects such as `RegExp`, `URL`, maps, sets, typed arrays, Temporal or Moment-like values, and
custom class instances. Only plain objects—with `Object.prototype` or a `null` prototype—are
interpreted as nested groups.

Primitive shorthand is therefore a convenient and unambiguous choice for values such as strings,
numbers, booleans, and dates. Be more deliberate with object values: a plain object means a nested
group, while a class instance or another non-plain object means one atomic field. When the object
itself is the field value, prefer an explicit `field(myObject)` so that the intended node shape is
obvious and remains stable if the value's construction or type annotation changes:

```ts
const defaultCompany = { companyId: 23, companyName: 'Apple' };

const myForm = form({
  name: '',
  company: field(defaultCompany),
});
```

If `company` is accidentally written as a plain object instead, it becomes a `GroupNode`, but it can
still be bound as one value to a custom control with `[formNode]`. Aggregate nodes support control
binding, so the component's `value` model receives the complete company object and updates are
distributed to the group's children:

<CodeBlock language="ts">{objectShorthandFormNodeSource}</CodeBlock>

This makes the binding usable, but it does not turn `company` into a `FieldNode`: it still exposes
`companyId` and `companyName` child nodes and uses group validation and state aggregation. Prefer
`field(defaultCompany)` when the company is conceptually one atomic field value.

Inline objects and values declared with an object `type` alias infer as groups. TypeScript
interfaces do not guarantee the string-keyed definition contract: use `{ ...value }` when an
interface value should become a group, or `field(value)` when it should remain atomic. The explicit
choice prevents TypeScript's interface/index-signature rules from disagreeing with the runtime
prototype classification.

Type annotations cannot preserve runtime prototype information after a concrete value is widened.
Use explicit `field()` at factory, deserialization, or other broadly typed boundaries when a value
may be a class instance despite being annotated as a plain object shape. The runtime rule is
deterministic, but `field(myObject)` avoids surprising results at these structurally typed
boundaries.

```ts
const myForm = form({
  name: field(''),
  address: group({
    city: field(''),
    country: field(''),
  }, {
    disabled: () => !canEditAddress(),
  }),
});
```

## ⚙️ Options {#options}

| Option | Accepted value | Purpose |
| --- | --- | --- |
| [`validators`](#form-validators-option) | Validator, validator array, `null`, or `undefined` | Validates the complete object value. Child validators continue to run independently. |
| [`equal`](#form-equal-option) | `'shallow'`, `'deep'`, or `(previous, next) => boolean` | Retains equivalent exposed aggregate values; defaults to `Object.is`. |
| [`validatorMessages`](#form-validatormessages-option) | Message catalog or reactive catalog function | Overrides built-in validator messages for this subtree. |
| [`debounce`](#form-debounce-option) | Milliseconds, `'blur'`, or cancelable asynchronous function | Provides the default control-value debounce inherited by descendants. |
| [`hidden`](#form-hidden-option) | Boolean or reactive function | Sets or reactively derives hidden state for the complete subtree. |
| [`disabled`](#form-disabled-option) | Boolean, reason string, or reactive function | Sets or reactively derives disabled state for the complete subtree. |
| [`readonly`](#form-readonly-option) | Boolean or reactive function | Sets or reactively derives readonly state for the complete subtree. |
| [`injector`](#form-injector-option) | Angular `Injector` | Explicitly owns injector-dependent work such as asynchronous validation watchers. |
| [`inheritInjector`](#form-inheritinjector-option) | Boolean; defaults to `true` | Allows an injector-less nested form to use the nearest ancestor injector. |
| [`adoptBindingInjector`](#form-adoptbindinginjector-option) | Boolean; defaults to `true` | Allows direct `[formNode]` binding to provide a temporary host injector. |
| [`onSubmit`](#form-submission-option) | `(value, form) => void \| PromiseLike<void>` | Runs the action initiated by `submit()`. |
| [`onSubmitBlocked`](#form-submission-option) | `(form) => void` | Handles attempts blocked by validation. |
| [`submitWhen`](#form-submission-option) | `'valid' \| 'not-invalid' \| 'always'` | Controls the validation gate; defaults to `'not-invalid'`. |

Forms always have a non-null object value. To represent an optional object as a whole, use an
object-valued `field()` instead.

<div className="api-member-reference">

## ⚙️ Option reference {#option-reference}

Each option includes its signature, default behavior, scope, and a complete example.

### 🔸 Values and validation {#values-and-validation}

#### ⚙️ equal {#form-equal-option}

**Signature:** `equal?: 'shallow' | 'deep' | ((previous: TValue, next: TValue) => boolean)`

Controls the exposed value read by the callable form, its value signal, value-dependent validators,
submission action, and update callbacks. Children and bound controls keep their current committed
values even when the form retains an equivalent previous snapshot. Public parents compose the
exposed child values; internal debounce invalidation remains independent.

See [Aggregate value equality](../concepts/values-and-state.md#aggregate-value-equality) for the
complete executable example, operation contract, lazy evaluation, and comparator behavior.

#### ✅ validators {#form-validators-option}

**Signature:** `validators?: ValidatorSource<FormValue, FormNode<TNodes>>`

Assigns one validator, several validators, or a reactive validator source to the complete form
value. Validators declared by descendants remain independent.

```ts
const credentials = form({
  password: field(''),
  confirmation: field(''),
}, {
  validators: ({ value }) => value().password === value().confirmation
    ? null
    : { kind: 'passwordMismatch' },
});

credentials.invalid(); // false
```

#### 💬 validatorMessages {#form-validatormessages-option}

**Signature:** `validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined)`

Overrides built-in validator messages for this form and its descendants. It may be a static catalog
or a reactive function; a message configured directly on a validator still takes precedence.

```ts
const profile = form({
  username: field('', [required]),
}, {
  validatorMessages: {
    required: 'Enter a username.',
  },
});

profile.allErrors()[0]?.message; // 'Enter a username.'
```

#### ⏱️ debounce {#form-debounce-option}

**Signature:** `debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>)`

Provides the default control-value debounce inherited by descendants. A descendant's local
`debounce` option overrides it. Omit it to commit control-originated values immediately.

```ts
const search = form({
  query: field(''),
  category: field('all'),
}, {
  debounce: 300,
});
```

### 🔸 Availability {#availability}

#### ⚙️ hidden {#form-hidden-option}

**Signature:** `hidden?: boolean | (() => boolean)`

Sets or reactively derives hidden state for the complete form subtree. It defaults to `false`.

```ts
const businessDetails = form({
  companyName: field(''),
}, {
  hidden: () => accountType() !== 'business',
});
```

#### ⚙️ disabled {#form-disabled-option}

**Signature:** `disabled?: boolean | string | (() => boolean | string)`

Sets or reactively derives disabled state for the complete subtree. A string also becomes a message
in `disabledReasons()`. It defaults to `false`.

```ts
const profile = form({
  username: field(''),
}, {
  disabled: 'Profile is locked',
});

profile.disabledReasons()[0]?.message; // 'Profile is locked'
```

#### ⚙️ readonly {#form-readonly-option}

**Signature:** `readonly?: boolean | (() => boolean)`

Sets or reactively derives readonly state for the complete form subtree. It defaults to `false`.

```ts
const profile = form({
  username: field(''),
}, {
  readonly: () => profileArchived(),
});
```

### 🔸 Injector ownership {#injector-ownership}

#### ⚙️ injector {#form-injector-option}

**Signature:** `injector?: Injector`

Provides an explicit lifecycle owner for injector-dependent work such as asynchronous validation.

```ts
const injector = inject(Injector);
const profile = form({
  username: field(''),
}, {
  injector,
});
```

#### ⚙️ inheritInjector {#form-inheritinjector-option}

**Signature:** `inheritInjector?: boolean`

Allows an otherwise injector-less nested form to use the nearest ancestor injector. It defaults to
`true`; `false` creates an inheritance boundary.

```ts
const profile = form({
  username: field(''),
}, {
  inheritInjector: false,
});
```

#### ⚙️ adoptBindingInjector {#form-adoptbindinginjector-option}

**Signature:** `adoptBindingInjector?: boolean`

Allows an otherwise injector-less form to adopt the injector of a directly bound `[formNode]` host
while that binding exists. It defaults to `true`.

```ts
const profile = form({
  username: field(''),
}, {
  adoptBindingInjector: false,
});
```

### 🔸 Submission {#submission}

#### ⚙️ onSubmit, onSubmitBlocked, and submitWhen {#form-submission-option}

**Signatures:**

```ts
onSubmit?(value: TValue, form: TForm): void | PromiseLike<void>;
onSubmitBlocked?(form: TForm): void;
submitWhen?: 'valid' | 'not-invalid' | 'always';
```

Configures `submit()`. `onSubmit(value, form)` runs when the current validation policy allows
submission. `onSubmitBlocked(form)` runs when validation blocks it, including pending validation
with `submitWhen: 'valid'`. Pending validation is not awaited. Concurrent attempts and missing
actions return `false` without invoking `onSubmitBlocked`.

```ts
const profile = form({
  username: field('', [required]),
}, {
  onSubmit: async value => saveProfile(value),
  onSubmitBlocked: invalidForm => invalidForm.focus(),
  submitWhen: 'not-invalid',
});
```

`submitWhen` accepts:

| Value | Submission policy |
| --- | --- |
| `'not-invalid'` | Default. Blocks known errors but permits submission while validity is only unknown. |
| `'valid'` | Requires `valid()`; both errors and pending validation block submission. |
| `'always'` | Runs the action regardless of validation status. |

</div>

## 📖 Properties and methods {#properties-and-methods}

A form is a callable aggregate-value reader with named child properties, reactive signals,
structural operations, submission, and the shared node state API. Signal properties must be called
to read their current value; `children` is a stable readonly map rather than a signal.

| Member | Description |
| --- | --- |
| **Value and tree** | |
| [`myForm()`](#callable-value) | Returns the current committed object value. This is the preferred value-reading form. |
| [`myForm.child`](#named-child-access) | Returns a named child node with its precise inferred type. |
| [`children`](#children) | Stable readonly map of every current named child. |
| [`value()`](#value) | Current committed aggregate value. Equivalent to calling the form directly. |
| [`controlValue()`](#controlvalue) | Complete value from a control bound directly to the form. |
| [`nodeType()`](#nodetype) | Returns the literal `'form'`. |
| [`form()`](#form-1) | This explicit form workflow. |
| [`root()`](#root) | Complete structural root; a root form returns itself. |
| [`parent()`](#parent) | Direct parent node, or `null` at the root or after detachment. |
| [`path()`](#path) | Property path from the root; array indexes are string segments. |
| [`keyInParent()`](#keyinparent) | Property name or array index in the parent, or `null` at the root. |
| [`api`](#api) | Complete form API unless a declared child named `api` takes precedence. |
| [`$api`](#api-1) | Guaranteed collision-safe form API. |
| **Dynamic children** | |
| [`add(key, definition)`](#add) | Attaches and returns one runtime child with its exact inferred node type. |
| [`add(definitions)`](#add) | Atomically attaches and returns several runtime children. |
| [`get(key)`](#get) | Returns a current child by runtime key, or `undefined`. |
| [`remove(key)`](#remove) | Detaches and returns a dynamically added child, or `undefined`. |
| **Value updates** | |
| [`set(value)`](#set) | Assigns a complete object value without marking nodes dirty. |
| [`update(updater)`](#update) | Derives and assigns a complete value from the current value. |
| [`patch(value)`](#patch) | Recursively assigns only supplied child branches. |
| [`reset(value?)`](#reset) | Optionally assigns a value, then recursively clears interaction state. |
| **Validation** | |
| [`validators()`](#validators) | Current normalized validators owned by the form. |
| [`setValidators(source)`](#setvalidators) | Replaces the form validator source and revalidates. |
| [`errors()`](#errors) | Errors owned directly by this form, excluding descendants. |
| [`allErrors()`](#allerrors) | Errors from this form and every current descendant. |
| [`getError(kind)`](#geterror) | First form-owned error with a kind, or `undefined`. |
| [`valid()`](#valid) | Whether the complete form subtree is valid. |
| [`invalid()`](#invalid) | Whether the form or a current descendant is invalid. |
| [`required()`](#required) | Whether active metadata marks the form itself as required. |
| [`pending()`](#pending) | Whether asynchronous validation is active in the subtree. |
| [`validationStatus()`](#validationstatus) | Aggregated `'valid'`, `'invalid'`, or `'unknown'` phase. |
| **Interaction** | |
| [`touched()`](#touched) | Whether the form or a contributing descendant is touched. |
| [`untouched()`](#untouched) | Logical inverse of `touched()`. |
| [`markAsTouched(options?)`](#markastouched) | Marks the form and, by default, every descendant touched. |
| [`markAsUntouched()`](#markasuntouched) | Clears only the form's own stored touched state. |
| [`dirty()`](#dirty) | Whether the form or a contributing descendant is dirty. |
| [`pristine()`](#pristine) | Logical inverse of `dirty()`. |
| [`markAsDirty()`](#markasdirty) | Marks the form's own state dirty. |
| [`markAsPristine()`](#markaspristine) | Clears only the form's own dirty state. |
| **Availability** | |
| [`disabled()`](#disabled) | Whether the form is disabled locally or by an ancestor. |
| [`disabledReasons()`](#disabledreasons) | Active local and inherited disabled causes. |
| [`enabled()`](#enabled) | Logical inverse of `disabled()`. |
| [`disable(message?)`](#disable) | Disables the subtree and optionally records a reason. |
| [`enable()`](#enable) | Clears the imperative disabled state. |
| [`readonly()`](#readonly) | Whether the form is readonly locally or through an ancestor. |
| [`writable()`](#writable) | Logical inverse of `readonly()`. |
| [`markAsReadonly()`](#markasreadonly) | Marks the form subtree readonly. |
| [`markAsWritable()`](#markaswritable) | Clears the imperative readonly state. |
| [`hidden()`](#hidden) | Whether the form is hidden locally or through an ancestor. |
| [`visible()`](#visible) | Logical inverse of `hidden()`. |
| [`hide()`](#hide) | Marks the form subtree hidden. |
| [`show()`](#show) | Clears the imperative hidden state. |
| **Control and submission** | |
| [`debouncing()`](#debouncing) | Whether the form or a descendant has pending control input. |
| [`flush()`](#flush) | Commits pending control values throughout the subtree. |
| [`focus(options?)`](#focus) | Focuses the first bound control in DOM order. |
| [`submitting()`](#submitting) | Whether this form or an ancestor is running submission. |
| [`submit()`](#submit) | Runs the configured submission workflow and returns its outcome. |

Every declared child name takes precedence over ordinary API and native callable member names. The
reserved names `$api` cannot be used as child keys, so those access paths remain stable.

```ts
const profile = form({
  reset: field('Not the reset method'),
});

profile.reset(); // 'Not the reset method'
profile.$api.reset();
```

See [Tree navigation and API access](../concepts/tree-and-api.md) for collision and generic-code
patterns.

<div className="api-member-reference">

## 📖 Property reference {#property-reference}

Each entry includes its consumer-facing signature, what it represents or returns, and a complete
example. `FormValue` means the inferred committed object value, `FormSet` means the complete value
accepted by `set()`, and `FormPatch` means the recursively partial value accepted by `patch()`.

### 🔸 Value and tree properties {#value-and-tree-properties}

#### 📝 Callable value {#callable-value}

**Signature:** `(): FormValue`

Calls the form as a signal and returns its current committed aggregate value. This is the
recommended complete-value read.

```ts
const profile = form({
  username: field('ada'),
  active: field(true),
});

profile(); // { username: 'ada', active: true }
```

#### 🌳 Named child access {#named-child-access}

**Signature:** `readonly [childName]: ChildNode`

Returns a named child node with the precise type inferred from its definition.

```ts
const profile = form({
  username: field('ada'),
  address: {
    city: field('Zurich'),
  },
});

profile.username(); // 'ada'
profile.address.city(); // 'Zurich'
```

#### 🌳 children {#children}

**Signature:** `readonly children: FormChildren`

Returns the stable readonly map of current named child nodes, including dynamically added children.

```ts
const profile = form({
  username: field('ada'),
});

profile.children.username(); // 'ada'
```

Direct access is preferred for initially declared children. Use `get(key)` for
runtime keys. If a declared child is named `children`, use `profile.$api.children` for the map.

#### 📝 value() {#value}

**Signature:** `value: Signal<FormValue>`

Contains the current committed aggregate value.

```ts
const profile = form({
  username: field('ada'),
});

profile.value(); // { username: 'ada' }
```

Prefer the equivalent callable form, `profile()`, for ordinary value reads.

#### 🔌 controlValue() {#controlvalue}

**Signature:** `controlValue: Signal<FormValue>`

Contains the complete value most recently received from a control bound directly to this form.

```ts
const profile = form({
  username: field('ada'),
});

profile.controlValue(); // { username: 'ada' }
```

Pending descendant control values are not aggregated into this signal; read each descendant's
`controlValue()` when that immediate buffered value is needed.

With aggregate `equal`, this control-facing signal can contain newer committed child values than
the exposed form value even without a pending debounce. See [Aggregate value equality](../concepts/values-and-state.md#aggregate-value-equality).

#### 💡 nodeType() {#nodetype}

**Signature:** `nodeType(): 'form'`

Returns the stable primitive discriminant for this node. If a child named `nodeType` shadows the
direct method, use `myForm.$api.nodeType()`.

```ts
const profile = form({
  username: field('ada'),
});

profile.nodeType(); // 'form'
```

#### 🧩 form() {#form-1}

**Signature:** `form: Signal<FormNode>`

Returns this explicit form because every `form()` owns a submission workflow boundary. Descendants
return their nearest explicit form, so a nested form becomes the workflow owner for its subtree.

```ts
const profile = form({
  username: field('ada'),
});

profile.form() === profile; // true
```

#### 🌳 root() {#root}

**Signature:** `root: Signal<RootNode>`

Returns the complete structural root containing this form. A root or detached form returns itself;
a nested form returns the outermost node in the complete tree.

```ts
const checkout = form({
  payment: form({
    card: field(''),
  }),
});

checkout.payment.form() === checkout.payment; // true
checkout.payment.root() === checkout; // true
```

#### 🌳 parent() {#parent}

**Signature:** `parent: Signal<ParentNode | null>`

Returns the direct parent node, or `null` when the form is a root or has been detached.

```ts
const profile = form({
  settings: form({
    theme: field('system'),
  }),
});

profile.settings.parent() === profile; // true
```

#### 🌳 path() {#path}

**Signature:** `path: Signal<readonly string[]>`

Returns the property and array-index segments from the root to this form.

```ts
const profile = form({
  settings: form({
    theme: field('system'),
  }),
});

profile.settings.path(); // ['settings']
```

#### 🌳 keyInParent() {#keyinparent}

**Signature:** `keyInParent: Signal<string | number | null>`

Returns the property name or array index under which the form is stored, or `null` at the root.

```ts
const profile = form({
  settings: form({
    theme: field('system'),
  }),
});

profile.settings.keyInParent(); // 'settings'
```

### 🔸 API properties {#api-properties}

#### 📖 api {#api}

**Signature:** `api: FormApi`

Exposes the complete form API as a plain object unless a declared child named `api` takes
precedence.

```ts
const profile = form({
  username: field('ada'),
});

profile.api.valid(); // true
```

Direct operations such as `profile.valid()` are preferred.

#### 📖 $api {#api-1}

**Signature:** `$api: FormApi`

Always exposes the complete form API, even when a child collides with an API member.

```ts
const profile = form({
  api: field('public-profile-api'),
  reset: field('reset label'),
});

profile.api(); // 'public-profile-api'
profile.reset(); // 'reset label'
profile.$api.reset();
```

### 🔸 Validation properties {#validation-properties}

#### ✅ validators() {#validators}

**Signature:** `validators: Signal<Validators<FormValue>> & { (options: { resolve?: boolean }): Validators<FormValue> }`

Contains the normalized validators owned directly by the form, in declaration order.

```ts
const credentials = form({
  password: field('secret'),
  confirmation: field('secret'),
}, {
  validators: credentialsMatch,
});

credentials.validators().length; // 1
```

#### 🚨 errors() {#errors}

**Signature:** `errors: Signal<readonly ValidationError[]>`

Contains validation errors owned directly by the form and excludes descendant errors.

```ts
const credentials = form({
  password: field('secret'),
  confirmation: field('different'),
}, {
  validators: credentialsMatch,
});

credentials.errors()[0]?.kind; // 'passwordMismatch'
```

#### 🚨 allErrors() {#allerrors}

**Signature:** `allErrors: Signal<readonly ValidationError[]>`

Contains errors from the form and every current descendant. Each error identifies its `targetNode`.

```ts
const profile = form({
  username: field('', [required]),
});

profile.allErrors()[0]?.kind; // 'required'
profile.errors(); // []
```

#### 💡 valid() {#valid}

**Signature:** `valid: Signal<boolean>`

Returns whether the form and every current descendant have completed validation without errors.

```ts
const profile = form({
  username: field('ada', [required]),
});

profile.valid(); // true
```

#### 🚨 invalid() {#invalid}

**Signature:** `invalid: Signal<boolean>`

Returns whether the form or any current descendant contributes a validation error.

```ts
const profile = form({
  username: field('', [required]),
});

profile.invalid(); // true
```

#### ✅ required() {#required}

**Signature:** `required: Signal<boolean>`

Returns whether active validation metadata marks the form itself as required. Forms still have a
non-null object value.

```ts
const profile = form({
  username: field('ada'),
}, {
  validators: required,
});

profile.required(); // true
```

#### ⏳ pending() {#pending}

**Signature:** `pending: Signal<boolean>`

Returns whether asynchronous validation is active on the form or a current descendant.

```ts
const profile = form({
  username: field('ada'),
}, {
  validators: asyncValidator(async () => {
    await checkProfile();
    return null;
  }),
});

profile.pending(); // true while checkProfile() is running
```

#### ✅ validationStatus() {#validationstatus}

**Signature:** `validationStatus: Signal<'valid' | 'invalid' | 'unknown'>`

Returns the aggregate validation phase for the form subtree.

```ts
const profile = form({
  username: field('', [required]),
});

profile.validationStatus(); // 'invalid'
```

`'unknown'` means asynchronous validation is pending and no available error currently makes the
subtree invalid.

### 🔸 Interaction properties {#interaction-properties}

#### 👆 touched() {#touched}

**Signature:** `touched: Signal<boolean>`

Returns whether the form or any contributing current descendant has been marked touched.

```ts
const profile = form({
  username: field('ada'),
});

profile.username.markAsTouched();
profile.touched(); // true
```

#### 👆 untouched() {#untouched}

**Signature:** `untouched: Signal<boolean>`

Returns the logical inverse of `touched()`.

```ts
const profile = form({
  username: field('ada'),
});

profile.untouched(); // true
```

#### 👆 dirty() {#dirty}

**Signature:** `dirty: Signal<boolean>`

Returns whether the form's own state or any contributing descendant reports user-modified state.

```ts
const profile = form({
  username: field('ada'),
});

profile.username.markAsDirty();
profile.dirty(); // true
```

#### 👆 pristine() {#pristine}

**Signature:** `pristine: Signal<boolean>`

Returns the logical inverse of `dirty()`.

```ts
const profile = form({
  username: field('ada'),
});

profile.pristine(); // true
```

### 🔸 Availability properties {#availability-properties}

#### 🎛️ disabled() {#disabled}

**Signature:** `disabled: Signal<boolean>`

Returns whether the form is effectively disabled by its own state, configuration, or an ancestor.

```ts
const profile = form({
  username: field('ada'),
}, {
  disabled: true,
});

profile.disabled(); // true
```

#### 🎛️ disabledReasons() {#disabledreasons}

**Signature:** `disabledReasons: Signal<readonly DisabledReason[]>`

Contains all active local and inherited causes of the disabled state, including each source node
and optional message.

```ts
const profile = form({
  username: field('ada'),
}, {
  disabled: 'Profile is locked',
});

profile.disabledReasons()[0]?.message; // 'Profile is locked'
profile.username.disabled(); // true
```

#### 🎛️ enabled() {#enabled}

**Signature:** `enabled: Signal<boolean>`

Returns the logical inverse of `disabled()`.

```ts
const profile = form({
  username: field('ada'),
});

profile.enabled(); // true
```

#### 🎛️ readonly() {#readonly}

**Signature:** `readonly: Signal<boolean>`

Returns whether the form is effectively readonly through its own state or an ancestor.

```ts
const profile = form({
  username: field('ada'),
}, {
  readonly: true,
});

profile.readonly(); // true
```

#### 🎛️ writable() {#writable}

**Signature:** `writable: Signal<boolean>`

Returns the logical inverse of `readonly()` and indicates whether a control bound directly to the
form may commit value changes.

```ts
const profile = form({
  username: field('ada'),
});

profile.writable(); // true
```

#### 🎛️ hidden() {#hidden}

**Signature:** `hidden: Signal<boolean>`

Returns whether the form is effectively hidden through its own state or an ancestor.

```ts
const profile = form({
  username: field('ada'),
}, {
  hidden: true,
});

profile.hidden(); // true
```

#### 🎛️ visible() {#visible}

**Signature:** `visible: Signal<boolean>`

Returns the logical inverse of `hidden()`.

```ts
const profile = form({
  username: field('ada'),
});

profile.visible(); // true
```

### 🔸 Control and submission properties {#control-and-submission-properties}

#### ⏱️ debouncing() {#debouncing}

**Signature:** `debouncing: Signal<boolean>`

Returns whether the form itself or a current descendant has control input awaiting commit.

```ts
const search = form({
  query: field('', { debounce: 300 }),
});

search.debouncing(); // false before a bound control has a pending value
```

#### 📨 submitting() {#submitting}

**Signature:** `submitting: Signal<boolean>`

Returns whether this form or an ancestor form is currently running its submission action.

```ts
const profile = form({
  username: field('ada'),
}, {
  onSubmit: async () => saveProfile(),
});

profile.submitting(); // true while saveProfile() is running
profile.username.submitting(); // true while saveProfile() is running
```

## 📖 Method reference {#method-reference}

Each entry includes its consumer-facing signature, behavior, and return value.

### 🔸 Dynamic children {#dynamic-children}

#### 💡 add() {#add}

**Signatures:** `add(key: string, definition): AddedNode` ·
`add(definitions): AddedNodes`

Attaches one child or several children at runtime. A single definition returns its exact attached
node; an object returns an exact keyed map. Plain nested objects become `group()` nodes.
Concise values, including arrays, use the same `field()` shorthand as the initial declaration.

```ts
const profile = form({
  username: field('ada'),
});

const age = profile.add('age', field(36));
age(); // 36
profile.get('age') === age; // true

const added = profile.add({
  nickname: field('countess'),
  preferences: {
    theme: field('dark'),
  },
});

added.nickname(); // 'countess'
added.preferences.theme(); // 'dark'
profile.get('preferences') === added.preferences; // true
```

Keys must be new, definitions must be detached, and `$api` is reserved. The object
form is atomic: validation completes before any supplied child is attached. Keep the returned node
for its exact type, or retrieve it later with `get()`. Array values become
fields; declare `array(...)` explicitly for a dynamic node collection. Wrap a plain application
object with `field(value)` when it should remain one atomic value.

#### 💡 get() {#get}

**Signature:** `get(key: string): DynamicNode | undefined`

Returns a current child by runtime key. Dynamically added children deliberately do not become
direct properties, so misspelled names fail TypeScript and Angular template checking.

:::important

Use `profile.name` only for a child included in the original `form()` declaration. After
`profile.add('age', ...)`, use the returned node or `profile.get('age')`. Neither `profile.age` nor `profile['age']` is supported.

:::

```ts
const profile = form({ username: field('ada') });
profile.add('age', field(36));

profile.get('age')?.value(); // 36
profile.get('missing'); // undefined
```

#### 📚 remove() {#remove}

**Signature:** `remove(key: string): DynamicNode | undefined`

Detaches and returns a dynamically added child. An absent key returns `undefined`; attempting to
remove an initially declared child throws.

```ts
const profile = form({
  username: field('ada'),
});
const nickname = profile.add('nickname', field('countess'));

const removed = profile.remove('nickname');
removed === nickname; // true
removed?.parent(); // null
profile.remove('missing'); // undefined
```

See [Dynamic object children](../guides/dynamic-object-children.md) for value typing and collision
behavior.

### 🔸 Update values and reset state {#update-values-and-reset-state}

#### 📝 set() {#set}

**Signature:** `set(value: FormSet): void`

Immediately assigns a complete value to every supplied child without marking nodes dirty. The
public type requires the complete initially declared form shape.

```ts
const profile = form({
  username: field('ada'),
  active: field(true),
});

profile.set({
  username: 'grace',
  active: false,
});

profile(); // { username: 'grace', active: false }
```

Unknown runtime keys are ignored with a warning in development mode.

#### 📝 update() {#update}

**Signature:** `update(updater: (value: FormValue) => FormSet): void`

Passes the current aggregate value to a callback and immediately assigns its complete result.

```ts
const profile = form({
  username: field('  ada  '),
  active: field(true),
});

profile.update(value => ({
  ...value,
  username: value.username?.trim() ?? null,
}));

profile.username(); // 'ada'
```

#### 📝 patch() {#patch}

**Signature:** `patch(value: FormPatch): void`

Recursively updates supplied child branches and leaves omitted branches unchanged. It does not mark
nodes dirty.

```ts
const profile = form({
  username: field('ada'),
  address: {
    city: field('London'),
    country: field('UK'),
  },
});

profile.patch({
  address: {
    city: 'Zurich',
  },
});

profile.address(); // { city: 'Zurich', country: 'UK' }
```

Unknown runtime keys are ignored with a warning in development mode.

#### ↩️ reset() {#reset}

**Signatures:** `reset(): void` · `reset(value: FormSet): void`

Recursively cancels pending control input and clears touched and dirty state. Without an argument it
keeps all current values; with a value it assigns the complete value first.

```ts
const profile = form({
  username: field('ada'),
});

profile.markAsTouched();
profile.username.markAsDirty();
profile.reset({ username: 'grace' });

profile(); // { username: 'grace' }
profile.touched(); // false
profile.pristine(); // true
```

### 🔸 Validation and interaction {#validation-and-interaction}

#### ✅ setValidators() {#setvalidators}

**Signature:** `setValidators(validators: ValidatorSource<FormValue, FormNode<TNodes>>): void`

Replaces validators owned by the form and immediately evaluates its current aggregate value. Child
validators are unchanged.

```ts
const credentials = form({
  password: field('secret'),
  confirmation: field('different'),
});

credentials.setValidators(credentialsMatch);
credentials.invalid(); // true
```

#### 🚨 getError() {#geterror}

**Signature:** `getError(kind: string): ValidationError | undefined`

Returns the first error owned directly by the form with the requested kind. Descendant errors are
available through `allErrors()`.

```ts
const credentials = form({
  password: field('secret'),
  confirmation: field('different'),
}, {
  validators: credentialsMatch,
});

credentials.getError('passwordMismatch')?.kind; // 'passwordMismatch'
```

#### 👆 markAsTouched() {#markastouched}

**Signature:** `markAsTouched(options?: { skipDescendants?: boolean }): void`

Marks the form and every current descendant touched and flushes their pending control input. Pass
`skipDescendants: true` to mark and flush only the form itself.

```ts
const profile = form({
  username: field('ada'),
});

profile.markAsTouched();
profile.username.touched(); // true

profile.reset();
profile.markAsTouched({ skipDescendants: true });
profile.username.touched(); // false
```

#### 👆 markAsUntouched() {#markasuntouched}

**Signature:** `markAsUntouched(): void`

Clears only the form's own stored touched state. A touched descendant can keep aggregate
`touched()` equal to `true`; use `reset()` to clear the complete subtree.

```ts
const profile = form({
  username: field('ada'),
});

profile.markAsTouched({ skipDescendants: true });
profile.markAsUntouched();
profile.untouched(); // true
```

#### 👆 markAsDirty() {#markasdirty}

**Signature:** `markAsDirty(): void`

Marks the form's own state dirty. Programmatic value updates do not call this method automatically.

```ts
const profile = form({
  username: field('ada'),
});

profile.markAsDirty();
profile.dirty(); // true
```

#### 👆 markAsPristine() {#markaspristine}

**Signature:** `markAsPristine(): void`

Clears only the form's own dirty state. A dirty descendant can keep aggregate `dirty()` equal to
`true`.

```ts
const profile = form({
  username: field('ada'),
});

profile.markAsDirty();
profile.markAsPristine();
profile.pristine(); // true
```

### 🔸 Availability {#availability-1}

#### 🎛️ disable() {#disable}

**Signature:** `disable(message?: string): void`

Disables the form subtree. An optional message records why it was disabled.

```ts
const profile = form({
  username: field('ada'),
});

profile.disable('Profile is locked');
profile.disabled(); // true
profile.username.disabled(); // true
```

#### 🎛️ enable() {#enable}

**Signature:** `enable(): void`

Clears the disabled state created by `disable()`. Configured or inherited reasons can still keep
the form disabled.

```ts
const profile = form({
  username: field('ada'),
});

profile.disable();
profile.enable();
profile.enabled(); // true
```

#### 🎛️ markAsReadonly() {#markasreadonly}

**Signature:** `markAsReadonly(): void`

Marks the form subtree readonly, preventing bound controls from committing value changes.

```ts
const profile = form({
  username: field('ada'),
});

profile.markAsReadonly();
profile.username.writable(); // false
```

#### 🎛️ markAsWritable() {#markaswritable}

**Signature:** `markAsWritable(): void`

Clears the readonly state created by `markAsReadonly()`. Other configured or inherited readonly
state can still apply.

```ts
const profile = form({
  username: field('ada'),
});

profile.markAsReadonly();
profile.markAsWritable();
profile.writable(); // true
```

#### 🎛️ hide() {#hide}

**Signature:** `hide(): void`

Marks the form subtree hidden without changing its values.

```ts
const profile = form({
  username: field('ada'),
});

profile.hide();
profile.username.visible(); // false
```

#### 🎛️ show() {#show}

**Signature:** `show(): void`

Clears the hidden state created by `hide()`. Other configured or inherited hidden state can still
apply.

```ts
const profile = form({
  username: field('ada'),
});

profile.hide();
profile.show();
profile.visible(); // true
```

### 🔸 Control methods {#control-methods}

#### ⏱️ flush() {#flush}

**Signature:** `flush(): void`

Immediately commits pending control values throughout the form subtree. It is a no-op when no
control is debouncing.

```ts
const search = form({
  query: field('', { debounce: 300 }),
});

search.query.setControlValue('angular');
search.flush();
search.query(); // 'angular'
search.debouncing(); // false
```

#### 👆 focus() {#focus}

**Signature:** `focus(options?: FocusOptions): void`

Focuses the first bound UI control in the form subtree in DOM order. A control bound directly to
the form takes precedence over descendant bindings. Standard `FocusOptions` are forwarded.

<CodeBlock language="ts">{formFocusSource}</CodeBlock>

### 🔸 Submission methods {#submission-methods}

#### 📨 submit() {#submit}

**Signature:** `submit(): Promise<boolean>`

Marks and flushes the subtree, checks the configured validation policy, and runs
`onSubmit` when allowed.

```ts
const profile = form({
  username: field('', [required]),
}, {
  onSubmit: async value => saveProfile(value),
  onSubmitBlocked: invalidForm => invalidForm.focus(),
});

const submitted = await profile.submit();
```

The promise resolves to `true` after the action completes successfully. It resolves to `false`
when validation blocks submission, submission is already running, or no action is configured. If
the action throws or rejects, `submit()` rejects with that error and still clears `submitting()`.

</div>

See [Submission](../guides/submission.md), [Dynamic object children](../guides/dynamic-object-children.md),
and the [shared Node API](./node-api.md).

## 🌳 Iterate over immediate children {#iterate-over-immediate-children}

`forEachChild(callback)` calls `callback(child, key)` once per declared immediate child and returns
`void`. It excludes children added with `add()`. A child can be a field, group, form, or array;
iteration does not recurse. The callback receives the union of declared child types, preserving
their concrete node and parent types, and a string key.

Pass `{ includeDynamic: true }` as the second argument to visit both declared and added
children. The callback then receives `DynamicNode`, without `undefined`. A runtime boolean also
uses `DynamicNode`, since dynamic nodes may be included. Omitted options, `{}`, and an explicit
`{ includeDynamic: false }` preserve the declared-child union.

<CodeBlock language="ts">{forEachChildSource}</CodeBlock>

<CodeBlock language="ts">{childInferenceSource}</CodeBlock>

A mixed union allows reads of all its value types; a write must be accepted by every possible
child. A string cannot be assigned to a union that includes a numeric field.


Iteration uses a snapshot in `Object.entries()` order: integer-like keys come first in numeric
order, followed by other string keys in insertion order. Children added during a callback can be
visited on the next call with dynamic inclusion enabled. Children removed during a callback remain in the current snapshot.
An exception from a callback propagates immediately and stops the remaining callbacks.

Inside `computed()` or `effect()`, iteration tracks additions and removals, plus any signals
read by the callback. It does not read child values automatically. The iterator itself does
not change values, validation, or interaction state; operations called by the callback retain
their usual behavior, including descendant propagation.

If a child is named `forEachChild`, use `$api.forEachChild()` to access the operation.

## 📐 Runtime child map and enumeration {#declared-child-types-in-objectvalues}

`children` exposes every runtime child. Declared properties such as `children.name` retain their
exact types. Unknown names such as `children.nonExisting` and `children[key]` use `DynamicNode`;
with TypeScript's `noUncheckedIndexedAccess`, these lookups also include `undefined`, allowing
`children.nonExisting?.value()`. Missing names return `undefined` at runtime. `get(key)` always
includes `undefined` in its return type, independently of that compiler option.

`Object.values(node.children)` includes dynamically added nodes, so its inferred element type
includes `DynamicNode` and may retain concrete declared-node alternatives. Use `forEachChild()`
for the exact union of declared child types. Pass `{ includeDynamic: true }` to that method for
all-child iteration with `DynamicNode` callbacks.

<CodeBlock language="ts">{childrenUnionSource}</CodeBlock>

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

## 🌳 Empty declarations as dynamic records {#empty-declarations-as-dynamic-records}

With `form({})` or `group({})`, the empty declaration acts as a dynamic record for child access:
`Object.values(node.children)` is `DynamicNode[]`. Use
`forEachChild(callback, { includeDynamic: true })` to visit added children with a `DynamicNode`
callback. Without that option there are no declared children to visit, and the callback's child
type is `DynamicNode`, so expressions such as `child.set('')` compile. This also applies to nested empty groups and forms. Nonempty declarations retain
their concrete child union for default iteration.

<CodeBlock language="ts">{emptyChildRecordSource}</CodeBlock>

`get(key)` remains `DynamicNode | undefined` because a requested key may be missing. Keep the
result of `add()` when you need the exact added node type. Enumeration types do not change the
form's statically inferred value shape or expand its direct child properties. This behavior is
chosen from the declaration's type, not from the current number of runtime children.
