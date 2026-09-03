---
title: group()
description: Reference for object groups without an independent submission workflow.
---

import groupFocusSource from '!!raw-loader!../../examples/group-focus.typecheck.ts';

# group()

`group()` creates a typed object aggregate. It provides named children, value aggregation,
validation, state propagation, configuration, and the common node operations. It deliberately has
no `submission` option and no `submit()` method.

Plain nested objects in `form()`, `group()`, and object templates in `array()` are shorthand for
groups. Prefer shorthand until a branch needs its own options or validators.

A group can also be the root of a node tree. `form()` is not required when the model needs aggregate
structure and state but does not own a submission workflow.

:::info Safe outside Angular injection contexts

`group()` can be safely created and used outside an Angular injection context. Value and tree
operations, state, synchronous validation, and asynchronous validation all continue to work. When
an injector is available, its `DestroyRef` provides deterministic cleanup; without one, Gem Forms
uses weak ownership so an unreachable group tree can be garbage-collected.

:::

```ts
import { field, form, group, required } from '@gem/ng-forms';

const myForm = form({
  displayName: field(''),
  address: group({
    city: field('', [required]),
    country: field(''),
  }, {
    disabled: () => !canEditAddress(),
  }),
});
```

## API map

| I want to… | Start with | Details |
| --- | --- | --- |
| Create or configure an object branch | `group(...)`, `GroupOptions` | [Signatures](#signatures) and [options](#options) |
| Decide between a group and submission boundary | `group()`, `form()` | [Group or form](#group-or-form) |
| Read its value or navigate children | `myGroup()`, direct children, `children` | [Properties and methods](#properties-and-methods) |
| Add or remove runtime children | `add()`, `remove()` | [Dynamic children](#dynamic-children-1) |
| Replace, derive, patch, or reset values | `set()`, `update()`, `patch()`, `reset()` | [Method reference](#method-reference) |
| Inspect or replace validation | `errors()`, `allErrors()`, `valid()`, `setValidators()` | [Validation properties](#validation-properties) |
| Manage interaction or availability | State signals and marker methods | [Interaction](#interaction-properties) and [availability](#availability-properties) |
| Commit or focus bound controls | `flush()`, `focus()` | [Control methods](#control-methods) |
| Observe an ancestor submission | `submitting()` | [Control and workflow properties](#control-and-workflow-properties) |

## Signatures

```ts
group(definitions, options?);
group(definitions, validators, options?);
```

## Options

`GroupOptions` accepts the object-node configuration shared with `form()`, except for submission.
A group can inherit `submitting()` from an ancestor form but cannot initiate submission itself.

| Option | Accepted value | Purpose |
| --- | --- | --- |
| [`validators`](#group-validators-option) | Validator, validator array, `null`, or `undefined` | Validates the complete object value. Child validators remain independent. |
| [`validatorMessages`](#group-validatormessages-option) | Message catalog or reactive catalog function | Overrides built-in validator messages for this subtree. |
| [`debounce`](#group-debounce-option) | Milliseconds, `'blur'`, or cancelable asynchronous function | Provides the default control-value debounce inherited by descendants. |
| [`hidden`](#group-hidden-option) | Boolean or reactive function | Sets or reactively derives hidden state for the complete subtree. |
| [`disabled`](#group-disabled-option) | Boolean, reason string, or reactive function | Sets or reactively derives disabled state for the complete subtree. |
| [`readonly`](#group-readonly-option) | Boolean or reactive function | Sets or reactively derives readonly state for the complete subtree. |
| [`injector`](#group-injector-option) | Angular `Injector` | Explicitly owns injector-dependent work such as asynchronous validation watchers. |
| [`inheritInjector`](#group-inheritinjector-option) | Boolean; defaults to `true` | Allows an injector-less group to use the nearest ancestor injector. |
| [`adoptBindingInjector`](#group-adoptbindinginjector-option) | Boolean; defaults to `true` | Allows direct `[formNode]` binding to provide a temporary host injector. |

Start with a named validator for a reusable object rule. Use an inline callback for a small rule
specific to one group:

```ts
const filters = group({
  query: field(''),
  category: field(''),
}, {
  validators: ({ value }) => value().query || value().category
    ? null
    : { kind: 'emptyFilters', message: 'Enter a query or choose a category.' },
});
```

Group validators receive the complete object. Put a validator on a child field when the rule only
concerns that child's value.

<div className="api-member-reference">

## Option reference

Each option includes its signature, default behavior, scope, and a complete example.

### Values and validation

#### validators {#group-validators-option}

**Signature:** `validators?: ValidatorSource<GroupValue>`

Assigns one validator, several validators, or a reactive validator source to the complete group
value. Validators declared by descendants continue to run independently.

```ts
const dateRange = group({
  start: field<Date>(),
  end: field<Date>(),
}, {
  validators: validDateRange,
});
```

#### validatorMessages {#group-validatormessages-option}

**Signature:** `validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined)`

Overrides built-in validator messages for the group subtree. It may be a static catalog or a
reactive function; validator-local messages still take precedence.

```ts
const address = group({
  city: field('', [required]),
  country: field(''),
}, {
  validatorMessages: {
    required: 'Enter a city.',
  },
});

address.allErrors()[0]?.message; // 'Enter a city.'
```

#### debounce {#group-debounce-option}

**Signature:** `debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>)`

Provides the default control-value debounce inherited by descendants. A descendant's local option
overrides it. Omit it to commit control-originated values immediately.

```ts
const address = group({
  city: field(''),
  country: field(''),
}, {
  debounce: 300,
});
```

### Availability

#### hidden {#group-hidden-option}

**Signature:** `hidden?: boolean | (() => boolean)`

Sets or reactively derives hidden state for the complete group subtree. It defaults to `false`.

```ts
const shippingAddress = group({
  city: field(''),
}, {
  hidden: () => useBillingAddress(),
});
```

#### disabled {#group-disabled-option}

**Signature:** `disabled?: boolean | string | (() => boolean | string)`

Sets or reactively derives disabled state for the complete subtree. A string also becomes a message
in `disabledReasons()`. It defaults to `false`.

```ts
const address = group({
  city: field(''),
}, {
  disabled: 'Address is managed by your organization',
});

address.disabledReasons()[0]?.message; // 'Address is managed by your organization'
```

#### readonly {#group-readonly-option}

**Signature:** `readonly?: boolean | (() => boolean)`

Sets or reactively derives readonly state for the complete group subtree. It defaults to `false`.

```ts
const identity = group({
  legalName: field(''),
}, {
  readonly: () => identityVerified(),
});
```

### Injector ownership

#### injector {#group-injector-option}

**Signature:** `injector?: Injector`

Provides an explicit lifecycle owner for injector-dependent work such as asynchronous validation.

```ts
const injector = inject(Injector);
const address = group({
  city: field(''),
}, {
  injector,
});
```

#### inheritInjector {#group-inheritinjector-option}

**Signature:** `inheritInjector?: boolean`

Allows an otherwise injector-less group to use the nearest ancestor injector. It defaults to
`true`; `false` creates an inheritance boundary.

```ts
const address = group({
  city: field(''),
}, {
  inheritInjector: false,
});
```

#### adoptBindingInjector {#group-adoptbindinginjector-option}

**Signature:** `adoptBindingInjector?: boolean`

Allows an otherwise injector-less group to adopt the injector of a directly bound `[formNode]` host
while that binding exists. It defaults to `true`.

```ts
const address = group({
  city: field(''),
}, {
  adoptBindingInjector: false,
});
```

</div>

## Value and children

The group is callable, and direct child access is preferred:

```ts
myForm.address();             // { city: '', country: '' }
myForm.address.city();        // ''
myForm.address.children.city; // the same field node, through the explicit child map
```

Groups always expose a non-null object value. Model an atomic or nullable object with `field()`
instead. Use `array()` when the structure has a dynamic number of independently addressable items.

## Properties and methods

A group is a callable aggregate-value reader with named child properties, reactive signals,
structural operations, and the shared node state API. Signal properties must be called to read
their value; `children` is a stable readonly map rather than a signal.

| Member | Description |
| --- | --- |
| **Value and tree** | |
| [`myGroup()`](#callable-value) | Returns the current committed object value. This is the preferred value-reading form. |
| [`myGroup.child`](#named-child-access) | Returns a named child node with its precise inferred type. |
| [`children`](#children) | Stable readonly map of every current named child. |
| [`value()`](#value) | Current committed aggregate value. Equivalent to calling the group directly. |
| [`controlValue()`](#controlvalue) | Complete value from a control bound directly to the group. |
| [`form()`](#form) | Complete root node; a root group returns itself. |
| [`parent()`](#parent) | Direct parent node, or `null` at the root or after detachment. |
| [`path()`](#path) | Property path from the root; array indexes are string segments. |
| [`keyInParent()`](#keyinparent) | Property name or array index in the parent, or `null` at the root. |
| [`api`](#api) | Complete group API unless a declared child named `api` takes precedence. |
| [`$api`](#api-1) | Guaranteed collision-safe group API. |
| [`$field`](#field-adapter) | Opaque terminal adapter for Angular's `[formField]` directive. |
| **Dynamic children** | |
| [`add(key, definition)`](#add) | Attaches and returns one runtime child with its exact inferred node type. |
| [`add(definitions)`](#add) | Atomically attaches and returns several runtime children. |
| [`remove(key)`](#remove) | Detaches and returns a dynamically added child, or `undefined`. |
| **Value updates** | |
| [`set(value)`](#set) | Assigns a complete object value without marking nodes dirty. |
| [`update(updater)`](#update) | Derives and assigns a complete value from the current value. |
| [`patch(value)`](#patch) | Recursively assigns only supplied child branches. |
| [`reset(value?)`](#reset) | Optionally assigns a value, then recursively clears interaction state. |
| **Validation** | |
| [`validators()`](#validators) | Current normalized validators owned by the group. |
| [`setValidators(source)`](#setvalidators) | Replaces the group validator source and revalidates. |
| [`errors()`](#errors) | Errors owned directly by this group, excluding descendants. |
| [`allErrors()`](#allerrors) | Errors from this group and every current descendant. |
| [`getError(kind)`](#geterror) | First group-owned error with a kind, or `undefined`. |
| [`valid()`](#valid) | Whether the complete group subtree is valid. |
| [`invalid()`](#invalid) | Whether the group or a current descendant is invalid. |
| [`required()`](#required) | Whether active metadata marks the group itself as required. |
| [`pending()`](#pending) | Whether asynchronous validation is active in the subtree. |
| [`validationStatus()`](#validationstatus) | Aggregated `'valid'`, `'invalid'`, or `'unknown'` phase. |
| **Interaction** | |
| [`touched()`](#touched) | Whether the group or a contributing descendant is touched. |
| [`untouched()`](#untouched) | Logical inverse of `touched()`. |
| [`markAsTouched(options?)`](#markastouched) | Marks the group and, by default, every descendant touched. |
| [`markAsUntouched()`](#markasuntouched) | Clears only the group's own stored touched state. |
| [`dirty()`](#dirty) | Whether the group or a contributing descendant is dirty. |
| [`pristine()`](#pristine) | Logical inverse of `dirty()`. |
| [`markAsDirty()`](#markasdirty) | Marks the group's own state dirty. |
| [`markAsPristine()`](#markaspristine) | Clears only the group's own dirty state. |
| **Availability** | |
| [`disabled()`](#disabled) | Whether the group is disabled locally or by an ancestor. |
| [`disabledReasons()`](#disabledreasons) | Active local and inherited disabled causes. |
| [`enabled()`](#enabled) | Logical inverse of `disabled()`. |
| [`disable(message?)`](#disable) | Disables the subtree and optionally records a reason. |
| [`enable()`](#enable) | Clears the imperative disabled state. |
| [`readonly()`](#readonly) | Whether the group is readonly locally or through an ancestor. |
| [`writable()`](#writable) | Logical inverse of `readonly()`. |
| [`markAsReadonly()`](#markasreadonly) | Marks the group subtree readonly. |
| [`markAsWritable()`](#markaswritable) | Clears the imperative readonly state. |
| [`hidden()`](#hidden) | Whether the group is hidden locally or through an ancestor. |
| [`visible()`](#visible) | Logical inverse of `hidden()`. |
| [`hide()`](#hide) | Marks the group subtree hidden. |
| [`show()`](#show) | Clears the imperative hidden state. |
| **Control and workflow** | |
| [`debouncing()`](#debouncing) | Whether the group or a descendant has pending control input. |
| [`flush()`](#flush) | Commits pending control values throughout the subtree. |
| [`focus(options?)`](#focus) | Focuses the first bound control in DOM order. |
| [`submitting()`](#submitting) | Whether an ancestor form is running its submission action. |

Every declared child name takes precedence over ordinary API and native callable member names.
`$api` and `$field` are reserved, so those access paths remain stable.

```ts
const details = group({
  reset: field('Not the reset method'),
});

details.reset(); // 'Not the reset method'
details.$api.reset();
```

See [Tree navigation and API access](../concepts/tree-and-api.md) for collision and generic-code
patterns.

## Group or form?

Use `group()` for structure and `form()` for a submission boundary:

```ts
const checkout = form({
  shippingAddress: {
    city: field(''), // shorthand Group
  },
  payment: form({
    cardNumber: field(''),
  }, {
    submission: { action: savePayment },
  }),
}, {
  submission: { action: placeOrder },
});
```

A group may be bound to a native `<form [formNode]>` without breaking its controls. Native submit
is prevented and marks and flushes the group tree, while native reset delegates to `group.reset()`.
Because a group has no submission action, use `form()` when the element must execute application
submission behavior.

## Group or plain object?

A normal object containing standalone fields is also valid:

```ts
const filters = {
  query: field(''),
  category: field(''),
};
```

Use that minimal structure when the nodes are genuinely independent. Choose a root `group()` when
you need an aggregate callable value, parent and path relationships, recursive updates and reset,
aggregate validity and interaction state, inherited availability or debounce, or validators for the
complete object. The plain object itself has none of those node capabilities.

## Dynamic children

Groups support the same `add()`, direct dynamic properties, and `remove()` operations as forms:

```ts
const filters = group({ query: field('') });
const category = filters.add('category', field('all'));

category(); // 'all'
filters.remove('category');
```

Initial children cannot be removed. Added children inherit the group's tree state and injector,
and detached children remain usable independently. See
[Dynamic object children](../guides/dynamic-object-children.md) for the complete contract.

<div className="api-member-reference">

## Property reference

Each entry includes its consumer-facing signature, what it represents or returns, and a complete
example. `GroupValue` means the inferred committed object value, `GroupSet` means the complete
value accepted by `set()`, and `GroupPatch` means the recursively partial value accepted by
`patch()`.

### Value and tree properties

#### Callable value

**Signature:** `(): GroupValue`

Calls the group as a signal and returns its current committed aggregate value. This is the
recommended complete-value read.

```ts
const address = group({
  city: field('Zurich'),
  country: field('CH'),
});

address(); // { city: 'Zurich', country: 'CH' }
```

#### Named child access

**Signature:** `readonly [childName]: ChildNode`

Returns a named child node with the precise type inferred from its definition.

```ts
const address = group({
  city: field('Zurich'),
  coordinates: {
    latitude: field(47.3769),
  },
});

address.city(); // 'Zurich'
address.coordinates.latitude(); // 47.3769
```

#### children

**Signature:** `readonly children: GroupChildren`

Returns the stable readonly map of current named child nodes, including dynamically added children.

```ts
const address = group({
  city: field('Zurich'),
});

address.children.city(); // 'Zurich'
```

Direct child access is preferred. If a child is named `children`, use `address.$api.children`.

#### value()

**Signature:** `value: Signal<GroupValue>`

Contains the current committed aggregate value.

```ts
const address = group({
  city: field('Zurich'),
});

address.value(); // { city: 'Zurich' }
```

Prefer the equivalent callable form, `address()`, for ordinary value reads.

#### controlValue()

**Signature:** `controlValue: Signal<GroupValue>`

Contains the complete value most recently received from a control bound directly to the group.

```ts
const address = group({
  city: field('Zurich'),
});

address.controlValue(); // { city: 'Zurich' }
```

Pending descendant control values are not aggregated into this signal. Read a descendant's
`controlValue()` when its immediate buffered value is needed.

#### form()

**Signature:** `form: Signal<RootNode>`

Returns the complete root node containing the group. A root group returns itself.

```ts
const address = group({
  city: field('Zurich'),
});

address.form() === address; // true
```

#### parent()

**Signature:** `parent: Signal<ParentNode | null>`

Returns the direct parent node, or `null` when the group is a root or has been detached.

```ts
const profile = form({
  address: group({
    city: field('Zurich'),
  }),
});

profile.address.parent() === profile; // true
```

#### path()

**Signature:** `path: Signal<readonly string[]>`

Returns the property and array-index segments from the root to this group.

```ts
const profile = form({
  address: group({
    city: field('Zurich'),
  }),
});

profile.address.path(); // ['address']
```

#### keyInParent()

**Signature:** `keyInParent: Signal<string | number | null>`

Returns the property name or array index under which the group is stored, or `null` at the root.

```ts
const profile = form({
  address: group({
    city: field('Zurich'),
  }),
});

profile.address.keyInParent(); // 'address'
```

### API properties

#### api

**Signature:** `api: GroupApi`

Exposes the complete group API unless a declared child named `api` takes precedence.

```ts
const address = group({
  city: field('Zurich'),
});

address.api.valid(); // true
```

Direct operations such as `address.valid()` are preferred.

#### $api

**Signature:** `$api: GroupApi`

Always exposes the complete group API, even when a child collides with an API member.

```ts
const details = group({
  api: field('public-api'),
  reset: field('reset label'),
});

details.api(); // 'public-api'
details.reset(); // 'reset label'
details.$api.reset();
```

#### $field adapter {#field-adapter}

**Signature:** `readonly $field: any`

Returns the opaque terminal adapter used by Angular's `[formField]` directive.

```html
<input [formField]="profile.address.city.$field" />
```

Select the intended Gem node first and use `$field` only as the binding value. Programmatic group
operations belong to the Gem node API.

### Validation properties

#### validators()

**Signature:** `validators: Signal<Validators<GroupValue>>`

Contains the normalized validators owned directly by the group, in declaration order.

```ts
const address = group({
  city: field('Zurich'),
  country: field('CH'),
}, {
  validators: supportedAddress,
});

address.validators().length; // 1
```

#### errors()

**Signature:** `errors: Signal<readonly ValidationError[]>`

Contains validation errors owned directly by the group and excludes descendant errors.

```ts
const filters = group({
  query: field(''),
  category: field(''),
}, {
  validators: nonEmptyFilters,
});

filters.errors()[0]?.kind; // 'emptyFilters'
```

#### allErrors()

**Signature:** `allErrors: Signal<readonly ValidationError[]>`

Contains errors from the group and every current descendant. Each error identifies its
`targetNode`.

```ts
const address = group({
  city: field('', [required]),
});

address.allErrors()[0]?.kind; // 'required'
address.errors(); // []
```

#### valid()

**Signature:** `valid: Signal<boolean>`

Returns whether the group and every current descendant have completed validation without errors.

```ts
const address = group({
  city: field('Zurich', [required]),
});

address.valid(); // true
```

#### invalid()

**Signature:** `invalid: Signal<boolean>`

Returns whether the group or any current descendant contributes a validation error.

```ts
const address = group({
  city: field('', [required]),
});

address.invalid(); // true
```

#### required()

**Signature:** `required: Signal<boolean>`

Returns whether active validation metadata marks the group itself as required. Groups still have a
non-null object value.

```ts
const address = group({
  city: field('Zurich'),
}, {
  validators: required,
});

address.required(); // true
```

#### pending()

**Signature:** `pending: Signal<boolean>`

Returns whether asynchronous validation is active on the group or a current descendant.

```ts
const address = group({
  city: field('Zurich'),
}, {
  validators: asyncValidator(async () => {
    await checkAddress();
    return null;
  }),
});

address.pending(); // true while checkAddress() is running
```

#### validationStatus()

**Signature:** `validationStatus: Signal<'valid' | 'invalid' | 'unknown'>`

Returns the aggregate validation phase for the group subtree.

```ts
const address = group({
  city: field('', [required]),
});

address.validationStatus(); // 'invalid'
```

`'unknown'` means asynchronous validation is pending and no available error currently makes the
subtree invalid.

### Interaction properties

#### touched()

**Signature:** `touched: Signal<boolean>`

Returns whether the group or any contributing current descendant has been marked touched.

```ts
const address = group({
  city: field('Zurich'),
});

address.city.markAsTouched();
address.touched(); // true
```

#### untouched()

**Signature:** `untouched: Signal<boolean>`

Returns the logical inverse of `touched()`.

```ts
const address = group({
  city: field('Zurich'),
});

address.untouched(); // true
```

#### dirty()

**Signature:** `dirty: Signal<boolean>`

Returns whether the group's own state or any contributing descendant reports user-modified state.

```ts
const address = group({
  city: field('Zurich'),
});

address.city.markAsDirty();
address.dirty(); // true
```

#### pristine()

**Signature:** `pristine: Signal<boolean>`

Returns the logical inverse of `dirty()`.

```ts
const address = group({
  city: field('Zurich'),
});

address.pristine(); // true
```

### Availability properties

#### disabled()

**Signature:** `disabled: Signal<boolean>`

Returns whether the group is effectively disabled by its own state, configuration, or an ancestor.

```ts
const address = group({
  city: field('Zurich'),
}, {
  disabled: true,
});

address.disabled(); // true
```

#### disabledReasons()

**Signature:** `disabledReasons: Signal<readonly DisabledReason[]>`

Contains all active local and inherited disabled causes, including each source node and optional
message.

```ts
const address = group({
  city: field('Zurich'),
}, {
  disabled: 'Address is locked',
});

address.disabledReasons()[0]?.message; // 'Address is locked'
address.city.disabled(); // true
```

#### enabled()

**Signature:** `enabled: Signal<boolean>`

Returns the logical inverse of `disabled()`.

```ts
const address = group({
  city: field('Zurich'),
});

address.enabled(); // true
```

#### readonly()

**Signature:** `readonly: Signal<boolean>`

Returns whether the group is effectively readonly through its own state or an ancestor.

```ts
const address = group({
  city: field('Zurich'),
}, {
  readonly: true,
});

address.readonly(); // true
```

#### writable()

**Signature:** `writable: Signal<boolean>`

Returns the logical inverse of `readonly()` and indicates whether a control bound directly to the
group may commit value changes.

```ts
const address = group({
  city: field('Zurich'),
});

address.writable(); // true
```

#### hidden()

**Signature:** `hidden: Signal<boolean>`

Returns whether the group is effectively hidden through its own state or an ancestor.

```ts
const address = group({
  city: field('Zurich'),
}, {
  hidden: true,
});

address.hidden(); // true
```

#### visible()

**Signature:** `visible: Signal<boolean>`

Returns the logical inverse of `hidden()`.

```ts
const address = group({
  city: field('Zurich'),
});

address.visible(); // true
```

### Control and workflow properties

#### debouncing()

**Signature:** `debouncing: Signal<boolean>`

Returns whether the group itself or a current descendant has control input awaiting commit.

```ts
const address = group({
  city: field('', { debounce: 300 }),
});

address.debouncing(); // false before a bound control has a pending value
```

#### submitting()

**Signature:** `submitting: Signal<boolean>`

Returns whether an ancestor form is currently running its submission action. A group cannot start
submission itself.

```ts
const profile = form({
  address: group({
    city: field('Zurich'),
  }),
}, {
  submission: {
    action: async () => saveProfile(),
  },
});

profile.address.submitting(); // true while saveProfile() is running
```

## Method reference

Each entry includes its consumer-facing signature, behavior, and return value.

### Dynamic children

#### add()

**Signatures:** `add(key: string, definition: NodeDefinition): AddedNode` ·
`add(definitions: NodeDefinitions): AddedNodes`

Attaches one child or several children at runtime. A single definition returns its exact attached
node; an object returns an exact keyed map. Plain nested objects become `group()` nodes.

```ts
const filters = group({
  query: field(''),
});

const category = filters.add('category', field('all'));
category(); // 'all'

const added = filters.add({
  sort: field('relevance'),
  range: {
    minimum: field(0),
    maximum: field(100),
  },
});

added.sort(); // 'relevance'
added.range.maximum(); // 100
```

Keys must be new, definitions must be detached, and `$api` and `$field` are reserved. The object
form validates every supplied definition before attaching any child.

#### remove()

**Signature:** `remove(key: string): DynamicNode | undefined`

Detaches and returns a dynamically added child. An absent key returns `undefined`; attempting to
remove an initially declared child throws.

```ts
const filters = group({
  query: field(''),
});
const category = filters.add('category', field('all'));

const removed = filters.remove('category');
removed === category; // true
removed?.parent(); // null
filters.remove('missing'); // undefined
```

### Update values and reset state

#### set()

**Signature:** `set(value: GroupSet): void`

Immediately assigns a complete value to every supplied child without marking nodes dirty. The
public type requires the complete initially declared group shape.

```ts
const address = group({
  city: field('Zurich'),
  country: field('CH'),
});

address.set({
  city: 'London',
  country: 'UK',
});

address(); // { city: 'London', country: 'UK' }
```

Unknown runtime keys are ignored with a warning.

#### update()

**Signature:** `update(updater: (value: GroupValue) => GroupSet): void`

Passes the current aggregate value to a callback and immediately assigns its complete result.

```ts
const address = group({
  city: field('  Zurich  '),
  country: field('CH'),
});

address.update(value => ({
  ...value,
  city: value.city?.trim() ?? null,
}));

address.city(); // 'Zurich'
```

#### patch()

**Signature:** `patch(value: GroupPatch): void`

Recursively updates supplied child branches and leaves omitted branches unchanged. It does not mark
nodes dirty.

```ts
const address = group({
  city: field('London'),
  country: field('UK'),
  coordinates: {
    latitude: field(51.5072),
    longitude: field(-0.1276),
  },
});

address.patch({
  coordinates: {
    latitude: 47.3769,
  },
});

address.coordinates(); // { latitude: 47.3769, longitude: -0.1276 }
```

Unknown runtime keys are ignored with a warning.

#### reset()

**Signatures:** `reset(): void` · `reset(value: GroupSet): void`

Recursively cancels pending control input and clears touched and dirty state. Without an argument it
keeps all current values; with a value it assigns the complete value first.

```ts
const address = group({
  city: field('Zurich'),
});

address.markAsTouched();
address.city.markAsDirty();
address.reset({ city: 'London' });

address(); // { city: 'London' }
address.touched(); // false
address.pristine(); // true
```

### Validation and interaction

#### setValidators()

**Signature:** `setValidators(validators: ValidatorSource<GroupValue>): void`

Replaces validators owned by the group and immediately evaluates its current aggregate value.
Child validators are unchanged.

```ts
const filters = group({
  query: field(''),
  category: field(''),
});

filters.setValidators(nonEmptyFilters);
filters.invalid(); // true
```

#### getError()

**Signature:** `getError(kind: string): ValidationError | undefined`

Returns the first error owned directly by the group with the requested kind. Descendant errors are
available through `allErrors()`.

```ts
const filters = group({
  query: field(''),
  category: field(''),
}, {
  validators: nonEmptyFilters,
});

filters.getError('emptyFilters')?.kind; // 'emptyFilters'
```

#### markAsTouched()

**Signature:** `markAsTouched(options?: { skipDescendants?: boolean }): void`

Marks the group and every current descendant touched and flushes their pending control input. Pass
`skipDescendants: true` to mark and flush only the group itself.

```ts
const address = group({
  city: field('Zurich'),
});

address.markAsTouched();
address.city.touched(); // true

address.reset();
address.markAsTouched({ skipDescendants: true });
address.city.touched(); // false
```

#### markAsUntouched()

**Signature:** `markAsUntouched(): void`

Clears only the group's own stored touched state. A touched descendant can keep aggregate
`touched()` equal to `true`; use `reset()` to clear the complete subtree.

```ts
const address = group({
  city: field('Zurich'),
});

address.markAsTouched({ skipDescendants: true });
address.markAsUntouched();
address.untouched(); // true
```

#### markAsDirty()

**Signature:** `markAsDirty(): void`

Marks the group's own state dirty. Programmatic value updates do not call this method automatically.

```ts
const address = group({
  city: field('Zurich'),
});

address.markAsDirty();
address.dirty(); // true
```

#### markAsPristine()

**Signature:** `markAsPristine(): void`

Clears only the group's own dirty state. A dirty descendant can keep aggregate `dirty()` equal to
`true`.

```ts
const address = group({
  city: field('Zurich'),
});

address.markAsDirty();
address.markAsPristine();
address.pristine(); // true
```

### Availability

#### disable()

**Signature:** `disable(message?: string): void`

Disables the group subtree. An optional message records why it was disabled.

```ts
const address = group({
  city: field('Zurich'),
});

address.disable('Address is locked');
address.disabled(); // true
address.city.disabled(); // true
```

#### enable()

**Signature:** `enable(): void`

Clears the disabled state created by `disable()`. Configured or inherited reasons can still keep
the group disabled.

```ts
const address = group({
  city: field('Zurich'),
});

address.disable();
address.enable();
address.enabled(); // true
```

#### markAsReadonly()

**Signature:** `markAsReadonly(): void`

Marks the group subtree readonly, preventing bound controls from committing value changes.

```ts
const address = group({
  city: field('Zurich'),
});

address.markAsReadonly();
address.city.writable(); // false
```

#### markAsWritable()

**Signature:** `markAsWritable(): void`

Clears the readonly state created by `markAsReadonly()`. Other configured or inherited readonly
state can still apply.

```ts
const address = group({
  city: field('Zurich'),
});

address.markAsReadonly();
address.markAsWritable();
address.writable(); // true
```

#### hide()

**Signature:** `hide(): void`

Marks the group subtree hidden without changing its values.

```ts
const address = group({
  city: field('Zurich'),
});

address.hide();
address.city.visible(); // false
```

#### show()

**Signature:** `show(): void`

Clears the hidden state created by `hide()`. Other configured or inherited hidden state can still
apply.

```ts
const address = group({
  city: field('Zurich'),
});

address.hide();
address.show();
address.visible(); // true
```

### Control methods

#### flush()

**Signature:** `flush(): void`

Immediately commits pending control values throughout the group subtree. It is a no-op when no
control is debouncing.

```ts
const address = group({
  city: field('', { debounce: 300 }),
});

address.city.setControlValue('Zurich');
address.flush();
address.city(); // 'Zurich'
address.debouncing(); // false
```

#### focus()

**Signature:** `focus(options?: FocusOptions): void`

Focuses the first bound UI control in the group subtree in DOM order. A control bound directly to
the group takes precedence over descendant bindings. Standard `FocusOptions` are forwarded.

```ts {21}
{groupFocusSource}
```

</div>

See [Dynamic object children](../guides/dynamic-object-children.md),
[Tree navigation and API access](../concepts/tree-and-api.md), and the
[shared Node API](./node-api.md).
