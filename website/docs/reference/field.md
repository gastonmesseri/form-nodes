---
title: field()
---

import CodeBlock from '@theme/CodeBlock';
import fieldFocusSource from '!!raw-loader!../../examples/field-focus.typecheck.ts';
import undefinedFieldSource from '!!raw-loader!../../examples/undefined-field.example.ts';

# field()

`field()` creates a leaf node for a scalar, object, date, or any other application value. Fields
normally live inside a `form()` so their parent, path, validation, and state participate in a tree.

Not sure whether a structured value should be a field or child nodes? See
[Choosing a primitive](../guides/choosing-a-primitive.md).

:::info Safe outside Angular injection contexts

`field()` can be safely created and used outside an Angular injection context. Value operations,
state, synchronous validation, and asynchronous validation all continue to work. When an injector
is available, its `DestroyRef` provides deterministic cleanup; without one, Gem Forms uses weak
ownership so an unreachable field and its validation watcher can be garbage-collected.

:::

```ts
import { field, form, required } from '@gem/ng-forms';

const myForm = form({
  name: field('', [required]),
  age: field<number>(),
});
```

## API map

| I want to… | Start with | Details |
| --- | --- | --- |
| Decide whether a value should be one field | `field<T>()` | [Arrays and objects](#fields-can-hold-arrays-and-objects) |
| Choose field nullability | Nullability shortcuts | [Nullability](#nullability) |
| Configure validation, debounce, or state | `FieldOptions` | [Options](#options) |
| Read value, parent, or path | `myField()`, `parent()`, `path()` | [Properties and methods](#properties-and-methods) |
| Change or reset its value | `set()`, `update()`, `reset()` | [Method reference](#method-reference) |
| Inspect errors or constraints | `errors()`, `getError()`, `required()`, `min()` | [Validation properties](#validation-properties) |
| Manage touched, dirty, or availability | State signals and marker methods | [Interaction](#interaction-properties) and [availability](#availability-properties) |
| Connect it to an Angular control | `FormNode`, `[formNode]` | [Binding in Angular](#binding-in-angular) |

## Fields can hold arrays and objects

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

This field has one validation and interaction state for the complete `string[]`. Use `array()` only
when items need independent nodes, bindings, errors, paths, or structural operations. See
[Array field or `array()`](../guides/choosing-a-primitive.md#array-field-or-array) for a complete
comparison.

When a value appears directly inside an object-node definition, consult the
[declaration shorthand matrix](../concepts/creating-nodes.md#declaration-shorthand-matrix) to see
whether it becomes an implicit field or structural group.

## Signatures

```ts
field();
field(initialValue);
field(initialValue, options);
field(initialValue, validators, options?);
```

A field with no initial value starts at `null`.

## Nullability

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
TypeScript can infer a future type. Gem Forms uses `unknown`, rather than the unsafe `any`.
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
explicit initial value, producing `Field<T | null | undefined>`.

<CodeBlock language="ts" title="undefined-field.example.ts">{undefinedFieldSource}</CodeBlock>

Use an explicit generic when the domain type is known. Although `Field<unknown>` accepts `null`,
TypeScript displays it as `unknown` because `unknown | null` simplifies to `unknown`; reads must be
narrowed before use and therefore do not acquire `any`-like behavior.

`field.strict()` is the concise form when `null` is not a valid business value:

```ts
const myForm = form({
  countryCode: field.strict('CH'),
});

// myForm.countryCode.set(null); // TypeScript error
```

## Options

| Option | Accepted value | Purpose |
| --- | --- | --- |
| [`validators`](#field-validators-option) | validator, validator array, or reactive source | Validates the field value |
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

## Option reference

### Value and validation

#### validators {#field-validators-option}

**Signature:** `validators?: ValidatorSource<TValue>`

Assigns one validator, several validators, or a reactive validator source to this field.

```ts
const username = field('', {
  validators: [required, minLength(3)],
});

username.invalid(); // true
```

#### debounce {#field-debounce-option}

**Signature:** `debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>)`

Delays control-originated commits. Programmatic `set()` and `update()` calls remain immediate.

```ts
const username = field('', {
  debounce: 300,
});
```

### Availability

#### disabled {#field-disabled-option}

**Signature:** `disabled?: boolean | string | (() => boolean | string)`

Sets or reactively derives disabled state. A string also becomes a disabled reason.

```ts
const username = field('', {
  disabled: 'Profile is locked',
});

username.disabled(); // true
```

#### readonly {#field-readonly-option}

**Signature:** `readonly?: boolean | (() => boolean)`

Sets or reactively derives readonly state. It defaults to `false`.

```ts
const username = field('', {
  readonly: () => profileArchived(),
});
```

#### hidden {#field-hidden-option}

**Signature:** `hidden?: boolean | (() => boolean)`

Sets or reactively derives hidden state. It defaults to `false`.

```ts
const username = field('', {
  hidden: () => !showUsername(),
});
```

### Injector ownership

#### injector {#field-injector-option}

**Signature:** `injector?: Injector`

Provides an explicit lifecycle owner for injector-dependent work such as asynchronous validation.

```ts
const injector = inject(Injector);
const username = field('', { injector });
```

#### inheritInjector {#field-inheritinjector-option}

**Signature:** `inheritInjector?: boolean`

Allows an otherwise injector-less field to use the nearest ancestor injector. It defaults to
`true`; `false` creates an inheritance boundary.

```ts
const username = field('', {
  inheritInjector: false,
});
```

#### adoptBindingInjector {#field-adoptbindinginjector-option}

**Signature:** `adoptBindingInjector?: boolean`

Allows an otherwise injector-less field to adopt a directly bound `[formNode]` host injector. It
defaults to `true`.

```ts
const username = field('', {
  adoptBindingInjector: false,
});
```

</div>

## Properties and methods

A field is a callable committed-value reader with reactive signal properties and the shared node
state API. Signal properties must be called to read their current value.

| Member | Description |
| --- | --- |
| **Value and tree** | |
| [`myField()`](#callable-value) | Returns the current committed value. This is the preferred value-reading form. |
| [`value()`](#value) | Current committed value. Equivalent to calling the field directly. |
| [`controlValue()`](#controlvalue) | Immediate value received from a bound control; it can differ during debounce. |
| [`nodeType()`](#nodetype) | Returns the literal `'field'`. |
| [`form()`](#form) | Root node that owns the field, or `null` for a standalone field. |
| [`parent()`](#parent) | Direct parent node, or `null` at the root or after detachment. |
| [`path()`](#path) | Property path from the root; array indexes are string segments. |
| [`keyInParent()`](#keyinparent) | Property name or array index in the parent, or `null` at the root. |
| [`api`](#api) | Complete field API. Direct members are preferred in application code. |
| [`$api`](#api-1) | Collision-safe alias of `api` for generic infrastructure. |
| [`$field`](#field-adapter) | Opaque terminal adapter for Angular's `[formField]` directive. |
| **Value and control** | |
| [`set(value)`](#set) | Immediately assigns a committed value without marking the field dirty. |
| [`update(updater)`](#update) | Derives and assigns a value from the current committed value. |
| [`setControlValue(value)`](#setcontrolvalue) | Receives a control value, marks dirty, and applies debounce. |
| [`reset(value?)`](#reset) | Optionally replaces the value, then clears interaction state and pending input. |
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

Programmatic `set()` and `update()` do not mark a field dirty. `setControlValue()` does. A disabled,
readonly, or hidden field reports `touched()` and `dirty()` as `false` without discarding the stored
state; the state is visible again when the field becomes interactive.

<div className="api-member-reference">

## Property reference

Each entry includes its consumer-facing signature, what it represents or returns, and a complete
example. `TValue` means the field's inferred value type. `ParentNode` and `RootNode` represent the
precise parent and root types inferred from where the field is declared.

### Value and tree properties

#### Callable value

**Signature:** `(): TValue`

Calls the field as a signal and returns its current committed value. This is the recommended value
read.

```ts
const username = field('ada');

username(); // 'ada'
```

#### value()

**Signature:** `value: Signal<TValue>`

Contains the current committed value.

```ts
const username = field('ada');

username.value(); // 'ada'
```

Prefer the equivalent callable form, `username()`, for ordinary value reads.

#### controlValue()

**Signature:** `controlValue: Signal<TValue>`

Contains the immediate value most recently received from a bound UI control.

```ts
const username = field('ada', {
  debounce: 300,
});

username.controlValue(); // 'ada'
```

During debounce, `controlValue()` contains the pending control value while `username()` still
contains the last committed value.

#### nodeType()

**Signature:** `nodeType(): 'field'`

Returns the stable primitive discriminant for this node.

```ts
const username = field('ada');

username.nodeType(); // 'field'
```

#### form()

**Signature:** `form: Signal<RootNode | null>`

Returns the complete root node containing the field, or `null` when the field is standalone.

```ts
const profile = form({
  username: field('ada'),
});

profile.username.form() === profile; // true
```

#### parent()

**Signature:** `parent: Signal<ParentNode | null>`

Returns the direct parent node, or `null` when the field is standalone or has been detached.

```ts
const profile = form({
  username: field('ada'),
});

profile.username.parent() === profile; // true
```

#### path()

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

#### keyInParent()

**Signature:** `keyInParent: Signal<string | number | null>`

Returns the property name or array index under which the field is stored, or `null` at the root.

```ts
const profile = form({
  username: field('ada'),
});

profile.username.keyInParent(); // 'username'
```

#### api

**Signature:** `api: FieldApi<TValue>`

Exposes the complete field API as a plain object.

```ts
const username = field('ada');

username.api.valid(); // true
```

Direct access such as `username.valid()` is preferred. `api` is useful to generic infrastructure
that works with a consistent API object.

#### $api

**Signature:** `$api: FieldApi<TValue>`

Exposes the same API through the collision-safe convention shared by every node kind.

```ts
const profile = form({
  api: field('public-profile-api'),
  username: field('ada'),
});

profile.api(); // 'public-profile-api'
profile.$api.valid(); // true
profile.username.$api.valid(); // true
```

#### $field adapter {#field-adapter}

**Signature:** `readonly $field: any`

Returns the opaque terminal adapter used by Angular's `[formField]` directive.

```html
<input [formField]="profile.username.$field" />
```

Select the Gem field first and use `$field` only in the template binding. Its public type is
intentionally erased; programmatic operations belong to the Gem node API.

### Validation properties

#### validators()

**Signature:** `validators: Signal<Validators<TValue>>`

Contains the normalized validators owned directly by the field, in declaration order.

```ts
const username = field('', [required, minLength(3)]);

username.validators().length; // 2
```

#### errors()

**Signature:** `errors: Signal<readonly ValidationError[]>`

Contains the current validation errors owned by the field.

```ts
const username = field('', [required]);

username.errors()[0]?.kind; // 'required'
```

#### allErrors()

**Signature:** `allErrors: Signal<readonly ValidationError[]>`

Contains errors from the field and its descendants. A field has no descendants, so it contains the
same errors as `errors()`.

```ts
const username = field('', [required]);

username.allErrors()[0]?.targetNode === username; // true
```

#### valid()

**Signature:** `valid: Signal<boolean>`

Returns whether validation has completed without errors. It is `false` while validity is unknown.

```ts
const username = field('ada', [required]);

username.valid(); // true
```

#### invalid()

**Signature:** `invalid: Signal<boolean>`

Returns whether the field currently has at least one validation error.

```ts
const username = field('', [required]);

username.invalid(); // true
```

#### required()

**Signature:** `required: Signal<boolean>`

Returns whether active validation metadata currently marks the field as required.

```ts
const username = field('', [required]);

username.required(); // true
```

#### pending()

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

#### validationStatus()

**Signature:** `validationStatus: Signal<'valid' | 'invalid' | 'unknown'>`

Returns the field's current validation phase.

```ts
const username = field('', [required]);

username.validationStatus(); // 'invalid'
```

`'unknown'` means asynchronous validation is pending and no existing error currently makes the
field invalid. In that phase, both `valid()` and `invalid()` are `false`.

### Constraint metadata

Built-in validators expose reactive metadata used by `[formNode]` to synchronize native control
constraints. See the [built-in validator reference](./built-in-validators.md) for each validator.

#### min()

**Signature:** `min: Signal<NonNullable<TValue> | null>`

Contains the strictest minimum contributed by active numeric or date validators.

```ts
const age = field(18, [min(16), min(18)]);

age.min(); // 18
```

#### max()

**Signature:** `max: Signal<NonNullable<TValue> | null>`

Contains the strictest maximum contributed by active numeric or date validators.

```ts
const age = field(18, [max(120), max(99)]);

age.max(); // 99
```

#### minLength()

**Signature:** `minLength: Signal<number | null>`

Contains the strictest minimum length contributed by active length validators.

```ts
const username = field('', [minLength(3), minLength(5)]);

username.minLength(); // 5
```

#### maxLength()

**Signature:** `maxLength: Signal<number | null>`

Contains the strictest maximum length contributed by active length validators.

```ts
const username = field('', [maxLength(30), maxLength(20)]);

username.maxLength(); // 20
```

#### pattern()

**Signature:** `pattern: Signal<readonly RegExp[]>`

Contains every regular expression contributed by active pattern validators.

```ts
const username = field('', [pattern(/^[a-z]+$/)]);

username.pattern(); // [/^[a-z]+$/]
```

### Interaction properties

#### touched()

**Signature:** `touched: Signal<boolean>`

Returns whether the field has stored touched state and is currently interactive.

```ts
const username = field('ada');

username.markAsTouched();
username.touched(); // true
```

#### untouched()

**Signature:** `untouched: Signal<boolean>`

Returns the logical inverse of `touched()`.

```ts
const username = field('ada');

username.untouched(); // true
```

#### dirty()

**Signature:** `dirty: Signal<boolean>`

Returns whether the field has stored user-modified state and is currently interactive.

```ts
const username = field('ada');

username.markAsDirty();
username.dirty(); // true
```

#### pristine()

**Signature:** `pristine: Signal<boolean>`

Returns the logical inverse of `dirty()`.

```ts
const username = field('ada');

username.pristine(); // true
```

### Availability properties

#### disabled()

**Signature:** `disabled: Signal<boolean>`

Returns whether the field is effectively disabled by its own state, configuration, or an ancestor.

```ts
const username = field('', {
  disabled: true,
});

username.disabled(); // true
```

#### disabledReasons()

**Signature:** `disabledReasons: Signal<readonly DisabledReason[]>`

Contains all active local and inherited disabled causes, including each source node and optional
message.

```ts
const username = field('', {
  disabled: 'Profile is locked',
});

username.disabledReasons()[0]?.message; // 'Profile is locked'
```

#### enabled()

**Signature:** `enabled: Signal<boolean>`

Returns the logical inverse of `disabled()`.

```ts
const username = field('ada');

username.enabled(); // true
```

#### readonly()

**Signature:** `readonly: Signal<boolean>`

Returns whether the field is effectively readonly through its own state or an ancestor.

```ts
const username = field('', {
  readonly: true,
});

username.readonly(); // true
```

#### writable()

**Signature:** `writable: Signal<boolean>`

Returns the logical inverse of `readonly()` and indicates whether a bound control may commit value
changes.

```ts
const username = field('ada');

username.writable(); // true
```

#### hidden()

**Signature:** `hidden: Signal<boolean>`

Returns whether the field is effectively hidden through its own state or an ancestor.

```ts
const username = field('', {
  hidden: true,
});

username.hidden(); // true
```

#### visible()

**Signature:** `visible: Signal<boolean>`

Returns the logical inverse of `hidden()`.

```ts
const username = field('ada');

username.visible(); // true
```

### Control and submission properties

#### debouncing()

**Signature:** `debouncing: Signal<boolean>`

Returns whether a control-originated value is waiting for the field's numeric, blur-based, or
asynchronous debounce to complete.

```ts
const username = field('', {
  debounce: 300,
});

username.debouncing(); // false before a bound control has a pending value
```

#### submitting()

**Signature:** `submitting: Signal<boolean>`

Returns whether an ancestor form is currently running its submission action. A field cannot
initiate submission itself.

```ts
const profile = form({
  username: field('ada'),
}, {
  submission: {
    action: async () => saveProfile(),
  },
});

profile.username.submitting(); // true while saveProfile() is running
```

## Method reference

Each entry includes its consumer-facing signature, behavior, and return value.

### Update values and control state

#### set()

**Signature:** `set(value: TValue): void`

Immediately assigns both the committed and control values, cancels pending debounce, and does not
mark the field dirty.

```ts
const username = field('ada');

username.set('grace');
username(); // 'grace'
username.dirty(); // false
```

#### update()

**Signature:** `update(updater: (value: TValue) => TValue): void`

Passes the current committed value to a callback and immediately assigns its result without marking
the field dirty.

```ts
const username = field('  ada  ');

username.update(value => value?.trim() ?? null);
username(); // 'ada'
```

#### setControlValue()

**Signature:** `setControlValue(value: TValue): void`

Receives a value from a UI control, marks the field dirty, and applies the configured debounce
before committing it. Control bindings normally call this method for you.

```ts
const username = field('', {
  debounce: 'blur',
});

username.setControlValue('ada');
username.controlValue(); // 'ada'
username(); // ''
username.dirty(); // true
```

#### reset()

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
`set()` directly in ordinary field code.

#### flush()

**Signature:** `flush(): void`

Immediately commits a pending `controlValue()` and ends its debounce. It is a no-op when nothing is
pending.

```ts
const username = field('', {
  debounce: 300,
});

username.setControlValue('ada');
username.flush();
username(); // 'ada'
username.debouncing(); // false
```

#### focus()

**Signature:** `focus(options?: FocusOptions): void`

Focuses the first `[formNode]` control bound to the field in DOM order. It forwards standard
`FocusOptions` and does nothing when no control is bound.

<CodeBlock language="ts">{fieldFocusSource}</CodeBlock>

### Validation and interaction

#### setValidators()

**Signature:** `setValidators(validators: ValidatorSource<TValue>): void`

Replaces the field's validator source and immediately validates the current committed value. The
source may itself be reactive.

```ts
const username = field('ada');

username.setValidators(minLength(5));
username.invalid(); // true
```

#### getError()

**Signature:** `getError(kind: string): ValidationError | undefined`

Returns the first field-owned error with the requested kind. Known built-in kinds preserve their
specific inferred error shape.

```ts
const username = field('', [required]);

username.getError('required')?.kind; // 'required'
username.getError('minLength'); // undefined
```

#### markAsTouched()

**Signature:** `markAsTouched(options?: { skipDescendants?: boolean }): void`

Marks the field touched and flushes pending control input. `skipDescendants` is accepted for API
consistency; a field has no descendants.

```ts
const username = field('ada');

username.markAsTouched();
username.touched(); // true
```

#### markAsUntouched()

**Signature:** `markAsUntouched(): void`

Clears the field's stored touched state.

```ts
const username = field('ada');

username.markAsTouched();
username.markAsUntouched();
username.untouched(); // true
```

#### markAsDirty()

**Signature:** `markAsDirty(): void`

Marks the field's stored state as dirty without changing its value.

```ts
const username = field('ada');

username.markAsDirty();
username.dirty(); // true
```

#### markAsPristine()

**Signature:** `markAsPristine(): void`

Clears the field's stored dirty state without changing its value.

```ts
const username = field('ada');

username.markAsDirty();
username.markAsPristine();
username.pristine(); // true
```

### Availability

#### disable()

**Signature:** `disable(message?: string): void`

Disables the field. An optional message records a user-facing reason.

```ts
const username = field('ada');

username.disable('Profile is locked');
username.disabled(); // true
username.disabledReasons()[0]?.message; // 'Profile is locked'
```

#### enable()

**Signature:** `enable(): void`

Clears the disabled state created by `disable()`. A configured or inherited cause can still keep
the field disabled.

```ts
const username = field('ada');

username.disable();
username.enable();
username.enabled(); // true
```

#### markAsReadonly()

**Signature:** `markAsReadonly(): void`

Marks the field readonly, preventing bound controls from committing value changes.

```ts
const username = field('ada');

username.markAsReadonly();
username.writable(); // false
```

#### markAsWritable()

**Signature:** `markAsWritable(): void`

Clears the state created by `markAsReadonly()`. Configured or inherited readonly state can still
apply.

```ts
const username = field('ada');

username.markAsReadonly();
username.markAsWritable();
username.writable(); // true
```

#### hide()

**Signature:** `hide(): void`

Marks the field hidden without changing its value.

```ts
const username = field('ada');

username.hide();
username.visible(); // false
```

#### show()

**Signature:** `show(): void`

Clears the state created by `hide()`. Configured or inherited hidden state can still apply.

```ts
const username = field('ada');

username.hide();
username.show();
username.visible(); // true
```

</div>

## Binding in Angular

```ts
import { Component } from '@angular/core';

import { field, form, FormNode } from '@gem/ng-forms';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
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
