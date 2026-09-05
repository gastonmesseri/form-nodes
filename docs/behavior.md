# Behavior reference

This document records the behavior currently implemented by the library. It is an evolving specification and the source material for future user-facing documentation.

The internal state model is inspired by Angular 22 Signal Forms. The current reference baseline is Angular `22.1.5` at commit `468b65b74566537456c192ac4281795c5a1e1a5e`. Public names and signatures intentionally belong to this library and do not attempt to reproduce Angular's API.

Every `field()`, `group()`, `form()`, and `array()` exposes its complete API through `.api`, which
is the recommended access for application code. Every node also exposes the reserved `$api` escape
hatch. `$api` always provides collision-safe access to the node API, including when an object node
declares a child named `api`. Internal library code uses `$api`, so user-defined children cannot
interfere with node operations. `$api` is a supported, stable escape hatch; it is not deprecated.

```ts
const profile = form({ age: field(23) });

profile.disabled();
profile.disable();
profile.patch({ age: 30 });
profile.api.disabled(); // recommended API access
profile.$api.disabled(); // equivalent reserved escape hatch
```

A group or form also exposes its initially declared children as direct properties. When a child name collides with a
direct API member, the child always wins in both runtime behavior and TypeScript. Continue using
`.api` in the common case; use `$api` when guaranteed collision-free access is needed:

```ts
const profile = form({
  age: field(23),
  readonly: field(false),
});

profile.readonly(); // false
profile.api.readonly(); // readonly state of the form
```

Every group and form also exposes a stable, readonly `children` map for explicit tree navigation.
Its entries are the same node instances exposed directly on the aggregate, and nested groups and
forms provide their own `children` maps:

```ts
const profile = form({
  name: field('Marco'),
  address: { city: field('Madrid') },
});

profile.children.name === profile.name; // true
profile.children.address.children.city === profile.address.city; // true
profile.api.children === profile.children; // true
```

As with every direct form API member, a child named `children` takes precedence at the top level. The explicit map always remains available through `form.api.children`:

```ts
const profile = form({ children: field('value') });

profile.children(); // 'value'
profile.api.children.children(); // 'value'
```

Native function members such as `name`, `apply`, `arguments`, `call`, and `length` are hidden from
the public `field()`, `group()`, and `form()` types. If an object node declares a child with one of
those names, that child is intentionally exposed instead and takes precedence in both TypeScript
and runtime behavior:

```ts
const example = form({
  name: field('profile'),
  apply: field('value'),
});

example.name(); // 'profile'
example.apply(); // 'value'
```

## Design guarantees

- The library provides small, typed, signal-based `field()`, `group()`, `form()`, and `array()` primitives.
- Every primitive can be created and used anywhere without an Angular injection context.
- Synchronous behavior and node-driven asynchronous validation do not require dependency injection.
- Asynchronous validators always use an Angular reactive watcher, including outside an injection context.
- Signals expose reactive state while actions are declared as methods in public types, allowing editors to distinguish state from behavior in IntelliSense.
- Values remain programmatically readable and writable regardless of disabled, readonly, or hidden state.

## Configured primitive factories

`createFormPrimitives()` returns an isolated `field`, `form`, `group`, and `array` factory set.
Its optional defaults include `nullable`, `validatorMessages`, `inheritInjector`, and
`adoptBindingInjector`; the boolean policies retain their ordinary `true` defaults when omitted.
The package-level factories retain their nullable-by-default behavior. A nullability default applies
to direct fields, object field shorthands, dynamically added children, and nodes created later from
array templates or factories. An explicit `field.strict()` or `field.nullable()` call takes precedence, and an existing
node attached to a configured form retains the policy of the factory that originally created it.

Nullish initial values remain nullable even in a non-nullable factory set because no non-null value
exists to preserve. Consumers can declare the intended future type with an explicit nullable field,
such as `field.nullable<string>()`.

The configured validator catalog is a fallback for every node created by the set, including a
standalone field. Explicit node and ancestor catalogs take precedence, followed by the configured
factory catalog, captured Angular provider catalogs, the process-wide catalog, and built-in text.
Configured injector policies apply to each newly created node, while a node-local option takes
precedence. The factory does not accept an injector because doing so would make that injector an
explicit owner of every created node instead of preserving hierarchical ownership.

Every runtime node exposes `nodeType()`, which returns the precise public discriminant `'field'`,
`'group'`, `'form'`, or `'array'`. The literal is stable for the node's lifetime and is preserved by
template cloning. Generic infrastructure can read the same method through `$api.nodeType()` when a
named child shadows the direct member. The internal readonly `$api._nodeType` discriminant remains
the implementation source of truth for capability selection. The separate private symbol used by
`isNode()` remains responsible only for answering whether an arbitrary value is a library node.

## Public API documentation conventions

Public properties and methods should include concise JSDoc written for IntelliSense, especially
when a name does not communicate its scope, propagation, ownership, or relationship to another
API member on its own.

- Emphasize the most important semantic distinction with **bold text**. Bold should identify
  information that prevents a likely misunderstanding, such as whether errors belong only to the
  current node or include descendants; it should not be used merely for decoration.
- Put recommendations and easy-to-miss alternatives in a separate paragraph prefixed with `ℹ️`.
  Add an empty JSDoc line before the callout so Markdown renderers display it independently.
- Format referenced API calls as inline code and prefer direct wording such as
  “use `allErrors()` instead” over referring vaguely to “the other method.”
- Keep the normal explanation even when a callout is present. The callout highlights the choice;
  it does not replace the behavioral contract.
- Do not rely on colors, HTML styling, or editor-specific rendering. JSDoc Markdown, bold text,
  inline code, and the Unicode information symbol must remain understandable as plain text.

Consumer-created options and configuration objects are mutable in the public type system. A
`readonly` modifier there would add editor noise without protecting library-owned state. Small
accepted unions and one-property call-site objects are exposed inline so completion shows the
choices immediately; named types remain for concepts that applications reasonably construct,
share, or annotate separately. Library-owned state, signals, error results, and snapshots remain
readonly where mutation would violate their contract.

For example:

```ts
/**
 * A signal containing the validation errors of **this form node itself, excluding its descendants**.
 *
 * ℹ️ To collect errors from the complete subtree, use `allErrors()` instead.
 */
errors: Signal<readonly ValidationError[]>;
```

## Public exports

The package exports:

- `field()` and the `Field`, `FieldApi`, and `FieldOptions` types.
- `form()` and the `Form`, `FormApi`, `FormOptions`, `FormValue`, `FormValueContract`, `FormSet`, and
  `FormPatch` types.
- The `ValidationError`, `ValidationResult`, `ValidationSuccess`, `ValidationStatus`, `Validator`, and `Validators` types.
- `asyncValidator()` and its `AsyncValidator`, `AsyncValidatorBaseContext`, `AsyncValidatorContext`, `AsyncValidatorOptions`, `AsyncValidatorState`, `ParameterizedAsyncValidatorConfig`, `ParameterizedAsyncValidatorContext`, and `ParameterizedAsyncValidatorOptions` types.
- Built-in `required`, `requiredIf`, `min`, `max`, `between`, `integer`, `equalTo`, `uniqueItems`, `minLength`, `maxLength`, `pattern`, `email`, `url`, `minDate`, `maxDate`, and `dateBetween` validators.

The published package uses ESM and declares `sideEffects: false`. Validators and their default
messages are independent exports internally, allowing consumer bundlers to remove validators that
the application does not import. The package-consumer verification builds a minified esbuild bundle
that imports only `required` and asserts that representative unused validators and messages are
absent. All public validators remain present in the published package itself; tree shaking reduces
the consuming application's final bundle rather than removing available package exports.

## Creating fields

`field()` creates a leaf node:

```ts
const name = field('David');
const age = field<number>(23);
const optionalName = field<string>();
```

Fields are nullable by default. The examples above have types `Field<string | null>`, `Field<number | null>`, and `Field<string | null>`. A field created without a value starts at `null`.

A field created from the literal `null` or `undefined` without an explicit generic is inferred as
`Field<unknown>`. Their runtime values remain distinct: `null` stays `null`, while an explicitly
provided `undefined` stays `undefined`:

```ts
const unspecified = field(null);
unspecified.set('David');
unspecified.set(42);

const alsoUnspecified = field(undefined);
alsoUnspecified(); // undefined

const known = field<string>(null);
// Field<string | null>
```

`unknown` is used instead of `any` so reads cannot silently bypass type checking. TypeScript reduces
`unknown | null` to `unknown`; the field remains nullable at runtime, but consumers
should supply an explicit generic when the eventual non-null type is known.

The preferred signature accepts an optional initial value followed by an options object:

```ts
const name = field('', {
  validators: [required],
  injector,
  disabled: false,
  readonly: false,
  hidden: false,
});
```

All options are optional, so state can be configured without supplying validators. Validators and state options can alternatively be passed as separate arguments:

```ts
field('', [required], { disabled: false });
```

`injector` is optional. An explicit or currently captured injector takes precedence and its
`DestroyRef` deterministically owns the asynchronous validation watcher. Without an injector of its
own, the field temporarily adopts a directly bound `[formNode]` host injector and then uses the
nearest injector on its parent chain by default. Set `adoptBindingInjector: false` or
`inheritInjector: false` to disable those independent lookup stages.

In the separate-argument form, the validator array is the second argument and state options are the third argument. When no initial value is passed, the runtime value starts as `null`.

A field is callable and returns its current value:

```ts
name(); // ''
name.value(); // ''
name.api.value(); // ''
```

These reads refer to the same value. Most field state and actions are exposed both on the callable field and under `field.api`. `patch()` is intentionally available only under `field.api`; for a leaf field it behaves exactly like `set()`.

## Creating forms

`form()` creates a container node:

```ts
const profile = form({
  name: field('David'),
  age: field(23),
});
```

The preferred signature accepts a node definition followed by an options object:

```ts
const profile = form({
  city: field('Moscow'),
  billingCity: field('Zurich'),
}, {
  validators: [sameCity],
  injector,
  disabled: false,
  readonly: false,
  hidden: false,
});
```

All options are optional, so form state can be configured without supplying validators. Validators and state options can alternatively be passed as separate arguments:

```ts
form({ name: field('David') }, [validator], { hidden: false });
```

`injector`, `adoptBindingInjector`, and `inheritInjector` have the same asynchronous-validation
ownership roles as they do for fields.

A definition can contain fields, groups, explicit nested forms, arrays, or shorthand nested objects.

A form is callable and returns its aggregated value:

```ts
profile(); // { city: 'Moscow', billingCity: 'Zurich' }
profile.api.value(); // { city: 'Moscow', billingCity: 'Zurich' }
```

The callable and `value()` expose the fully materialized object shape in TypeScript tooling instead of an internal `FormValue<...>` alias. Nested forms and arrays are expanded recursively in IntelliSense.

`FormValueContract<TValue>` is a structural compile-time contract for `satisfies`. It checks that a
form or group is callable as `TValue` and exposes `value: Signal<TValue>` without replacing the
definition-inferred type. Consequently an `array()` definition remains an `ArrayNode` with its
structural methods after the aggregate value is checked against a named model. The contract follows
TypeScript assignability; it does not change runtime behavior or require the model to determine
which primitive represents each property.

Each child is exposed under its definition key. Application code should normally access form-level state and actions through `form.api`. The same API is always available under `form.$api` when a collision-safe access path is required.

The key `api` is a valid child name and that child takes precedence over the alias. The key `$api` is reserved recursively and rejected by the public types, guaranteeing access to the node API at every depth. This guarantee is also enforced at runtime: even if a consumer bypasses TypeScript with `any` and declares a child named `$api`, the real node API keeps precedence at `node.$api`. The illegal child remains part of the form value and can be reached through `node.$api.children.$api`, but it cannot replace the reserved access path. Other function property names such as `name` and `length` remain valid child keys and resolve to the user-defined children at runtime.

```ts
const profile = form({ api: field('domain value') });

profile.api(); // 'domain value'
profile.$api.value(); // { api: 'domain value' }
```

## Groups and nested forms

`group()` is the ordinary object-shaped aggregate. It has children, aggregate value and state,
validators, configuration, and all common node operations, but it has no `submission` option or
`submit()` method:

```ts
const profile = form({
  address: group({
    city: field('Moscow'),
    country: field('Russia'),
  }),
});
```

Plain nested objects are shorthand for groups:

```ts
const profile = form({
  address: {
    city: field('Moscow'),
    country: field('Russia'),
  },
});
```

Shorthand nesting works at any depth. Every shorthand object is normalized to an ordinary
`group()` without validators or options. Use an explicit `group()` when that branch needs its own
validators or structural options. Use an explicit nested `form()` only when the branch intentionally
owns an independent submission workflow.

Inside `form()` and `group()` definitions, strings, numbers, booleans, bigints, symbols, `Date`
instances, `null`, and `undefined` are shorthand for `field(initialValue)`. Primitive literal types
are widened in the same way as a direct `field()` call. `null` and `undefined` produce
`Field<unknown>`, and each shorthand preserves its `null` or `undefined` runtime value. Every array is
also an implicit field, including empty arrays, populated arrays, readonly tuples, nested arrays,
and arrays of plain objects. A mutable empty-array shorthand widens from `never[]` to `unknown[]`,
while an empty readonly tuple widens to `readonly unknown[]`; consumers can use an explicit
`field<T[]>([])` when the eventual item type is known. Array length and contents never select a
node shape; only an explicit `array(...)` creates a dynamic collection of item nodes. Every other value becomes an implicit
field, including ordinary functions and non-plain objects such as `RegExp`, `URL`, maps, sets,
typed arrays, Temporal or Moment-like values, and custom class instances. Only objects whose prototype is
`Object.prototype` or `null` become structural groups. Explicit nodes always retain their existing
behavior.

Object-node declarations use only own enumerable string-keyed data properties. Inherited and
non-enumerable properties are ignored. Enumerable accessors are rejected without invoking their
getter, symbol child keys are rejected because node paths are string-based, and an own
`__proto__` key is rejected to prevent prototype-sensitive assignment. Ordinary string keys such
as `constructor` and `prototype` remain supported children. Diagnostics identify the complete path
from the `form()` or `group()` declaration root and recommend an explicit node for ambiguous
values. This validation runs before any child is normalized, so a failing definition cannot leave
a partially constructed tree.

The same `normalizeObjectDefinition()` boundary is used by `form()`, `group()`, and their nested
shorthand objects and object templates passed to `array()`. Cloning an explicit form, group, or
object template that contains implicit fields preserves those fields as independent nodes. An
array-valued leaf is cloned as a fresh field node while retaining the declared array value identity,
just like an explicit `field(arrayValue)` template leaf.

Inline object literals and object `type` aliases satisfy the structural definition contract. A
value typed through an `interface` does not imply a string index signature in TypeScript. Spread it
into a fresh object to declare a group (`{ ...company }`), or use `field(company)` to declare one
atomic value. Without that explicit choice, TypeScript can infer the interface as an atomic field
while runtime sees the actual plain object and constructs a group.

Type annotations cannot carry runtime prototype information. A class instance can legally be
assigned to an object `type` alias and therefore look like a group definition to TypeScript while
runtime correctly recognizes its non-plain prototype as a field. Consumers that intentionally
widen or erase an object's concrete type at factory, deserialization, or other broadly typed
boundaries should use `field(value)` or spread a verified plain record according to their intended
ownership. Direct object literals, object `type` aliases containing plain values, built-in object
types, Moment-like values, and concrete class types retain matching inference and runtime behavior.

Angular 22.1.x Signal Forms derives its tree from an existing model signal and enumerates object
keys in `packages/forms/signals/src/field/structure.ts`; it does not expose Gem's declaration
shorthand boundary. Gem therefore intentionally uses the stricter rule above for its definition
API while retaining comparable node-state behavior after the definition has been normalized.

Groups and forms provide the same child access and value shape:

```ts
profile.address.city(); // 'Moscow'
profile.address.api.value(); // { city: 'Moscow', country: 'Russia' }
profile.api.value(); // { address: { city: 'Moscow', country: 'Russia' } }
```

Changes to any descendant are reflected reactively in every ancestor value.

## Type inference

- Field value types are inferred from their initial values or explicit generic arguments.
- Form and group value types are recursively inferred from their descendants.
- Concise field definitions infer the same widened nullable type as their equivalent `field()` call;
  literal `null` and `undefined` infer `Field<unknown>`.
- Shorthand objects infer the same values and nested field access as explicit groups.
- Validators receive a `FieldContext` whose `value` signal contains the inferred node value.
- `set()` and `reset(value)` require complete values at compile time.
- `patch()` accepts recursive partial form values.
- Incorrect value types and unknown keys in typed value updates are rejected at compile time.
- Field and form errors use readonly arrays of `ValidationError.WithTargetNode`.

## Field nullability

Fields include `null` in their value type by default, independently of whether their initial value is null:

```ts
const name = field('David');
// Field<string | null>

const emptyName = field<string>(null, []);
// Field<string | null>

const unspecified = field(null);
const unspecifiedFromUndefined = field(undefined);
// Both are Field<unknown>; they start at null and undefined respectively
```

The nullable type affects the complete field API. `value`, `set`, `patch`, `reset`, and validators
all use `TValue | null`. Supplying an explicitly typed `undefined` also adds `undefined` to those
surfaces so the declared runtime value remains type-safe.

Use `field.strict()` to remove null from the field type:

```ts
const name = field.strict('David');
// Field<string>

name.set('Ana');
// name.set(null); // TypeScript error
```

`field.strict(value)` always excludes `null`, while
`field.nullable(value)` always includes `null`. Both overrides remain available on field factories
returned by `createFormPrimitives()`, independently of their configured default.

Per-field options do not include `nullable`; these methods are the only local nullability overrides.

A strict field requires a non-null initial value. `field.strict<string>(null)` is rejected by TypeScript.

Nullability intentionally does not change reset behavior. In line with this library's Signal Forms-inspired reset model, `reset()` without a value preserves the current value and clears interaction state. It does not reset nullable fields to null or non-nullable fields to their initial value. `reset(value)` always uses the supplied value.

This differs from Angular Reactive Forms, where `nonNullable` also controls whether a no-argument reset returns to null or to the initial value. Angular Signal Forms instead derives nullability from the model type and does not provide a nullability option.

### Container nullability

The current public nullability model deliberately distinguishes leaf values from structural containers:

- `field()` is nullable by default. Use `field.strict()` when `null` is not a valid field value.
- `form()` and `group()` always expose non-null object values. A structural object node cannot itself be replaced with `null` or `undefined`.
- `array()` always exposes a non-null array value. It accepts `null` or `undefined` through complete-value inputs as an absence shorthand and normalizes either value to `[]`.

Consequently, nullable business values belong naturally in fields, including fields whose value is
an object. `form()`, `group()`, and `array()` represent live structural containers whose children,
aggregation, state propagation, and paths remain available at all times.

## Value operations

### Field values

| Operation | Value effect | Dirty effect | Touched effect |
| --- | --- | --- | --- |
| `set(value)` | Replaces the value | Preserves current state | No change |
| `update(updater)` | Computes and replaces the value from the current committed value | Preserves current state | No change |
| `setControlValue(value)` | Updates `controlValue()` immediately and commits `value()` after the configured debounce | Marks dirty immediately | No change |
| `flush()` | Immediately commits a pending `controlValue()` | No additional change | No change |
| `api.patch(value)` | Same as `set(value)` | Preserves current state | No change |
| `reset()` | Preserves the current value | Clears dirty | Clears touched |
| `reset(value)` | Replaces the value | Clears dirty | Clears touched |

`reset(value)` handles falsy values such as an empty string or zero. Resetting does not replace validators, and validation is recomputed against a newly assigned value.

`update()` is the immutable convenience form of reading and setting a complete value. Its updater runs synchronously once and receives `value()`, never a pending `controlValue()`:

```ts
age.update(value => (value ?? 0) + 1);
```

The operation is executed untracked, delegates to the same programmatic behavior as `set()`, cancels pending field control debounce, synchronizes `controlValue()`, and preserves existing dirty and touched state.

### Control-originated value debounce

`controlValue()` is the immediate value owned by the UI control bound to a field. `value()` is the committed model value used by validators and aggregated by parent forms. Configure `debounce` on a field and send future UI updates through `setControlValue()`:

```ts
const search = field('', { debounce: 300 });

search.setControlValue('angular');

search.controlValue(); // 'angular' immediately
search.value(); // '' until 300 ms elapse
search.debouncing(); // true
```

Every new control update restarts the complete delay. `debounce: 'blur'` instead keeps the latest control value buffered until the native control blurs, a Signal control emits `touch`, a CVA invokes its touched callback, or application code calls `markAsTouched()`. Marking any interactive node touched commits its own pending control value for every debounce strategy, matching Angular Signal Forms. Aggregate `markAsTouched()` also applies this to descendants unless `skipDescendants` is true. A custom debouncer receives an `AbortSignal` and may return a promise; the value commits when that promise resolves. A newer control value aborts the previous signal and ignores its eventual settlement. A rejected debouncer leaves the committed value unchanged and ends `debouncing()`. A synchronous `void` result commits immediately, while a synchronous throw is propagated after cancelling the debounce. `flush()` commits the latest buffered value immediately for every strategy and aborts custom asynchronous work. A missing, non-finite, zero, or negative numeric debounce commits control updates immediately.

Programmatic operations are never debounced. On fields, forms, and arrays, `set()`, `api.patch()`, and `reset(value)` cancel any pending control update and synchronize `controlValue()` and `value()` immediately. `reset()` without a value aborts custom asynchronous debounce work, discards the buffered control value, and restores `controlValue()` and any bound custom control from the currently committed value. This prevents a stale completion from overwriting newer programmatic state. A control update marks its directly bound node dirty immediately; reset clears dirty and touched state as usual without dirtying aggregate descendants.

Synchronous and asynchronous validators observe only committed `value()` changes. Parent forms likewise aggregate committed child values, including for nested forms. Every node exposes `controlValue()`, but it represents only the control bound directly to that node and does not aggregate pending control values from descendants. `debouncing()` is independent from asynchronous validation `pending()`.

This follows the control buffer semantics inspected in Angular Signal Forms 22.1.4 at commit `898380974d49cf7976e9d89cc74a0801a26ce7b1`, primarily `packages/forms/signals/src/api/types.ts`, `packages/forms/signals/src/field/node.ts`, `packages/forms/signals/src/field/state.ts`, and the debounce/reset field tests. This library exposes action methods instead of Angular's writable state signals to preserve its public API style.

#### Inherited and aggregate debounce behavior

`form()` and `array()` accept `debounce` as an inherited default for descendant fields. A field's
own `debounce` takes precedence, and nested aggregate nodes can establish a different default for
their subtrees. The nearest configured node wins:

```ts
const profile = form({
  name: field(''),
  address: {
    city: field('', { debounce: 100 }),
  },
}, {
  debounce: 300,
});
```

Here, `name` inherits 300 ms and `address.city` overrides it with 100 ms. An explicit zero or
negative value also overrides an inherited delay and commits control updates immediately. Dynamic
array items resolve the effective debounce after they are attached, so both current and future
items inherit from their array and ancestors.

Aggregate nodes expose a readonly `controlValue()` for a custom control bound directly to that form
or array. Such a control has its own debounce buffer: `controlValue()` changes immediately while
`value()` and descendants retain their committed values until the aggregate strategy completes or
`flush()` runs. Descendants remain pristine because the dirty interaction belongs to the aggregate
control. A newer programmatic or descendant value invalidates the aggregate buffer so stale work
cannot overwrite it.

Pending control values from descendants are intentionally not composed into an ancestor's
`controlValue()`. Until those descendants commit, both ancestor `value()` and `controlValue()` keep
their last committed representation. This follows Angular Signal Forms, whose node-level
`controlValue()` explicitly does not incorporate child control values. Unlike Angular's writable
signal, this library keeps the signal readonly and distinguishes control-originated writes through
its binding API.

`form.debouncing()` and `array.debouncing()` are true while any current descendant field has a
pending control-value debounce. They aggregate only control debounce state and remain independent
from asynchronous validation `pending()`.

`form.flush()` and `array.flush()` recursively commit every pending control value in their current
subtrees. Flushing the root commits all branches; flushing a nested form or array affects only that
branch. Ancestors observe the resulting committed values normally, while siblings retain their
pending buffers. Removed array nodes are no longer included, and newly inserted items participate
as soon as they are attached.

Debouncer inheritance was verified against Angular Signal Forms `v22.1.4` at commit
`898380974d49cf7976e9d89cc74a0801a26ce7b1`, primarily
`packages/forms/signals/src/field/state.ts`, `packages/forms/signals/src/api/types.ts`, and
`packages/forms/signals/test/node/api/debounce.spec.ts`. Aggregate `debouncing()` and recursive
`flush()` are conveniences specific to this library.

### Form values

| Operation | Value effect | Dirty effect | Touched effect |
| --- | --- | --- | --- |
| `api.set(value)` | Recursively assigns all supplied branches | Preserves current state | No change |
| `api.update(updater)` | Computes and recursively assigns a complete value from the current form value | Preserves current state | No change |
| `api.patch(value)` | Recursively assigns only supplied branches | Preserves current state | No change |
| `api.flush()` | Recursively commits pending descendant control values | No additional change | No change |
| `api.reset()` | Preserves every descendant value | Clears dirty throughout the subtree | Clears touched throughout the subtree |
| `api.reset(value)` | Recursively assigns the complete value | Clears dirty throughout the subtree | Clears touched throughout the subtree |

At the type level, `set()` and the result of `update()` require every form key, while `patch()` rejects unknown keys. At runtime, unknown keys passed through an unsafe cast are ignored and produce an English console warning. The `update()` callback runs synchronously once in an untracked context and delegates its complete result to `set()`.

Calling reset on a nested form only resets that subtree. State belonging to siblings is preserved.

### Dynamic object children

`form()` and `group()` accept named children after creation through `add(key, definition)` or an
atomic `add(definitions)` call. Both signatures accept the same field and nested-object shorthands
as initial construction: concise values normalize to `field()`, while plain objects normalize to
`group()`. Arrays normalize to atomic fields; a dynamic collection still requires an explicit
`array(...)`. The returned nodes retain their exact inferred types. The complete input is validated and every explicit node is
confirmed detached before normalization, so an invalid batch cannot attach or construct only some
of its children. Dynamic
children are not installed as direct properties: this makes an undeclared or misspelled property a
TypeScript and Angular strict-template error. `get(key)` and `children[key]` return
`DynamicNode | undefined`; initially declared children keep their original precise and non-optional
direct-property types. `DynamicNode` exposes the state and
operations common to every primitive directly, including `value`, `disabled`, validation, and
interaction state, while hiding native function members and omitting primitive-specific methods.

New children immediately receive their parent, key, path, nearest form, structural root, inherited state, debounce,
and injector. They participate in aggregate value, errors, validation status, pending, touched,
dirty, focus, reset, and control operations as soon as the structural version changes. Duplicate
keys and reserved `$api` or `$field` keys throw before any entry in a batch is attached. A node that
already has a parent is rejected rather than silently stolen from another tree.

An implicit field returned by `add()` is an ordinary live field. Removing it releases its parent,
path, root, inherited availability state, debounce, and injector ownership while preserving its own
value and interaction state. The detached node can subsequently be added to another form or group,
where it adopts that parent's ownership and inherited state. Replacing a dynamic key remains an
explicit `remove(key)` followed by `add(key, definition)` operation; there is no separate implicit
replacement path. Resetting a parent includes every currently attached implicit child and clears
its interaction state under the same rules as an explicitly declared field.

`remove(key)` only detaches children introduced through `add()`. Initially declared children cannot
be removed because their public types guarantee their presence. A removed node remains usable,
loses its parent relationship, and no longer contributes to its former ancestor aggregates. A
standalone removed node reports `form() === null` unless it is itself an explicit form, and every
removed node becomes its own structural root.

The form's statically inferred value type remains based on its initial definition. Runtime values
contain current dynamic properties, but callers should retain the typed result of `add()` or narrow
the result of `get()` or `children[key]` when they need a dynamic value. Fixed-shape `set()`, `patch()`, `update()`, and
`reset(value)` signatures remain unchanged. Runtime dynamic keys supplied through untyped data are
updated; omitted dynamic keys retain their values. Reset operations still clear their interaction
state.

The overloads preserve input cardinality intentionally: `add(key, definition)` returns the exact
attached node, while `add(definitions)` returns an exact keyed map of attached nodes. Structural
mutation, parentage, and aggregate-state changes remain explicit through `add()` and `remove()`.

This intentionally differs from Angular Signal Forms `v22.1.5` at commit
`468b65b74566537456c192ac4281795c5a1e1a5e`. Angular derives changing child structure from its
writable model rather than exposing `add()` or `remove()` operations. The relevant implementation
and identity behavior are in `packages/forms/signals/src/field/structure.ts`,
`packages/forms/signals/src/field/proxy.ts`, and `packages/forms/signals/src/field/manager.ts`, with
coverage in `packages/forms/signals/test/node/dynamic.spec.ts`,
`packages/forms/signals/test/node/field_node.spec.ts`, and
`packages/forms/signals/test/node/field_proxy.spec.ts`.

## Validators and errors

A validator receives a context object and returns no error, one error, or a readonly array of errors. The initial context intentionally exposes only a readonly `value` signal:

```ts
const required = ({ value }: FieldContext<string | null>) =>
  value() === '' ? { kind: 'required' } : null;
```

```ts
type FieldContext<TValue> = {
  readonly value: Signal<TValue>;
};
```

The same context shape is used for field-level and form-level validators. In a form validator, `value()` returns the current aggregated form value. Reading `value()` participates in Angular's reactive dependency tracking, so validation recomputes when the node value changes. The context object and its signal remain stable between validator executions.

Additional Angular Signal Forms context members such as `state`, `fieldTree`, `valueOf`, `stateOf`, `fieldTreeOf`, and `pathKeys` are not implemented yet. They will be designed separately instead of being included with provisional semantics.

Every validation error has a `kind` string and may have a human-readable `message`. Custom errors may include additional data. A validator result can be `null`, `undefined`, or `void` for success, a single `ValidationError.ValidatorResult`, or a readonly array of such errors.

Validators normally omit their own target. When their results are exposed through `errors()`, the validator runner associates every untargeted error with the node being validated through `targetNode`:

```ts
const name = field('', [required]);
const error = name.errors()[0];

error.kind === 'required';
error.targetNode === name;
```

The public error variants are:

```ts
ValidationError.WithTargetNode<TNode>
ValidationError.WithOptionalTargetNode<TNode>
ValidationError.WithoutTargetNode
ValidationError.ValidatorResult<TNode>
```

Field errors use their `Field<TValue>` as the target type. Form errors use their complete `Form<TNodes>` as the target type. A form, group, or other aggregate validator may explicitly return a descendant in `targetNode` for a cross-field rule. The internal defaulting operation preserves that target; otherwise it assigns the validated node. `formNode` remains reserved for errors produced by concrete rendered bindings.

This property corresponds behaviorally to Angular Signal Forms' `fieldTree`, but is named `targetNode` to match this library's field-and-form node model. An error produced by a concrete control binding may additionally expose `formNode: FormNodeBinding`. Node validators leave this property absent because their errors belong to the node rather than to one rendered control.

Synchronous and asynchronous validators share one readonly validator array. Asynchronous validators must be explicitly wrapped with `asyncValidator()`; the library does not invoke a validator merely to detect whether it returns a Promise or Observable.

Validator callbacks receive a stable context containing `value`, `node`, `field`, `parent`, and `path`. Read interaction, availability, required, and submission signals through `node()` or `field()`; those signals are no longer copied onto the context. `node()` and its alias `field()` return the real callable node being validated, including when that node is a form, while `node().api` and `field().api` expose the node API when an alias is needed:

```ts
field('David', {
  validators: [context => {
    context.value();
    context.node().disabled();
    context.path();
    context.field();
    context.node().api.errors();
    return null;
  }],
});
```

The value and navigation properties reference the same stable signals as `api`; they are not copied state snapshots. The synchronous context object also remains stable between executions. Signals read through either surface participate in normal reactive dependency tracking. `ValidatorApi<TValue>` preserves the validated value type, while `field` is a readonly signal of the generic field/form/group/array API union.

Synchronous validators execute inside the node's internal `computed()`. Any Angular signal read directly by the callback becomes a dependency, including signals external to the form tree. No additional `computed()` wrapper is required:

```ts
const blocked = signal(false);
const username = field('David', {
  validators: [() => blocked() ? { kind: 'blocked' } : null],
});

username.errors(); // []
blocked.set(true);
username.errors(); // [{ kind: 'blocked', targetNode: username }]
```

Like every Angular `computed()`, synchronous validation is lazy: a dependency change invalidates it, and the validator re-executes when validation state is next consumed. A reactive consumer of `errors()`, `valid()`, `invalid()`, or `validationStatus()` observes the update automatically. This behavior applies equally to field and form validators.

### Validator sources and conditional synchronous validators

Every built-in validator factory accepts a reactive `when(context)` option. The callback receives
the same stable, complete validator context as the validator itself. While it returns `false`, the
validator contributes no errors and none of its marked constraint metadata. Signals read by the
callback invalidate both validation and metadata, including while the node is non-interactive.
Message-string shorthand remains supported, while conditional rules use the options-object form.
`requiredIf(condition)` remains as a concise equivalent to `required({ when: () => condition() })`
for zero-argument conditions.

Every built-in validator factory also accepts an `error` option containing one custom validation
error, an array of errors, or a reactive `(context) => result` function. It is evaluated only when
the built-in rule fails and replaces that rule's normal structured error. Returning an empty array,
`null`, or `undefined` suppresses the failure. Signals read by an error function are tracked while
the rule is failing. `message` and `error` are mutually exclusive because a custom error owns its
complete message and shape. `when` runs first, so an inactive rule evaluates neither its built-in
logic nor its error override. Constraint and required metadata remain governed by the rule and its
`when` condition rather than by whether a custom error suppresses the failure.

`validators` accepts either one synchronous validator or a readonly array of validators. `null` and `undefined` entries in that array are ignored, enabling expressions such as `[required, condition() ? minLength(2) : null]`. The positional validator argument and `setValidators()` accept the same forms. Internally, the source is normalized, so `validators()` always returns a readonly array containing only effective validators:

```ts
const name = field('', { validators: required });

name.validators(); // [required]
name.setValidators([required, null, minLength(2)]);
```

This makes a normal boolean condition convenient when constructing a field:

```ts
const myField = field('Marco', [
  required,
  someCondition ? minLength(2) : null,
]);
```

Here, `someCondition` is evaluated when `field()` is called. If the condition must react to a signal changing later, read that signal inside a validator source instead, as in the following example.

A synchronous validator may return another synchronous validator or an array of synchronous validators. The runner invokes every returned validator with the same stable context and continues resolving returned validators until it reaches normal validation results. This provides reactive conditional composition without replacing the configured validator source:

```ts
const otherAge = signal(23);
const name = field('', {
  validators: () => otherAge() > 30 ? [required, minLength(2)] : null,
});

name.errors(); // []
otherAge.set(31);
name.errors(); // [{ kind: 'required', targetNode: name }]
otherAge.set(30);
name.errors(); // []
```

Configured validators can be returned in the same way:

```ts
const requiredName = required({ message: 'Name is required' });

field('', {
  validators: [context => context.node().touched() ? requiredName : null],
});
```

Signals read by either the outer or returned validators are dependencies of the same synchronous validation `computed()`. Nested composition is supported, and every level receives the same context object. `null` and `undefined` entries in a returned validator array are ignored, which allows concise conditional entries such as `() => [required, enabled() ? minLength(2) : null]`. After empty entries are removed, an array must contain either only validators or only validation errors; mixing validators and errors in one returned array throws because its intended evaluation order would be ambiguous. Circular composition throws an English runtime error, and resolution is limited to 100 returned-validator levels to protect against chains that continually allocate new functions.

An `asyncValidator()` cannot be returned by a synchronous validator. Asynchronous validators must be placed directly in the validators array so their watcher lifecycle, debounce, cancellation, pending state, and dependency discovery can be established without executing arbitrary synchronous validators for classification:

```ts
field('', {
  validators: [
    required,
    asyncValidator(async ({ value }) =>
      await checkAvailability(value()) ? null : { kind: 'unavailable' },
    ),
  ],
});
```

```ts
const username = field('', [
  required,
  asyncValidator(async ({ value, abortSignal }) => {
    const available = await checkUsername(value(), abortSignal);
    return available ? null : { kind: 'usernameTaken' };
  }, { debounce: 300 }),
]);
```

`AsyncValidatorOptions` supports `debounce`, a `when(context)` condition, and `onError(error, context)`. The asynchronous context extends the same shared context with an `abortSignal` belonging only to that execution. Parameterized validators additionally receive their `params` snapshot. Neither execution-specific property is added to or mutated on `field`. Validators can pass the signal to APIs such as `fetch`; stale results are ignored even when the underlying operation does not honor cancellation.

The `asyncValidator()` overloads inline these accepted option shapes so editor completion exposes
`debounce`, `when`, `onError`, `params`, and `validate` without navigating through a type alias.
The named option and configuration types remain exported for separately constructed reusable
configuration objects.

Asynchronous callbacks access the runtime node API through `node().api` or `field().api`. Inline
validators infer the owning primitive and its API. Separately declared helpers use the generic
node union unless their `TField` generic supplies an exact node. The existing `TApi` generic stays
in its original position and specializes only the remaining context `parent` and `path` signals;
it no longer exposes a separate `api` member. Use `value()` for typed values without an exact node.
Automatic validators track node API signals they read. Parameterized validators track those reads
inside `params`, while their `validate` callback remains untracked.

Every field and form API exposes `path: Signal<readonly string[]>`. The root path is `[]`; each descendant appends its key in the parent, such as `['address', 'city']`. Validator callbacks access the same reactive path through either `context.path()` or `context.node().api.path()`. This follows Angular 22 Signal Forms' `pathKeys` model while using this library's `path` name.

Every API also exposes `parent: Signal<Node | null>`, which returns the complete callable parent node or `null` at the root. Nodes reached through a form are refined to their concrete parent type, so `profile.address.city.api.parent()` is typed as `typeof profile.address | null`. A standalone field reference cannot know its future owner and therefore retains the general `Node | null` parent type even after being inserted into a form; access through the form provides the refined type.

Nodes returned by the common validator API's `parent()`, `form()`, and `root()` remain callable, but native JavaScript function members such as `apply`, `bind`, `call`, `name`, and `prototype` are intentionally hidden from the public type and IntelliSense. Exact node return types apply the same hiding while preserving form keys that intentionally use one of those names.

`api.form` resolves the nearest explicit `form()` workflow. Every form returns itself even when it
is nested, and its descendants resolve that form until another explicit form begins. A standalone
field, group, or array returns `null`. `api.root` independently resolves the topmost structural node
and never returns `null`: any standalone field, group, form, or array returns itself. Groups inside
arrays follow the same rules. Removed array items and dynamically detached nodes become independent
roots; reattaching or reparenting them updates both signals immediately.

Both lookups are reactive. Attaching, detaching, or reparenting a node retriggers automatic async
validators that read the affected signal. Validator callbacks use `context.node().form()` and
`context.node().root()`. Flat `context.form` and `context.root` properties are absent at runtime and
in the public types; `parent` remains flat. The full `context.node().api` retains node navigation.

`context.node` and `context.field` are the same readonly Angular signal of the validated node.
Neither returns `null`. Inline callbacks, including inline `validator()` and `asyncValidator()`
helpers, infer the node from `field`, `form`, `group`, or `array`, preserving value nullability,
aggregate child types, and array item types. Configured primitives and field nullability overrides
retain their defaults. Array validator overloads precede positional initial-value overloads so
helper calls in validator arrays receive the validator's contextual type. Runtime array argument
interpretation is unchanged.

Separately declared helpers retain a generic authoring context and remain reusable. Supplying only
a helper's value generic uses its default owner; omit helper generics for inline inference or
supply the owner generic explicitly. `context.node().api` follows the inferred or explicitly supplied node type.
Knowing the local node does not infer ancestors or siblings from an enclosing declaration.
Inline validator contexts reuse the concrete node API value signal type for `value`, so IntelliSense
shows the expanded aggregate model instead of `NoInfer<FormValue<NormalizedNodes<...>>>`. Generic
contexts keep their `TApi` value signal and `TValue`. This is a type-only presentation change:
`NoInfer` remains on primitive inputs, runtime signals are unchanged, and arrays, nullable values,
unions, tuples, and nominal field values retain their types.
Generic nearest-form and field-root lookups now expose complete node APIs, so navigation through
the validated node remains usable without the removed flat shortcuts. Explicit `TField` context
types remain exact under `Signal<TField>` on both aliases. Read values with `context.value()` for
the inferred `TValue`, or with `context.node().value()` / `context.field().value()` through the node.

The signal and its result retain their identities across value changes, validation runs, attachment,
and detachment. Reading only `field()` does not subscribe to the node's value or ancestry. Reading
`field().value()` or a returned node's state or navigation signals tracks those separate dependencies.
Parameterized async validators therefore rerun when their actual params dependencies change, not
merely because an identity-only `field()` read exists. Callback async validators retain their
existing implicit value dependency. The signal is created without requiring an injection context.

This API shape intentionally differs from Angular 22.1.5, verified against the latest stable
Angular 22 tag `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`). Angular's
`packages/forms/signals/src/field/context.ts` exposes `fieldTree` as a getter returning the node's
proxy, separately from its value signal; `packages/forms/signals/test/node/field_context.spec.ts`
tests those distinct `fieldTree`, `state`, and `value` accesses. Gem preserves that distinction
between node identity and reactive node state while adding an explicit readonly signal wrapper.
State reads through the node keep their existing dependency tracking and state propagation; removing
flat context state and API properties changes only the public access path. The context constructor
reuses its existing `node` signal when synchronous and asynchronous validation share the context.

Structural-root type resolution follows at most ten parent links. This limit affects TypeScript
inference only: paths within ten levels retain the exact root type, while deeper paths safely fall
back to `Node`. Runtime traversal remains correct and has no depth limit. Nearest-form inference
uses the form type exposed by the immediate parent and preserves explicit nested workflow boundaries.

This ownership split is library-specific. Angular 22.1.5 Signal Forms, inspected at tag `22.1.5`
(`468b65b74566537456c192ac4281795c5a1e1a5e`) in
`packages/forms/signals/src/api/structure.ts`, `packages/forms/signals/src/field/structure.ts`, and
`packages/forms/signals/test/node/form.spec.ts`, creates one `FieldTree` root from a model signal and
does not expose Gem's explicit nested-form workflow primitive or separate `form()` and `root()`
lookups. Gem retains comparable reactive parent/path behavior while defining these ownership
semantics for its explicit node architecture.

`when(context)` is reactive. While it returns `false`, the validator does not evaluate explicit params, invoke the service, expose pending state, or contribute errors. A transition to `true` starts normal validation. A transition to `false` cancels any debounce timer or in-flight Promise or Observable, clears that asynchronous validation state, and makes stale results unobservable.

For explicit dependency tracking, pass a reactive `params(context)` function. Its return value is captured synchronously and passed to the validator as a stable, typed snapshot:

```ts
asyncValidator({
  params: ({ value }) => ({ username: value(), country: country() }),
  debounce: 300,
  validate: async ({ params, abortSignal }) => {
    const available = await checkUsername(params.username, params.country, abortSignal);
    return available ? null : { kind: 'usernameTaken' };
  },
});
```

Every signal read by `params` is an explicit dependency. When one emits, the new params snapshot is compared shallowly with the previous snapshot: primitives use `Object.is`, while plain objects and arrays compare their own entries one level deep with `Object.is`. Validation only restarts when that comparison changes. For example, `params: () => ({ username: person().firstName })` does not rerun when another property of `person()` changes while `firstName` stays equal. Synchronous changes to several dependencies, including the validated value and `when`, are coalesced into one validation using the latest complete params snapshot; an intermediate stale snapshot is never passed to `validate`.

Explicit params are known before the first execution, so the initial service call also waits for the debounce. A meaningful parameter change cancels stale work, restarts the complete debounce period, and the eventual validator invocation receives the snapshot that triggered it. The `validate` callback runs untracked; signals read only inside it never become dependencies when `params` is present.

Multiple asynchronous validators execute independently. Completed errors become observable while other validators remain pending, but `pending()` stays `true` until every active validator finishes. Errors are always exposed in validator declaration order rather than completion order. Once any completed validator contributes an error, `validationStatus()` is `invalid` even if another validator is still pending; without an error, pending work produces `unknown`. Replacing validators, disabling their `when` condition, changing dependencies, or destroying their owner aborts active work and prevents late Promise resolutions, Observable emissions, and `onError` fallbacks from publishing stale errors.

Asynchronous validation behavior follows Angular 22 Signal Forms where applicable, but uses an internal Promise-and-Observable runner rather than Angular Resource so creation never requires an injection context:

- Asynchronous validators run only while the node is interactive and synchronous validation has no errors.
- Starting a new run aborts the previous run and immediately clears its asynchronous errors.
- `pending()` is true during debounce and execution.
- While pending with no errors, `validationStatus()` is `unknown`, and both `valid()` and `invalid()` are false.
- A completed error makes the validation status `invalid`; successful completion makes it `valid`.
- Child pending and invalid states propagate to ancestor forms.
- Disabling, hiding, or marking a node readonly cancels its active asynchronous validation. Returning it to an interactive state starts validation again.
- Rejected Promises produce no validation error unless `onError` maps the rejection to a validation result.
- Asynchronous results preserve validator-array order, not completion order.

Asynchronous validation is coordinated by a watcher built on Angular's public signals primitives. The initial callback invocation is scheduled in the next microtask, after the expression that created its field or form has completed. This makes it safe for a validator declared in a class property initializer to read another property through its owning form. The node becomes pending synchronously, before that callback starts. Signals read before the validator's first asynchronous boundary become dependencies and automatically trigger a new validation, including sibling fields or external signals captured by the validator.

The watcher does not require dependency injection. A node first uses its explicit or currently
captured injector. Without one, it temporarily adopts the injector of a directly bound
`[formNode]`, then uses the nearest ancestor injector by default, so descendants
created later by an array template or factory join the array's lifecycle even when their factory
runs outside an injection context. Direct binding injectors are stable leases: the first active
binding wins, and removing or rebinding it selects the next binding or falls back to an ancestor.
`adoptBindingInjector: false` disables direct adoption. `inheritInjector: false` stops ancestor
lookup at that node and forms a boundary for its whole subtree unless a descendant has an injector
of its own or an allowed direct binding. Moving a node between parents transfers inherited
ownership; detaching it releases that ownership. Releasing any transient owner cancels its pending
Promise or Observable operation without disabling later validation. Destroying an explicit or
currently captured injector permanently stops its watcher.

With no effective injector, the watcher weakly references its node-owned target, and a
`FinalizationRegistry` disconnects it if that target becomes unreachable. Garbage-collection
cleanup is necessarily nondeterministic, while injector cleanup is immediate. Angular 22.1.4's
`packages/forms/signals/src/field/util.ts` similarly resolves the root field structure's injector
for descendant field trees. Gem Forms deliberately generalizes that lifecycle behavior to every
node and exposes the opt-out boundary because its independently constructed nodes can be detached
or inserted dynamically.

The node value and the `when` condition are tracked before the debounce timer starts. A debounced validator that discovers automatic dependencies starts its publication timer immediately and invokes the service in the next microtask without waiting for that timer. Every signal it reads becomes a dependency, including external signals. Its result is not published until the initial debounce period has elapsed. If any discovered dependency changes during that period, the first operation is cancelled and the replacement invocation waits for a full debounce period before running. Later changes use the same cancellation and debounce behavior.

Synchronous validators remain lazy and first run when validation state is consumed. Both synchronous and asynchronous validators can therefore refer to a class-owned form from a field initializer, such as `this.profile.name()`, without observing an uninitialized `this.profile`. Such callbacks are coupled to that class instance; `context.node().api.form()` remains preferable for reusable validators.

### Typed cross-node validation

When a validator declared inside `field()` needs fully typed access to siblings or other nodes, it can read the class property that owns the completed form. TypeScript then preserves the exact form structure:

```ts
class ProfileComponent {
  readonly profile = form({
    name: field<string>(undefined, [required]),
    age: field(23, {
      validators: [
        ({ value }) => {
          if (!this.profile.name()) return { kind: 'missingSiblingName' };
          return value()! > 120 ? { kind: 'maximumAge' } : null;
        },
      ],
    }),
  });
}
```

Here `this.profile.name()` is typed as `string | null`, and nonexistent nodes are rejected by TypeScript. The sibling signal is also tracked reactively, so changing `name` re-evaluates the `age` validator. Synchronous validation is lazy, and the first asynchronous callback invocation is deferred to the next microtask, so the form property has been assigned before either callback reads it.

An asynchronous self-referential initializer may require an explicit callback return type to prevent TypeScript from inferring the property through its own initializer:

```ts
asyncValidator(async (): Promise<ValidationResult> => {
  return checkName(this.profile.name());
});
```

When coupling a validator to its owning class is undesirable, `context.node().api.form()` and
`context.node().api.root()` are available as fallbacks. Their default types expose the generic form API
and the union of structural node APIs, respectively, without inferring exact sibling keys:

```ts
const workflow = context.node().api.form();
const tree = context.node().api.root();
workflow?.api.valid();
tree.api.valid();
```

The exact API can still be supplied explicitly where supported, but class-property access is the simplest option for inline, fully typed cross-node validation. Reusable validators should prefer explicit dependencies or the common `api.form()` view instead of closing over a component instance.

Every cancelled debounce removes its timer and abort listener immediately. Injector destruction cancels both timers and in-flight Promise or Observable operations. Completed validator controllers are released individually, including when another validator remains pending.

Asynchronous validators accept Promise-like or structurally typed `ObservableLike` results. RxJS Observables satisfy this interface without making RxJS a dependency of the library. An observable-like result represents one validation operation: its first emitted result is used and the subscription is then closed. Completing without emitting is treated as successful validation. A stale or cancelled validation unsubscribes immediately. Observable errors use the same `onError` mapping as rejected Promises.

### Required state

`required()` is a reactive boolean signal intended both for form logic and for presentation metadata. A custom field component can use it to render a required marker or expose an accessibility attribute without inspecting validators or current errors itself:

```ts
const name = field('Marco', [required]);

name.required(); // true, even though the current value is valid
```

```html
<label>
  Name
  @if (name.required()) {
    <span aria-hidden="true">*</span>
  }
</label>
<input [attr.aria-required]="name.required()" />
```

This is comparable to Angular Signal Forms exposing required state for form controls. `required()` does not mean that the node is currently invalid; use `invalid()` or inspect `errors()` for validation status. Conditional validator composition updates the signal reactively when the marked `required` validator becomes active or inactive.

`requiredIf(condition, options?)` packages that conditional behavior as a dedicated validator. Signals read by `condition` are dependencies of both validation and required metadata. While the condition is false, the validator contributes no error and `required()` remains false unless another rule contributes required state. While it is true, the validator uses the same empty-value test, error kind, message resolution, and required metadata as `required`. Custom static and reactive messages use the same string and options-object forms as `required`.

### Own and descendant errors

`errors()` contains only errors that apply directly to the current node. Descendant errors make
an aggregate node invalid, but do not appear in its `errors()` signal. `allErrors()` provides the
recursive alternative: it returns own errors first and then every descendant error in structural
tree order. On a field, which has no descendants, `allErrors()` and `errors()` contain the same
array.

```ts
myForm.errors();    // Errors belonging directly to myForm
myForm.allErrors(); // Errors belonging to myForm and every descendant
```

Every collected error retains its `targetNode`, so consumers can inspect `targetNode.path()` or
navigate to the exact failing node. Forms traverse children in declaration order and arrays use
their current item order. This intentionally follows the recursive behavior of Angular 22 Signal
Forms `errorSummary()`, while using the more explicit public name `allErrors()` and structural
ordering until control bindings provide DOM-order information.

### Looking up an error by kind

`getError(kind)` returns the first active own error with the requested kind, or `undefined` when none exists. Calling it inside a `computed()` or `effect()` is reactive because it reads the node's `errors()` signal:

```ts
const name = field('', [required]);

name.getError('required'); // { kind: 'required', targetNode: name }
name.getError('missing'); // undefined
```

The literal kind and exact target node are retained in TypeScript. A form searches only its own errors, not errors belonging to descendants. When several errors have the same kind, `getError()` returns the first and `errors()` remains the API for accessing every match. Each node internally memoizes a small, bounded set of per-kind computed selectors using shallow result equality, so a consumer of one kind does not propagate merely because an unrelated error kind changed. The method is available both directly and through `.api`; as usual, a form child named `getError` wins at the direct property and `form.api.getError(kind)` remains available.

Parameterized public functions that participate in signal dependency tracking are marked with `@reactive` in IntelliSense. Ordinary signal properties do not need this marker because their `Signal` type already communicates reactivity.

Validation behavior:

- A node with no failing validators has `errors()` equal to `[]`.
- `required()` is `true` when the marked `required` validator is configured or active through synchronous conditional composition, even if the current value passes validation. It is also `true` while the node has an active own error whose `kind` is `required`, including errors from custom or asynchronous validators. A form does not aggregate the required state of its descendants.
- `getError(kind)` returns the first own error of that kind or `undefined`; it does not search descendants.
- All validators run against the current value.
- A validator that returns several errors has its result flattened into the node error array.
- Errors preserve validator order and their order within each validator result.
- Multiple errors with the same `kind` are preserved rather than overwritten.
- Validators returning `null`, `undefined`, or no value add no errors.
- Changing a field value recomputes its validation.
- Changing a descendant recomputes ancestor form validators against the aggregated value.
- Changing an external signal read by a synchronous field or form validator invalidates and recomputes that validation when consumed.
- A synchronous validator may conditionally return another synchronous validator or an array of them; all are resolved with the same context.
- Returning an `asyncValidator()` from a synchronous validator is rejected; asynchronous validators must be direct array entries.
- `setValidators()` applies the new validators to the current value without marking the node dirty.
- Reset preserves validators and revalidates an assigned value.

For an interactive field without pending asynchronous validation:

```ts
valid() === (errors().length === 0)
invalid() === !valid()
```

During pending asynchronous validation, `valid()` and `invalid()` are both false.

A form is valid when its own validators produce no errors and every interactive child is valid. `form.api.errors()` contains only errors produced by validators attached directly to that form. A form can therefore be invalid because of a descendant while its own `errors()` remains empty.

Invalidity propagates upward through any number of nested forms. Fixing the failing descendant updates every ancestor.

### Reusable custom validators

Use `validator<TValue>()` to give a reusable synchronous validator a contextually typed `value`,
node state and API through `node()` or `field()` when it is declared outside a node definition:

```ts
export const adult = validator<number | null>(({ value }) => {
  const age = value();
  return age !== null && age < 18
    ? { kind: 'adult', minimumAge: 18, actual: age }
    : null;
});

const age = field<number>(null, [adult]);
```

`TValue` is the exact type returned by the node's `value()` signal; `validator()` does not alter its
nullability. Since `field()` is nullable by default, standalone field validators normally include
`null` in their model. A validator that excludes `null` can only be attached when the field is
explicitly non-nullable:

```ts
export const positive = validator<number>(({ value }) => {
  return value() > 0 ? null : { kind: 'positive' };
});

const quantity = field.strict(1, [positive]);
```

TypeScript rejects attaching `positive` to a default nullable field. Forms and arrays do not add
`null` to their aggregate values, so their validators use the aggregate model directly, such as
`validator<Profile>()` or `validator<readonly Item[]>()`.

The helper returns the original function without wrapping it. Consequently, signal reads remain
reactively tracked by the ordinary synchronous validation pipeline, validator metadata and
conditional composition are preserved, and no Angular injection context is required. The same
helper supports aggregate value models for validators attached to `form()` and `array()`.

This differs from Angular 22.1.3 Signal Forms, where `validate(path, logic)` registers custom logic
directly against a schema path. This library uses reusable validator values, so `validator()` only
provides an authoring boundary and attaching the returned function to a node performs registration.

### Built-in validators

Built-in validators can be passed anywhere a custom validator is accepted:

```ts
const username = field('', {
  validators: [required, minLength(3), maxLength(30)],
});

const age = field<number>(null, {
  validators: [required, min(18), max(120)],
});
```

| Validator | Accepted value | Empty value behavior | Error shape |
| --- | --- | --- | --- |
| `required` | Any value | Fails for `null`, `undefined`, `''`, `false`, and `NaN` | `{ kind: 'required', message }` |
| `min(limit)` | `number | null` | Passes for `null` and `NaN` | `{ kind: 'min', min, actual, message }` |
| `max(limit)` | `number | null` | Passes for `null` and `NaN` | `{ kind: 'max', max, actual, message }` |
| `between(minimum, maximum)` | `number | null` | Passes for `null` and `NaN`; disabled if either bound is absent or `NaN` | `{ kind: 'between', min, max, actual, message }` |
| `integer` | `number | null` | Passes for `null` | `{ kind: 'integer', actual, message }` |
| `equalTo(expected)` | The expected value type, `null`, or `undefined` | Compares `null` and `undefined` normally | `{ kind: 'equalTo', message }` |
| `uniqueItems(keySelector?)` | A readonly array, `null`, or `undefined` | Absent, empty, and one-item arrays pass | `{ kind: 'uniqueItems', duplicateIndexes, message }` |
| `minLength(limit)` | A value with numeric `length` or `size`, or `null` | Passes for `null` and `''` | `{ kind: 'minLength', minLength, actual, message }` |
| `maxLength(limit)` | A value with numeric `length` or `size`, or `null` | Passes for `null` and `''` | `{ kind: 'maxLength', maxLength, actual, message }` |
| `pattern(expression)` | `string | null` | Passes for `null` and `''` | `{ kind: 'pattern', pattern, actual, message }` |
| `email` | `string | null` | Passes for `null` and `''` | `{ kind: 'email', message }` |
| `url` | `string | null` | Passes for `null` and `''` | `{ kind: 'url', message }` |
| `oneOf(values)` | The allowed value type, `null`, or `undefined` | Passes for `null`, `undefined`, and `''` | `{ kind: 'oneOf', options, actual, message }` |
| `minWords(limit)` | `string | null` | Passes for `null` and `''` | `{ kind: 'minWords', minWords, actual, message }` |
| `maxWords(limit)` | `string | null` | Passes for `null` and `''` | `{ kind: 'maxWords', maxWords, actual, message }` |
| `minDate(limit)` | `Date | null` | Passes for `null` and invalid dates | `{ kind: 'minDate', minDate, actual, message }` |
| `maxDate(limit)` | `Date | null` | Passes for `null` and invalid dates | `{ kind: 'maxDate', maxDate, actual, message }` |
| `dateBetween(minimum, maximum)` | `Date | null` | Passes for `null` and invalid dates; disabled if either limit is absent or invalid | `{ kind: 'dateBetween', minDate, maxDate, actual, message }` |

Date limits accept a `Date`, an ISO calendar-date string in `YYYY-MM-DD` format, the relative-day
shortcut `'today'`, or a reactive function returning any of those
representations. Strings and shortcuts use UTC midnight by default so their behavior matches
`new Date('YYYY-MM-DD')` and Angular's native date-input constraint formatting. Pass
`{ parseAs: 'local' }` to use midnight in the consumer's local time zone instead. Invalid calendar
dates and other string formats disable the constraint, just like an invalid `Date`. Regardless of
the input representation, validation errors and the public `min()`/`max()` metadata signals expose
the normalized `Date`.

Relative-day shortcuts are resolved lazily whenever their validator or constraint metadata is
evaluated. A static shortcut such as `minDate('today')` therefore does not capture the date when it
is declared. The library deliberately does not install a hidden midnight timer: after midnight,
the newly resolved boundary becomes observable on the next normal validation invalidation, such as
a value change or a reactive dependency change.

This is an intentional public-API extension over Angular 22.1.4 Signal Forms
(`898380974d49cf7976e9d89cc74a0801a26ce7b1`), whose `minDate` and `maxDate` rules accept `Date`
constraints only. The reference implementation and tests inspected were
`packages/forms/signals/src/api/rules/validation/min_date.ts`, `max_date.ts`,
`packages/forms/signals/test/node/api/validators/min_date.spec.ts`, and `max_date.spec.ts`.
Validation and constraint propagation remain Date-based after normalization.

```ts
field<Date>(null, [minDate('2026-08-24')]);
field<Date>(null, [minDate('today')]);
field<Date>(null, [maxDate(() => 'today')]);
field<Date>(null, [maxDate('2026-12-31', { parseAs: 'local' })]);
field<Date>(null, [dateBetween('today', '2026-12-31')]);
```

`dateBetween(minimum, maximum)` combines the inclusive comparisons of `minDate()` and `maxDate()`
into one structured error. Both limits independently accept `Date`, `YYYY-MM-DD`, or a reactive
source, and the inline `{ parseAs?: 'utc' | 'local'; message?: ... }` options apply consistently to
both string limits. If either resolved limit is absent or invalid, validation and both date
constraint metadata values are temporarily disabled together. Otherwise, `min()` and `max()`
expose the normalized `Date` boundaries for native-control propagation.

Angular 22.1.4 Signal Forms has separate `minDate` and `maxDate` schema rules but no combined
`dateBetween` rule. This is a convenience API with the same inclusive date comparisons and
optional-value behavior.

Built-in validators accept a static message string directly wherever it is unambiguous. Their
options object remains available for reactive messages and additional options such as date parsing:

```ts
field('David', [required]);
field('David', [required('Name is required')]);
field('David', [required({ message: () => translatedRequiredMessage() })]);
field('', [email('Enter a work email')]);
field('', [url('Enter a complete URL')]);
field(1.5, [integer('Enter a whole number')]);
field('yes', [equalTo('yes', 'Values must match')]);
field(16, [min(18, 'You must be at least 18')]);
field(70, [between(18, 65, 'Enter a supported age')]);
```

`between(minimum, maximum)` validates an inclusive numeric range and reports one structured error
instead of exposing separate `min` and `max` failures. Both boundaries may be static or reactive.
The range is temporarily disabled when either reactive source returns `undefined` or either resolved
boundary is `NaN`, keeping its validation and metadata behavior consistent. It contributes both
limits to the field's `min()` and `max()` metadata, so `[formNode]` can propagate them to compatible
native controls:

```ts
field(50, [between(0, 100)]);
field(50, [between(() => allowedRange().min, () => allowedRange().max)]);
```

Angular 22.1.4 Signal Forms has separate `min` and `max` schema rules but no combined `between`
rule. This helper deliberately preserves their inclusive comparisons and optional-value behavior
while providing a single consumer-facing error.

`equalTo` compares with `Object.is()` and accepts either a static expected value or a reactive
function. Unlike optional format validators, it does not skip `null` or `undefined`: both are real
values that can match or differ. Signals read by the expected-value function are dependencies of
the validator, enabling confirmation fields to follow their sibling:

```ts
const credentialsForm = form({
  password: field(''),
  confirmPassword: field('', [equalTo(() => credentialsForm.password())]),
});
```

The `equalTo` error and its configurable-message callback intentionally omit both compared values.
This prevents aggregate errors, logs, translation functions, or UI components from accidentally
receiving sensitive confirmation data such as passwords. Angular 22.1.4 Signal Forms has no
built-in equality rule; it supports this behavior through a custom validator. This library adds the
helper because cross-field confirmation is common and otherwise awkward to express repeatedly.

`uniqueItems` validates an array node and keeps its error on that array rather than mutating errors
on its item nodes. `null` and `undefined` are treated as empty arrays so the validator remains safe
when composed with nullable fields, even though `array()` itself normalizes those inputs to `[]`.
Without a key selector it compares items using SameValueZero equality, matching
`Set`: `NaN` values match, `0` and `-0` match, and objects use reference identity. A property-name
shorthand or function can select a comparable key:

```ts
array(field(''), ['admin', 'admin'], [uniqueItems]);
array(field(''), initialRoles, [uniqueItems({ message: 'Roles must be unique' })]);

array(
  { email: field(''), name: field('') },
  initialContacts,
  [uniqueItems('email')],
);

array(productTemplate, initialProducts, [
  uniqueItems<Product>(product => `${tenantId()}:${product.sku}`),
]);
```

Selector functions participate in reactive dependency tracking. The error reports every index
participating in a duplicate group, in ascending order, but deliberately omits the duplicated keys
and values. This provides enough information for array UIs to identify affected rows without
placing potentially sensitive data in aggregate errors. Structural changes and item value changes
recompute the indexes. Angular 22.1.4 Signal Forms has no equivalent built-in validator; aggregate
validator errors likewise belong to the validated aggregate node.

`integer` uses `Number.isSafeInteger()`. It rejects decimals, `NaN`, positive and negative
infinity, and integers outside `Number.MIN_SAFE_INTEGER` through `Number.MAX_SAFE_INTEGER`, where
JavaScript can no longer guarantee exact representation. `null` passes for composition with
`required`. Angular 22.1.4 Signal Forms has no built-in integer validator; this safe-range behavior
matches Zod's `int()` rather than the broader `Number.isInteger()` predicate.

`url` uses the platform WHATWG `URL` constructor without a base URL. It therefore accepts valid
absolute URLs with any scheme, such as `https://example.com`, `mailto:user@example.com`, and
`custom:value`, while rejecting relative references such as `/account`. This deliberately follows
the broad URL semantics also used by Zod rather than silently restricting the validator to HTTP.
Angular 22.1.4 Signal Forms has no built-in URL validator. A future HTTP-only validator should use
a distinct name such as `httpUrl()`.

Every built-in validator returns an English default message with its error. The common optional
`message` accepts either a static string or a function returning `string | undefined`. A message
function is evaluated only while its validator is failing; signals read by it are tracked and
changes update the exposed error reactively. Returning `undefined` continues through the configured
fallback chain. This works inside and outside Angular dependency injection.

`required`, `email`, `url`, `integer`, and `uniqueItems` support direct use in a validators array and
an options factory; validators that require a constraint accept message configuration as their final
argument. A static string is the concise message form. The inline object is retained for reactive
message functions and date parsing options. `uniqueItems` cannot use a one-argument string message
because strings select an object property; use `uniqueItems({ message: ... })` without a key selector or
`uniqueItems('property', 'message')` with one. Field contexts carry a non-enumerable internal symbol
marker, allowing overloaded validators to recognize genuine contexts without relying on their
structural shape or exposing the marker in the public `FieldContext` type.

Built-in validator signatures expose the static-string shorthand and inline their small options object so IntelliSense shows
the mutually exclusive `message` and `error` choices directly at the call site instead of hiding
them behind `ValidatorOptions`. Date validators additionally show `parseAs?: 'utc' | 'local'` inline.
These consumer-created option properties are intentionally mutable in the type declaration;
marking them `readonly` would add IntelliSense noise without protecting library-owned state. The
exported `ValidatorOptions` type remains available for reusable options values.

Default messages are centralized within the validation package rather than duplicated across
validators. Angular 22.1.3 Signal Forms also supports static or reactive custom messages, passing
its field context to message functions, but leaves an omitted message undefined. This library's
zero-argument message functions read signals directly and fall back to a built-in message when
omitted or when every configured layer returns `undefined`.

#### Validator message configuration

See [Validator messages and internationalization](./validator-messages.md) for the complete
consumer-oriented guide, including setup recommendations, SSR considerations, callback parameters,
and examples for every configuration scope.

Built-in messages resolve from lowest to highest priority as follows:

1. The English message included with the library.
2. The process-wide catalog installed by `configureGlobalValidatorMessages()`.
3. The closest Angular catalog captured from `provideValidatorMessages()`.
4. The closest fallback catalog from the node's `createFormPrimitives()` factory set.
5. The closest ancestor form or array `validatorMessages` option.
6. The validator's own `message` option.

Each catalog is partial. An absent entry, or a message function that returns `undefined`, continues
to the next lower-priority layer.

Use global configuration for non-Angular applications or a deliberate process-wide default:

```ts
const restoreMessages = configureGlobalValidatorMessages(() => ({
  required: () => language() === 'es'
    ? 'Este campo es obligatorio.'
    : 'This field is required.',
  min: ({ min }) => `The minimum value is ${min}.`,
}));

// Useful in tests or temporary scopes.
restoreMessages();
```

The returned function restores the catalog that preceded that call, provided it is still the
current global configuration. Because this state belongs to the JavaScript module, concurrent SSR
requests must not mutate it per request; use a provider or form scope instead.

Configure an Angular application or route once with a factory that may use `inject()`:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideValidatorMessages(() => {
      const translations = inject(TranslationService);

      return {
        required: () => translations.translate('validation.required'),
        min: ({ min }) => translations.translate('validation.min', { min }),
      };
    }),
  ],
};
```

The provider is captured when a node is created in that injection context. Its selected message
function runs during validation, so signals read by the translation service remain reactive.

Forms and arrays can override a catalog for themselves and their descendants without DI:

```ts
const profile = form({
  name: field('', [required]),
  age: field(16, [min(18)]),
}, {
  validatorMessages: () => ({
    required: () => translations().required,
    min: ({ min }) => translations().minimum(min),
  }),
});
```

Nested forms and arrays inherit the closest catalog. A validator-specific `message` remains the
highest-priority override for wording tied to one business rule.

Constraint errors also expose `actual`: the rejected number for `min` and `max`, the observed length or size for length validators, the rejected string for `pattern`, and the rejected `Date` for date validators. `oneOf()` and the word-count validators follow the same convention. `required`, `email`, and `url` omit `actual` because reflecting the entire submitted value adds little diagnostic value and can expose user input unnecessarily. Angular 22.1.4's built-in constraint errors expose the configured constraint but not the actual value, so this is a deliberate diagnostic extension.

`getError()` resolves built-in literal kinds to their complete structured types. Editors therefore expose `min`, `actual`, `message`, and `targetNode` without a cast:

```ts
const age = field(16, [min(18)]);
const error = age.getError('min');

error?.min;        // number | undefined
error?.actual;     // number | undefined
error?.targetNode; // typeof age | undefined
```

Unknown kinds retain the generic `{ kind, message?, targetNode }` contract and allow additional properties as `unknown`. Application code can therefore read arbitrary custom payload properties and narrow them locally without registering the error first. Reusable custom validation packages can add equally precise kinds by augmenting `ValidationErrorMap`:

```ts
declare module '@gem/ng-forms' {
  interface ValidationErrorMap {
    readonly unavailableUsername: ValidationError & {
      readonly kind: 'unavailableUsername';
      readonly suggestion: string;
    };
  }
}

username.getError('unavailableUsername')?.suggestion; // string | undefined
```

`BuiltInValidationError` remains the union of errors shipped by the library and does not absorb application augmentations. `ValidationErrorMap` is the deliberately extensible lookup registry.
`CustomValidationError` represents the permissive fallback shape.

Optional-value validators deliberately accept empty values so they can be composed with `required`. For example, `url` validates format only when a value exists; `[required, url]` validates both presence and format.

`oneOf()` validates membership with `Array.prototype.includes`, so `NaN` matches `NaN` and objects match by reference rather than by structure. Its error includes the resolved allowed `options` and the rejected `actual` value. The allowed values can be static or returned by a reactive function; returning `undefined` temporarily disables the constraint:

```ts
const availableStatuses = signal<readonly Status[] | undefined>(['draft', 'published']);

const status = field<Status>('draft', [
  oneOf(availableStatuses, {
    message: 'Choose an available status',
  }),
]);
```

Unlike Angular 22.1.4 Signal Forms, which has no equivalent built-in rule, `oneOf()` is provided as a library-specific validator.

`minWords()` and `maxWords()` count Unicode letter-or-number sequences. Apostrophes and hyphens inside a sequence remain part of the same word, so `L'été` and `well-known` each count as one word; punctuation without letters or numbers does not count. The error's `actual` property contains the observed word count. Limits can be static or reactive and support the common custom-message option:

```ts
const maximumBiographyWords = signal(100);

const biography = field('', [
  minWords(10),
  maxWords(maximumBiographyWords, {
    message: 'Keep the biography concise',
  }),
]);
```

These validators deliberately use a small internal Unicode tokenizer instead of Lodash or locale-dependent `Intl.Segmenter` behavior. Angular 22.1.4 Signal Forms has no equivalent built-in word-count validators.

The required emptiness rules follow Angular 22 Signal Forms. Empty arrays, empty sets, and empty objects are not considered empty by `required`. Length validators inspect `length` or `size`, so `minLength(1)` can reject an empty array or set.

Numeric, length, date, and pattern constraints can be static values or zero-argument functions:

```ts
const minimumAge = signal(18);

const age = field<number>(null, {
  validators: [min(minimumAge)],
});
```

Constraint functions execute during computed validation, so Angular signals read by them are tracked. Returning `undefined` temporarily disables that constraint. `pattern()` accepts a `RegExp` or a function returning a `RegExp | undefined`.

Fields always expose the reactive constraint signals `min()`, `max()`, `minLength()`, `maxLength()`, and `pattern()`. This state describes configured validation rather than only current errors, so it remains available while the current value is valid. A scalar constraint signal returns `null` when no active validator contributes that constraint, while `pattern()` returns an empty array. Multiple minimum constraints resolve to the strictest, largest minimum; multiple maximum constraints resolve to the strictest, smallest maximum. `pattern()` contains every active regular expression. Conditionally composed validators contribute their constraints only while that branch is active.

The `null` absence value intentionally differs from Angular 22.1.4 Signal Forms, whose corresponding limit signals use `undefined`. The `[formNode]` interoperability adapter translates `null` back to `undefined` when writing standard Angular custom-control constraint inputs.

### Native constraint applicability and Angular differences

`[formNode]` currently follows Angular Signal Forms 22.1.4 when deciding which native elements receive validator constraints. `min` and `max` are written only to `input[type=number]`, `input[type=range]`, `input[type=date]`, and `input[type=month]`. `minLength` and `maxLength` are written to every `<input>` and `<textarea>`, but never to `<select>`. Checking the element's actual supported category prevents properties present on the generic `HTMLInputElement` interface from being written to input types for which Angular considers them inapplicable.

This matches Angular 22.1.4 exactly, including its omission of `time`, `week`, and `datetime-local` from native `min`/`max` propagation. The HTML standard gives those input types minimum and maximum semantics, so supporting them may be a useful future deliberate extension. Until that decision is made and covered across value representations and browsers, this library retains Angular parity. The other tracked difference remains the absence sentinel: this library's constraint signals use `null`, while Angular uses `undefined`.

The reference implementation was inspected at Angular tag `22.1.4`, commit `898380974d49cf7976e9d89cc74a0801a26ce7b1`, specifically `packages/forms/src/directives/native.ts`, `packages/forms/signals/src/directive/native.ts`, `packages/forms/signals/src/directive/form_field.ts`, and the native constraint tests in `packages/forms/signals/test/web/form_field.spec.ts`.

The email expression matches Angular's Signal Forms implementation, including its local-part, domain-label, and total-length restrictions.

## Touched state

Fields start untouched:

```ts
touched() === false
untouched() === true
```

- `markAsTouched()` marks an interactive field touched. Fields accept `skipDescendants` for API consistency, although it has no additional effect on a leaf node.
- `markAsUntouched()` clears its touched state.
- Value changes through `set()` or `patch()` do not mark a field touched.
- Touched state is independent from validity and dirty state.

A form keeps its own touched state and also aggregates touched state from descendants:

- Any touched interactive descendant makes all its ancestor forms touched.
- `form.api.markAsTouched()` marks the form and walks the subtree, marking every interactive descendant touched.
- `form.api.markAsTouched({ skipDescendants: true })` marks only the form, including when it is empty.
- `form.api.markAsUntouched()` clears only the form's own touched state; touched descendants can keep its aggregate state touched.
- Calling either action on a nested form affects only that subtree.
- Reset is the recursive clearing operation and clears touched throughout the reset subtree.

## Dirty state

Fields start pristine:

```ts
dirty() === false
pristine() === true
```

- `set()` and `patch()` are programmatic updates and preserve the current dirty state.
- `setControlValue()` represents an update from a bound UI control and marks the field dirty immediately, including when the control reports the existing value.
- `markAsDirty()` records dirty state without changing the value.
- `markAsPristine()` clears dirty state without changing the value.
- Validator changes do not mark a field dirty.
- Dirty state is independent from touched and validity.

A form keeps its own dirty state and also aggregates dirty state from descendants:

- Any dirty interactive descendant makes all its ancestor forms dirty.
- `form.api.markAsDirty()` marks only the form itself, including when it is empty.
- `form.api.markAsPristine()` clears only the form's own dirty state without changing values; dirty descendants can keep its aggregate state dirty.
- Calling either action on a nested form affects only that node, while its aggregate result still propagates to ancestors.
- Reset is the recursive clearing operation and clears dirty throughout the reset subtree.

## Configurable node states

Fields and forms support disabled, readonly, and hidden state.

| State | Positive signal | Inverse signal | Set action | Clear action |
| --- | --- | --- | --- | --- |
| Disabled | `disabled()` | `enabled()` | `disable()` | `enable()` |
| Readonly | `readonly()` | `writable()` | `markAsReadonly()` | `markAsWritable()` |
| Hidden | `hidden()` | `visible()` | `hide()` | `show()` |

Field actions are available directly and under `field.api`. Form actions are available under `form.api`.

### State option sources

Readonly and hidden options have this type:

```ts
boolean | (() => boolean)
```

Disabled options additionally accept a user-facing reason:

```ts
boolean | string | (() => boolean | string)
```

The function can be an Angular `Signal<boolean>`, an Angular computed signal, or a normal function. Normal functions are read from the node's computed state, so Angular signals they read are tracked automatically:

```ts
const age = signal(17);

const guardian = field('', undefined, {
  hidden: () => age() >= 18,
});
```

No extra `computed()` wrapper is required.

A state function can refer to its containing form after construction:

```ts
const formGroup = form({
  age: field(17),
  guardian: field('', undefined, {
    hidden: (): boolean => formGroup.age() >= 18,
  }),
});
```

Under TypeScript strict mode, the explicit `: boolean` return type is needed in this self-referential initializer to break circular inference. Functions that only read previously declared signals do not need the annotation.

### Mutable and configured state

State has three independent sources:

1. Mutable own state controlled by actions.
2. A configured signal or function.
3. Inherited parent state.

The effective state is the logical OR of all three sources.

A boolean option initializes mutable own state and can later be cleared by the matching action. For example, a node created with `{ disabled: true }` can be enabled with `enable()`.

A signal or function remains a continuing configured condition. An action cannot override it while it evaluates to `true`. For example, `enable()` clears mutable disabled state but the node remains disabled while its configured disabled function is true.

### State inheritance

- Effective disabled, readonly, and hidden state propagates from a parent to every descendant.
- State never aggregates upward. A parent does not enter a state when all its children enter that state.
- A child can have its own state independently from its parent.
- A child's own state and configured condition are preserved while its parent imposes the same state.
- Clearing the parent's state reveals the child's still-active own state.
- Applying state to a nested form affects only its subtree, not siblings or ancestors.
- Shorthand nested forms inherit state exactly like explicit forms.

### Disabled reasons

Every field, form, and array exposes `disabledReasons()`. Each active reason identifies the node
on which that reason originated and can include a user-facing message:

```ts
type DisabledReason = {
  readonly sourceNode: Node;
  readonly message?: string;
};
```

```ts
const locked = signal(true);
const profile = form({
  name: field('David', {
    disabled: () => locked() ? 'The profile is locked' : false,
  }),
});

profile.name.disabledReasons();
// [{ sourceNode: profile.name, message: 'The profile is locked' }]

profile.disable('Editing is temporarily unavailable');
profile.name.disabledReasons();
// Parent reason first, followed by the field's own reason.
```

`disabled()` is derived from whether `disabledReasons()` is non-empty. Reasons are ordered from
the outermost ancestor to the current node. An inherited reason retains its original `sourceNode`,
allowing a descendant to identify which ancestor disabled it. Multiple local sources remain
distinct: the imperative reason established by `disable(message?)` appears before the configured
reactive reason.

A static boolean or string option initializes mutable disabled state and can be removed by
`enable()`. A reactive function is a continuing condition and remains active after `enable()` while
it returns `true` or a string. Calling `disable()` without a message creates a reason containing only
`sourceNode`; calling it again replaces the previous imperative reason. `enable()` removes only that
imperative reason and cannot clear an active reactive condition.

`FormValueControl` and CVA components that declare a standard `disabledReasons` signal input receive
the same reactive reason array through `[formNode]`. Native controls continue to consume only the
derived `disabled` property.

Angular derives `disabled()` from whether its accumulated reason list is non-empty. Its list
contains parent reasons followed by active local disabled rules. This behavior was inspected in
Angular `v22.1.4` at commit `898380974d49cf7976e9d89cc74a0801a26ce7b1`, primarily in
`packages/forms/signals/src/api/types.ts`, `packages/forms/signals/src/api/rules/disabled.ts`,
`packages/forms/signals/src/field/state.ts`, and the disabled tests in
`packages/forms/signals/test/node/field_node.spec.ts`. This library uses `sourceNode` instead of
Angular's `fieldTree` to match its node terminology and adds messages to its existing imperative
`disable()` operation.

## Non-interactive behavior

A node is non-interactive when at least one of these is true:

```ts
hidden() || disabled() || readonly()
```

While a node is non-interactive:

- Its validators are skipped, its own `errors()` is empty, and it is considered valid.
- Its public asynchronous-validation `pending()` state is false. Active work is cancelled or made stale and cannot publish a late result.
- Its invalid state does not make an ancestor invalid.
- Its public touched and dirty state is reported as false and does not affect ancestors.
- `markAsTouched()` is ignored.
- Values remain readable and programmatically writable.
- Validators and stored interaction state are retained.

When the node becomes interactive again:

- Validation resumes against the current value and validators, including a fresh asynchronous run when applicable.
- Previously recorded touched and dirty state becomes observable again.
- A value write or `markAsDirty()` performed while non-interactive can therefore appear as dirty afterward.

## Empty forms

An empty form has value `{}` and is valid, enabled, writable, visible, untouched, and pristine by default, provided it has no failing form validator.

## Dynamic arrays

`array()` creates a dynamic node whose items all have the same node shape. Its first argument is a shorthand node template or factory. With no further arguments, its initial value is an empty array:

```ts
const profile = form({
  name: field('Marco'),
  sons: array(() => ({
    name: field(''),
    age: field(23),
  })),
});
```

The equivalent shorthand template omits the factory:

```ts
const profile = form({
  name: field('Marco'),
  sons: array({
    name: field(''),
    age: field(23),
  }),
});
```

A plain object returned by a factory or used as a template is normalized to a `group()` node.
Object templates may contain the same field shorthands as `form()` and `group()` declarations.
For example, `array({ name: '', age: 0 })` is normalized and inferred like
`array({ name: field(''), age: field(0) })`: every item is a fresh group containing independent
field nodes. Static templates are validated before any item is created, while factory results are
validated on each invocation. Array-valued children normalize to fields, while nested dynamic
collections require explicit `array(...)` declarations.
Templates may also define a `field()`, an explicit `group()`, an explicit `form()`, or another
`array()`:

```ts
const tags = array(() => field(''), ['angular', 'signals']);
const shorthandTags = array(field(''), ['angular', 'signals']);
```

A field can be passed directly as the template for a primitive-value array. The field is treated as a declarative template and cloned into an independent field node for every item:

```ts
const names = array(field('Marco'), []);

names();            // []
names.push();       // appends a fresh field with the declared default value, 'Marco'
names.push('Lia');  // appends a fresh field initialized with 'Lia'
names();            // ['Marco', 'Lia']
```

The field passed as the template is not itself inserted into the array. Its validators, options, and declared initial value are compiled into the same clone recipe used by object, form, and nested-array templates.

The optional second argument can be a non-negative initial item count or an array of initial values. The framework creates each node from the template or factory and resets it to the corresponding value. Initial items therefore remain pristine and untouched:

```ts
const sons = array(
  { name: field(''), age: field(23) },
  [{ name: 'Mono', age: 11 }],
);

const twoDefaultSons = array(
  { name: field(''), age: field(23) },
  2,
);
```

The explicit factory contract deliberately prevents node reuse. Returning the same live `field()`,
`group()`, `form()`, or `array()` instance more than once throws because items must not share values,
parents, interaction state, validation state, or asynchronous watchers.

### Constructor signatures

The recommended and most common declaration is a template followed by its initial value:

```ts
const people = array(
  { name: field(''), age: field(0) },
  [{ name: 'Marco', age: 23 }],
);
```

This `array(template, initialValue)` form should be presented first in user-facing documentation. It keeps the array's structure and initial data immediately visible, matching the positional style of `field(initialValue)`. Use `array(template)` when the intended initial value is simply `[]`.

Templates and factories also support these argument combinations:

```ts
array(templateOrFactory);
array(templateOrFactory, initialValue); // recommended when initial items exist
array(templateOrFactory, initialValue, options?);
array(templateOrFactory, initialValue, validators, options?);
array(templateOrFactory, options);
array(templateOrFactory, validators, options?);
```

`initialValue` is either a non-negative item count or an array of item values. Declaring it inside options is a secondary alternative when keeping all configuration in one object is more convenient:

```ts
const people = array(
  { id: field(''), name: field('') },
  {
    initialValue: [{ id: 'marco', name: 'Marco' }],
    trackBy: person => person.id,
  },
);
```

The positional and option forms are alternatives. Once a positional initial value is present, IntelliSense omits `options.initialValue` and TypeScript rejects attempts to specify both. Validators can retain the same shorthand style as fields and forms:

```ts
const names = array(
  field(''),
  ['Marco'],
  [({ value }) => value().length < 2 ? { kind: 'minimumItems' } : null],
  { disabled: false },
);
```

At runtime, an array argument is recognized as a validator source when it contains at least one function and every other entry is a function, `null`, or `undefined`. Empty and null-only arrays therefore remain valid initial values. An array whose actual item values are themselves functions is still structurally ambiguous with a validator array. For that uncommon case, create the array empty and apply the function values through `reset()` instead of passing them in the constructor.

### Template cloning

A shorthand template is compiled once into an internal factory. Cloning recreates declarative configuration only:

- Declared initial values.
- Synchronous and asynchronous validators.
- Disabled, readonly, and hidden state sources.
- Field debounce configuration and injector ownership.
- Nested field, form, and array definition recipes.

Each clone receives fresh signals and fresh descendant nodes. Cloning never copies or shares runtime state:

- Current values written after declaration.
- Parent references or paths.
- Dirty or touched flags.
- Active errors or pending state.
- Debounce timers, abort controllers, subscriptions, or reactive watchers.

The compiled factory retains clone closures and property keys rather than the original template tree. Consequently an inline template can be garbage-collected after `array()` compiles it. If application code keeps a reference to the original template, that template remains an independent live node and later changes to it do not affect current or future array items.

The template is already a live node before `array()` receives it. Compiling it neither mutates nor destroys it, so a separately retained template keeps its own reactive lifecycle. For templates whose construction itself must not start independent asynchronous work, use the explicit factory form.

Leaf field values are not deep-cloned. A clone gets a fresh signal initialized with the originally declared value reference. As elsewhere in this signal-based API, application values should be updated immutably when their internal object identity matters.

### Reading items

- Calling the array node or `value()` returns the aggregated value array with its concrete item-value type.
- `items()` returns the current readonly node array.
- `at(index)` returns one typed item or `undefined`.
- Numeric property access such as `sons[0]` returns the same typed node as `sons.at(0)` while the array node remains callable.
- Numeric properties are readonly. Structure must be changed through `push()`, `insert()`, `removeAt()`, `moveUp()`, `moveDown()`, `move()`, `swap()`, `clear()`, `set()`, or `reset()`.
- `forEach()` iterates item nodes and receives `(item, index, arrayNode)` like the native array method.
- Array nodes are iterable, so `for...of`, spread, and `Array.from()` also produce item nodes rather than item values.
- Angular templates can iterate an array node directly with `@for (item of items; track item)`. Tracking the node preserves the rendered DOM and its `[formNode]` binding across structural `move()` operations; `push()` and `removeAt()` add and remove the corresponding views.
- `map()` transforms nodes into a normal result array, while `filter()` returns a normal array containing the matching nodes and supports TypeScript type predicates.
- `find()` returns the first matching node and supports TypeScript type predicates.
- `findIndex()` returns the index of the first matching node or `-1`.
- `some()` and `every()` test nodes with native short-circuit behavior.
- `includes()` and `indexOf()` compare node identity and accept the native optional `fromIndex` argument.
- `forEach()`, `map()`, `filter()`, `find()`, `findIndex()`, `some()`, `every()`, `includes()`, `indexOf()`, and each iterator use the item snapshot captured when the operation begins; structural mutations during an active operation do not alter that traversal.
- `length()` returns the current item count.
- Every successful structural change publishes fresh `items()` and value-array snapshots. In
  particular, `push()` invalidates reactive consumers of the array value and every ancestor value
  while leaving previously read snapshots unchanged.
- Item paths use decimal index segments such as `['sons', '0', 'name']`.
- Items resolve `form()` to their nearest explicit form and `root()` to the array's complete
  structural root. An explicit form item owns its own workflow.

The array-style read methods are convenience shortcuts, not separate collection state. Their purpose is to make common node queries less verbose. Except for the callback's third argument, these calls are behaviorally equivalent to reading `items()` and invoking the corresponding native array method:

```ts
sons.forEach(callback);        // convenience form
sons.items().forEach(callback);

sons.map(callback);            // convenience form
sons.items().map(callback);

sons.filter(predicate);        // convenience form
sons.items().filter(predicate);

sons.find(predicate);          // convenience form
sons.items().find(predicate);

sons.findIndex(predicate);     // convenience form
sons.items().findIndex(predicate);

sons.some(predicate);          // convenience form
sons.items().some(predicate);

sons.every(predicate);         // convenience form
sons.items().every(predicate);

sons.includes(node);           // convenience form
sons.items().includes(node);

sons.indexOf(node);            // convenience form
sons.items().indexOf(node);
```

The shortcut callbacks receive `(item, index, arrayNode)`, whereas callbacks invoked directly on `items()` receive the readonly item-array snapshot as their third argument. All shortcuts read `items()` internally, so they participate in reactive tracking exactly as a direct `items()` read does. Consumers may always use `items()` when they prefer the native readonly-array API or need a method that is not exposed as a shortcut.

### Structural operations

```ts
sons.push();
sons.push({ name: 'Lia', age: 7 });
sons.insert(1, { name: 'Noa', age: 4 });
sons.removeAt(0);
sons.move(1, 0);
sons.clear();
```

- `push()` and `insert()` without a value preserve the defaults created by the factory.
- Passing a value initializes the fresh item through reset, so the item itself starts pristine and untouched.
- Structural mutations are programmatic updates and preserve the array's current dirty state. A future control binding must call `markAsDirty()` when the same operation originates from user interaction.
- `move()`, `moveUp()`, `moveDown()`, and `swap()` preserve the exact node instances and all of their state; they only change item order and paths. `move()` removes one item and inserts it at the destination while shifting the intervening items. `swap()` directly exchanges two positions. `moveUp(0)`, `moveDown(lastIndex)`, moving to the current index, and swapping an index with itself are no-ops, while an index that does not identify an item throws `RangeError`.
- `removeAt()` and `clear()` detach removed nodes from the tree. A removed node retained by application code remains usable independently: its parent and path are cleared, inherited state is removed, and subsequent value, validation, dirty, or touched changes do not affect the former array.
- Invalid insertion and movement indexes throw `RangeError`. `removeAt()` returns `undefined` for a missing index.

`set(values)` preserves existing node identities by index for the common prefix, creates or removes trailing nodes to match the requested length, and preserves existing interaction state. `reset(values)` performs the same length reconciliation but leaves the array and every item pristine and untouched. `reset()` without a value keeps the current structure and values while resetting interaction state.

An `array()` node always exposes an array value even when an input source represents absence with `null` or `undefined`. Nullish values passed through `initialValue`, `set()`, the result of `update()`, or `reset(value)` normalize to `[]`; reconciliation then removes and detaches every current item. `reset(null)` and `reset(undefined)` additionally clear interaction state like any other reset with a value. This normalization also applies when `form.set()` supplies a nullish value for a nested array. Individual item values may independently be nullable when their templates allow it.

By default, reconciliation is positional. Applications that replace or reorder object values immutably can provide `trackBy` in the array options to preserve each node with its logical entity:

```ts
const people = array(
  {
    id: field.strict(''),
    name: field(''),
  },
  [
    { id: 'alex', name: 'Alex' },
    { id: 'kirill', name: 'Kirill' },
  ],
  {
    trackBy: person => person.id,
  },
);

const alexNode = people[0];
const kirillNode = people[1];

people.set([
  { id: 'kirill', name: 'Kirill updated' },
  { id: 'alex', name: 'Alex updated' },
]);

people[0] === kirillNode; // true
people[1] === alexNode;   // true
```

For object items, the same property lookup can be written with a string shorthand. The property name is restricted by TypeScript to actual properties of the item value:

```ts
const people = array(personTemplate, initialPeople, {
  trackBy: 'id',
});
```

Callbacks remain available for computed keys, composite identities, index-dependent strategies, and primitive item values:

```ts
const people = array(personTemplate, initialPeople, {
  trackBy: person => `${person.organizationId}:${person.id}`,
});
```

`trackBy` is evaluated for the current item values and the incoming values before reconciliation mutates any node. Matching keys reuse and move the existing node, preserving interaction state, pending validation ownership, and node identity while updating its value and path. Missing keys create fresh nodes, and current keys absent from the incoming values detach their nodes. Duplicate keys are rejected before the array changes because they cannot identify items unambiguously.

This is intentionally explicit rather than storing a hidden identity symbol on value objects. It also works with entirely new objects received from a server, provided their domain keys remain stable. Primitive arrays and arrays without a stable domain identifier should normally keep the default index reconciliation. `move()` remains the direct structural operation when the caller already knows the source and destination indexes.

Both immutable value updates and structural shortcuts are supported:

```ts
const names = array({ name: field('') }, [{ name: 'Marco' }]);

// Immutable value style: creates a new value array and reconciles the node collection.
names.set([...names(), { name: 'Mark' }]);

// Equivalent updater style, without repeating the array node read.
names.update(values => [...values, { name: 'Mark' }]);

// Alternatively, as a structural shortcut that creates and appends only the new node:
names.push({ name: 'Mark' });
```

All three forms propagate the resulting value through ancestor forms, preserve the identity of existing nodes, and leave dirty state unchanged. `update()` delegates its result to the same reconciliation used by `set()`, including `trackBy`. Prefer `set()` when assigning an already available complete value, `update()` when deriving one immutably from the current value, and `push()` when expressing an append operation. If any update represents user interaction rather than application code, the control integration is responsible for calling `markAsDirty()`.

An array keeps its own dirty state and also aggregates dirty item nodes. `markAsDirty()` and `markAsPristine()` affect only the array itself; they do not change item state. Therefore, a dirty item can keep the array dirty after `array.markAsPristine()`. `reset()` is the recursive operation that clears dirty state from the array and every current item.

### Array touched state

An array keeps its own touched state in addition to aggregating touched item nodes. Consequently, even an empty array can be marked as touched:

```ts
const names = array(field(''));

names.markAsTouched();
names.touched(); // true
```

`markAsTouched()` marks the array and all current descendants by default. Pass `skipDescendants` when only the array node should be marked:

```ts
names.markAsTouched({ skipDescendants: true });
```

`markAsUntouched()` clears only the array's own touched state. A touched descendant can therefore keep the aggregate array state touched. `reset()` remains the recursive operation: it clears the array's own interaction state and resets every current descendant. Calls to `markAsTouched()` while the array is disabled, readonly, or hidden are ignored. Existing stored touched state is temporarily excluded while the array is non-interactive and becomes observable again when interaction is restored.

When an array is nested in a form, `form.set()` delegates the corresponding value array to this same reconciliation behavior:

```ts
profile.set({
  name: 'Marco',
  sons: [
    { name: 'son1', age: 11 },
    { name: 'son2', age: 15 },
  ],
});
```

The complete value propagates immediately to the array and every ancestor. Existing nodes in the common index prefix are updated and retain their identity and runtime state. Additional values create fresh nodes from the configured template or factory, with correct parent, nearest form, structural root, and index-derived paths. Surplus nodes are removed and detached from the tree; retained external references to those removed nodes remain usable as independent roots. Descendants remain attached to that removed root, and their paths are recalculated relative to it. Their values, interaction state, pending validation, and eventual errors no longer contribute to the former array or form ancestors. Setting an empty array removes every item, and a later `form.set()` can create a new collection from the same definition recipe.

A node removed directly through `removeAt()` keeps ownership of its already-running validation as an independent root. A node removed as part of keyed `set()` or `reset(value)` reconciliation has its previous reconciliation-owned asynchronous execution invalidated; late results from that stale execution are ignored. In both cases the former array stops aggregating the removed node immediately.

### Aggregated state and validation

An array behaves like an aggregate form node:

- Its value, validity, pending, touched, and dirty signals react to its current items.
- Synchronous and asynchronous validators configured in the third-argument options validate the complete array value.
- Disabled, readonly, and hidden state propagates to current and future items.
- Non-interactive behavior follows the same rules as forms and fields.
- Touch, pristine, reset, and state operations apply to its descendants.
- Nested item errors affect the array and its ancestor validity, but `errors()` contains only errors targeted at the array itself.

This API differs intentionally from Angular 22 Signal Forms. Angular derives array field trees from array-valued models and maintains tracked item identities. This library constructs its tree from node definitions, using either an explicit factory or a compiled template recipe to create independent dynamic nodes. Both approaches preserve node identity and interaction state when existing items are reordered.

## Form submission

`form()` accepts an optional `submission` configuration and exposes `submit()` plus the reactive
`submitting()` state:

```ts
const profile = form({
  name: field('', [required]),
}, {
  submission: {
    action: async (_form, value) => saveProfile(value),
    onInvalid: () => showValidationMessage(),
  },
});

const submitted = await profile.submit();
```

Submission marks the form and its descendants touched before checking validation. Invalid forms do
not run the action and resolve to `false`; `onInvalid`, when configured, runs instead. Pending
validation does not block submission by default, matching Angular Signal Forms. Set
`ignoreValidators: 'none'` to require `valid()`, or `'all'` to run the action despite invalid or
pending validation. Only one action may run at a time. Concurrent calls resolve to `false`, while
`submitting()` is `true` on the submitted form and inherited by every descendant. The state is
cleared in a `finally` block if the action succeeds or rejects.

Calling `submit()` on a form without a configured action is non-destructive: it marks and flushes
the subtree and resolves to `false`. It does not throw. This keeps an explicit `form()` usable where
a structural `group()` would also have been sufficient.

`FormNode` also binds this behavior when its `[formNode]` host is a native form:

```html
<form [formNode]="profile">
  <input [formNode]="profile.name">
  <button type="submit">Save</button>
  <button type="reset">Reset</button>
</form>
```

The same directive imported for controls applies `novalidate` and always prevents native submit
navigation. A bound `form()` calls its `submit()` operation. A bound `group()` is deliberately
tolerated: submit marks the complete group subtree touched and flushes pending control values but
runs no application action. Native reset is prevented and delegated to either object node so its
complete reactive tree and bindings reset consistently. A field or array remains invalid as the
root binding of a native `<form>`. `reset()` retains the library's existing semantics: without an
explicit value it clears interaction state and pending control state while retaining current values.

This behavior follows Angular Signal Forms 22.1.4 submission state and `FormRoot` behavior
(`898380974d49cf7976e9d89cc74a0801a26ce7b1`). It was rechecked against the installed Angular
22.1.3 `FormField` and `FormRoot` declarations and implementation in
`@angular/forms/types/signals.d.ts` and `@angular/forms/fesm2022/signals.mjs`. The public API differs
intentionally: Angular exposes two standalone directives, while this library requires only
`FormNode`; its submission action also receives the exact form node and a typed value snapshot and
currently does not interpret returned server-validation errors.
The tolerant `group()` native-form binding is a deliberate library extension: Angular's `FormRoot`
does not expose an equivalent public distinction between this library's structural group and
submission-owning form.

## Control binding with `[formNode]`

### Angular Signal Forms `FieldTree` adapter

Every node exposes a lazy `$field` property whose runtime value is the corresponding official
Angular Signal Forms `FieldTree`. A single Angular tree is created for the complete root and all
descendant adapters navigate that same tree internally.

This enables Angular's own directive without replacing the library model:

```html
<input [formField]="myForm.name.$field">
```

Committed values synchronize bidirectionally. Disabled, readonly, hidden, required, validation,
touched, and dirty state are mirrored so Angular controls observe the library node as their source
of form state, while control-originated value and interaction changes update the library node.
Control-originated values are routed through the bound node's internal control-value channel rather
than assigned to the complete root. Consequently `controlValue()` reflects the immediate rendered
value, numeric and blur debounce delay only the committed node value, `flush()` commits pending
input, and a programmatic `set()` cancels pending control input without being treated as a dirty
control edit.
If a bound Angular control and the library node both change before adapter synchronization runs, a
real control edit takes deterministic precedence, regardless of which of the two synchronous
operations happened first. When no control-state edit occurred, the node remains authoritative.
This explicit user-input priority prevents a queued control edit from being overwritten merely by
effect scheduling; synchronization converges in one control-channel write without feedback loops.
`$field` is reserved as collision-safe interop syntax and remains a supported, stable adapter. Its
public type is deliberately erased to `any`. Angular's AOT strict-template checker calls the bound
field and inspects its writable `value`, so narrower opaque types reject valid `[formField]`
templates. The erased type avoids publishing a typed Angular `Field` or `FieldTree` contract and
therefore provides no discoverable adapter API in IntelliSense. Consumers select the Gem Forms node
first and use `$field` only as the terminal template-binding adapter.

At leaf bindings, control interaction flows back into Gem Forms: input-driven dirty state and
blur-driven touched state update the library node, while node calls can independently set or clear
either flag without resetting the other. Availability is
intentionally directional: disabled, readonly, hidden, and required are derived schema state in
Angular, so the library node is their source and `[formField]` reflects them into Angular and the
control. Angular does not expose reverse setters for those states.

Parsing failures produced by Angular native controls, `transformedValue()` custom controls, and
CVA validation are registered as binding-owned external errors on the corresponding Gem node. A
failed parse leaves the last committed Gem value unchanged but makes the node and its ancestors
invalid; the error appears in `errors()`, `allErrors()`, `getError()`, and submission validation.
Each binding owns its errors independently, so multiple controls can contribute separate parse
errors without replacing Gem validator errors. A binding contribution is removed when parsing
recovers, the node resets, or the binding is destroyed or rebound. The exposed Gem error retains
Angular's error data except its internal `fieldTree` and `formField` references, and identifies the
originating control through `formNode`.

Gem validator constraints are also published into the Angular field metadata consumed by
`[formField]`: numeric and date `min`/`max`, `minLength`, `maxLength`, and active patterns. These
sources remain reactive, including activation and removal. The adapter contributes metadata only;
it does not install Angular validators, so Gem remains the validator owner and each failed
constraint produces one error rather than a duplicate from each engine.

Angular then applies the metadata according to its normal control contract. Custom controls with
matching inputs receive the values directly. Native controls receive `min`, `max`, `minLength`, and
`maxLength` only where Angular 22.1.4 considers those properties applicable, including its date
serialization. Angular 22.1.4 exposes pattern metadata to custom controls but does not write it to
the native `pattern` property; the adapter deliberately retains that Angular behavior. Every
pattern materialized when the adapter is created receives its own Angular metadata contribution,
and one slot is reserved when the initial list is empty so a normal reactive pattern can activate
later. Activating more simultaneous patterns than the initial slot count is recorded as a later
compatibility enhancement because Angular schemas have a fixed rule structure after creation.

Interaction synchronization applies to the complete current tree, not only bound leaves. A
touched or dirty descendant makes its Angular and library ancestors touched or dirty through their
normal aggregation rules. Marking an aggregate as touched propagates to descendants unless
`skipDescendants` is requested; marking an aggregate dirty affects only that aggregate. Reset
clears both flags throughout the subtree. Disabled, readonly, and hidden nodes temporarily report
untouched and pristine on both sides while retaining their underlying flags, which become visible
again when the node returns to an interactive state.

Dynamic array changes reconcile the adapter after creation. `push()`, `insert()`, `removeAt()`,
`clear()`, `set()`, `reset()`, `move()`, `moveUp()`, `moveDown()`, `swap()`, and `trackBy`
reconciliation add, remove, or remap requested Angular paths without replacing the root `$field`.
The adapter does not eagerly mirror every array descendant: a node is connected when application
code or a template reads its `$field`. Retained connected Gem items preserve their identity and
interaction state while their `$field` path follows the new index. Synchronization for a removed
connected node is destroyed before Angular removes the corresponding field, avoiding reads from an
Angular orphan field. A newly rendered descendant receives value, interaction, availability,
validation, constraint, binding, and parse-error synchronization when its `$field` is evaluated.
Angular tracks object array entries by identity and primitive or nested-array entries by index, as
in Angular 22.1.4. The adapter still remaps each current Angular path to the authoritative Gem item
connected node after either kind of update.

Every live Angular `FormFieldBinding` is also registered as a control binding on its original
library node. Calling `focus()` on a field therefore works identically for `[formNode]` and
`[formField]`; aggregate focus can discover adapted descendant controls as well. When several
controls bind the same node, the first connected control in DOM order is focused rather than the
first one registered. Angular's binding-level `focus()` is invoked, preserving a custom control's
own focus implementation and `FocusOptions`. Destroyed bindings unregister automatically, and a
`FormField` rebound to another `$field` moves its focus registration without leaving a stale entry.

Reset is intentionally node-owned. A library `reset()` updates Angular's value and raw control
value, clears Angular parsing state, and invokes every native, custom-control, or CVA reset hook in
the affected subtree. It also retains Gem Forms semantics for explicit values, external errors,
interaction state, and pending debounce. The adapter does not treat Angular's internal field-state
`reset()` as a second entry point: `$field` is opaque application infrastructure, and consumers
reset through the Gem node API instead.

The public `$field` type is deliberately erased to `any`. Angular's AOT strict-template checker
calls the bound field and inspects its `value` state for native and custom-control compatibility,
so `never`, `Field<never>`, or a callable returning `never` rejects otherwise valid `[formField]`
templates. The erased type avoids presenting Angular's field-state API as a supported application
surface. This is an intentional terminal-adapter boundary rather than a type-safe bridge: consumers
must select a Gem node before `$field` and perform every programmatic operation through that node.

Angular 22.1.4 `FormRoot` handles submission but does not listen for the native `reset` event. A
native `<form>` containing `$field`-backed controls should use `[formNode]` on the form root when it
needs Gem Forms reset behavior; the root directive resets the library tree, and the adapter then
resets all Angular `FormField` controls.

This is the recommended composition even when every rendered control uses `[formField]`:
`<form [formNode]="myForm">` remains the sole form root, and descendants bind terminal adapters as
`[formField]="myForm.name.$field"`. The two engines must not install competing root directives on
the same native form. `[formNode]` applies `novalidate`, prevents native navigation, delegates
submit and reset to the Gem tree, and therefore includes adapted parse errors in submission
validity. Invalid-submit UI remains application policy; for example,
`onInvalid: invalidForm => invalidForm.allErrors()[0]?.targetNode.$api.focus()` focuses the first
reported bound error target and safely does nothing when that target has no rendered binding.

Independent interaction clearing uses the runtime `FieldNode.markAsUntouched()` and
`FieldNode.markAsPristine()` methods present in Angular 22.1.4. Angular omits those methods from its
public `FieldState` type even though its implementation exposes them, so this access remains
isolated in the adapter, regression-tested, and listed in the Angular upgrade checklist. Using the
public `reset()` as a substitute would incorrectly clear both flags and invoke binding reset hooks.

Adapter creation is lazy. Declaring and using nodes outside Angular dependency injection remains
safe as long as `$field` is not requested. In normal component field initializers, the current
injector is captured automatically. Code creating nodes outside an injection context must pass an
explicit `injector` option before using `$field`; otherwise access throws a descriptive error.

The implementation was derived from Angular Signal Forms 22.1.4 at commit
`898380974d49cf7976e9d89cc74a0801a26ce7b1`, specifically
`packages/forms/signals/src/api/structure.ts`, `api/types.ts`,
`field/structure.ts`, `directive/form_field.ts`,
`packages/forms/signals/test/node/field_node.spec.ts`,
`packages/forms/signals/test/web/form_field.spec.ts`, and
`packages/forms/signals/test/web/orphan_repro.spec.ts`. A real Angular `FieldTree` is
required because `[formField]` resolves Angular's private `FieldNode`; a structurally compatible
object is insufficient.

Angular's public `FormFieldBinding` does not expose binding-specific parsing errors. The adapter
therefore reads the runtime `FormField.parseErrors` signal, which Angular marks internal, rather
than reading the complete field error state and creating a reactive cycle with Gem validators. This
isolated dependency is covered by native and custom-control tests and recorded in the Angular
upgrade checklist. The governing Angular 22.1.4 sources are
`packages/forms/signals/src/directive/form_field.ts`,
`packages/forms/signals/src/field/validation.ts`, and
`packages/forms/signals/test/node/parse_errors.spec.ts`.

Constraint interoperability was derived from Angular 22.1.4
`packages/forms/signals/src/api/rules/metadata.ts`, the numeric, date, length, and pattern rules in
`packages/forms/signals/src/api/rules/validation/`, and the native/custom binding implementations
under `packages/forms/signals/src/directive/`.

`FormNode` binds a field node to a native form control, and binds field, group, form, or array nodes
to an explicitly provided signal custom control or a component that implements Angular's
`ControlValueAccessor` contract:

```ts
@Component({
  imports: [FormNode],
  template: `
    <input [formNode]="name">
    <select [formNode]="country">
      <option value="ch">Switzerland</option>
      <option value="es">Spain</option>
    </select>
  `,
})
class ProfileEditor {
  name = field.strict('Marco', { debounce: 200 });
  country = field.strict('ch');
}
```

The directive currently provides these behaviors:

- Two-way synchronization with native `input`, `textarea`, and `select` elements, including number, range, checkbox, radio, date-like, and multiple-select values.
- Native input updates use `setControlValue()`. They therefore mark the field dirty and honor the field's own or inherited control debounce; programmatic `set()` updates remain immediate and pristine. A dynamically bound native input `type` remains live: changing between compatible textual types such as `password` and `text` preserves model-to-view and view-to-model synchronization.
- Resetting a field or an ancestor form cancels its pending native-control debounce, restores the rendered committed value immediately, and prevents the cancelled value from reappearing when its timer would have completed.
- A blur event marks the field touched. IME composition is buffered until `compositionend`.
- `disabled`, `readonly`, `required`, `aria-invalid`, `min`, `max`, `minLength`, `maxLength`, and `pattern` are synchronized from field state to applicable DOM properties. Applicability observes an input type bound during Angular initialization. Date limits are formatted for native `date` and `month` inputs. Native range controls apply browser clamping to their displayed value as constraints change; this does not rewrite a programmatic model value until the control emits an input event. When several pattern validators are active, the generated native pattern requires all of them; the node validators remain the authoritative validation behavior.
- Native controls receive a stable generated `name` in the form `${APP_ID}.formN.path.to.field`. Bindings for the same field share the same name, which preserves radio grouping, while fields in different root trees receive different names. Because the path is reactive, names follow array items when their indexes change. An explicitly authored native `name` is replaced by the generated field name, matching Angular Signal Forms.
- Changes to native select options reapply the field value, including options rendered after the initial binding.
- A reused radio input re-evaluates its authored `value` after every Angular render, so changing the option represented by an existing DOM node immediately recalculates its checked state without requiring a model change.
- `provideFormNodeConfig({ classes })` installs reactive classes on every concrete `[formNode]` binding and every Angular `[formField]` binding backed by a Gem Forms node's `$field`. Predicates receive the public `FormNodeBinding`, including its host `element`, and track only the signals they read. Unrelated Angular `FieldTree` bindings are ignored. The provider installs Angular's Signal Forms class configuration internally; because Angular's configuration token is not multi, it must not be combined with `provideSignalFormsConfig({ classes })` in the same injector. `ANGULAR_FORMS_STATUS_CLASSES` is an optional Angular Forms compatibility preset providing `ng-valid`/`ng-invalid`, `ng-pending`, `ng-pristine`/`ng-dirty`, and `ng-untouched`/`ng-touched`; these classes are not installed unless the preset is configured.
- An application that uses Angular's `provideSignalFormsConfig({ classes })` instead receives the normal Angular behavior for `$field`-backed controls without an additional bridge: `$field` is a real `FieldTree`, so Angular invokes those predicates with its `FormFieldBinding`. This Angular provider can cover both adapted and native Angular field trees, while `provideFormNodeConfig()` shares Gem Forms `FormNodeBinding` predicates across `[formNode]` and adapted `[formField]`. Only one may configure classes in a given injector because both ultimately provide Angular's same non-multi configuration token.
- Components that provide `NG_VALUE_ACCESSOR` are connected through their `ControlValueAccessor`. If the CVA component declares standard Signal Forms state inputs, including a signal input named `name`, those inputs receive the same field state used for signal-native custom controls. The directive also provides a lightweight `NgControl` view for compatibility with controls that inspect it, including Angular Material-style controls.
- A wrapper component may consume an input whose template name is exactly `formNode` and delegate that node to an inner `[formNode]` control. The outer directive becomes pass-through: it performs no synchronization, validation, CSS-class work, hidden-field warning, or focus registration. Only the delegated inner control is a binding. This is automatic and requires no provider. An aliased property is valid as long as its public template input name is `formNode`.
- Component wrappers are detected automatically from Angular's public component metadata. A directive that consumes or re-exports `formNode`, including a host directive, must add `providers: [provideFormNodePassThrough()]` because Angular exposes no equivalent public runtime reflection API for directive inputs. The provider affects only the injector on that host element.
- Components implementing Angular's standard `FormValueControl<T>` (`value = model<T>()`) or `FormCheckboxControl` (`checked = model<boolean>()`) are discovered automatically from their compiled component metadata. Components may alternatively expose separate `value`/`valueChange` or `checked`/`checkedChange` input-output pairs, using either signal APIs or classic `@Input()`/`@Output()` declarations. They require no library-specific interface, provider, or registration. The model synchronizes in both directions and user changes follow the field's normal `setControlValue()` debounce behavior. A separate input must provide an initial value rather than use `input.required()` or `@Input({ required: true })`: Angular's template compiler has a special rule allowing `[formField]` to satisfy its custom control's required model input, but cannot extend that rule to third-party binding directives. Unlike Angular's internal control-creation hook, `[formNode]` connects during directive initialization, so the model is synchronized after the custom component's own `ngOnInit` and before its initialized view is consumed.
- A `FormValueControl<T>` may bind to an aggregate `form()` or `array()` when `T` matches the node's complete value. A control-originated aggregate value marks that aggregate node dirty and then uses its normal structural update path: forms distribute the complete object to their children, while arrays reconcile, create, move, or detach item nodes according to their configured index or `trackBy` identity. Descendants are not individually marked dirty merely because the aggregate control supplied their values. Programmatic `set()` remains pristine and updates the custom model in the opposite direction.
- Standard Signal Forms state inputs implemented by the component are synchronized when this library has an equivalent node state: `errors`, `disabled`, `disabledReasons`, `dirty`, `hidden`, `invalid`, `max`, `maxLength`, `min`, `minLength`, `name`, `pattern`, `pending`, `readonly`, `required`, and `touched`. The `name` input receives the same stable, path-aware value used by native controls. Constraint inputs receive the same strictest limits and complete pattern list exposed by the field. `disabledReasons` receives this library's `DisabledReason[]`, whose `sourceNode` is the equivalent of Angular's originating `fieldTree`. Input transforms are honored.
- A state input declared by a component custom control takes precedence over a native DOM property with the same template name. Custom-element hosts never receive synthetic `disabled`, `required`, `readonly`, `name`, or constraint properties. When a component signal control or component CVA is hosted on a native form element, native fallback remains available only for properties the component does not declare. This matches Angular Signal Forms' `customControlHasInput()` precedence and prevents duplicate or accidental host writes. Unlike Angular's internal renderer, the public reflection API cannot enumerate inputs belonging to arbitrary directives on the same native host; directive-based controls therefore need to handle native-host collisions explicitly until Angular exposes an equivalent public facility.
- The standard optional `touch` output marks the field touched; optional `focus()` and `reset()` hooks integrate with the directive and field reset lifecycle. Resetting during a pending control debounce restores the custom control model to the committed value, invokes its reset hook, and prevents the cancelled value from committing later. A library-specific `node` signal remains available through the optional `FormNodeValueControl` extension, but is not required for Angular-compatible controls.
- When an existing signal custom control is rebound to another node, its value and state inputs switch to the new node, subsequent control events update only that node, and focus and reset registration are removed from the previous node. A debounce already started on the previous node is neither transferred nor cancelled by rebinding: control-value work belongs to node state and each node completes or cancels it independently.
- Binding precedence is deliberate: a matching `ControlValueAccessor` wins first for compatibility with established Angular controls, followed by an automatically discovered signal control and then native-control handling.
- Automatic signal-control discovery is component-only. Angular's public `getDebugNode()` exposes the host component instance but not arbitrary directive or host-directive instances, so directive-based signal controls are not supported. A directive-based integration should use a component wrapper or `ControlValueAccessor` instead.
- Model-to-view `writeValue()` calls are guarded against reentrant `onChange` callbacks. A legacy CVA that invokes its registered change callback from inside `writeValue()` therefore cannot mark the field dirty, write the value back, or create a feedback loop.
- When several Angular accessors match, selection follows Angular's precedence: one custom accessor, then one specialized built-in accessor, then the default accessor. Multiple accessors within the selected category are rejected as ambiguous.
- Synchronous validators provided by a CVA through `NG_VALIDATORS` participate in the field's real validation state. Their Angular validation key becomes `error.kind`, and `registerOnValidatorChange()` invalidates the reactive result. These binding-owned errors are suppressed with the field's other errors while it is disabled, readonly, or hidden and are removed when the binding is destroyed or changes field.
- `NG_ASYNC_VALIDATORS` are not adapted by this CVA compatibility layer. Asynchronous validation belongs to the node's `asyncValidator()` pipeline, which owns cancellation, pending state, debounce, and stale-result handling explicitly.
- Exporting the directive as `#binding="formNode"` provides the typed public binding API. `node` is the single reactive reference to the current bound node. `focus()`, `flush()`, and `reset()` operate on this concrete binding or its current node. The binding also exposes its host `element`, host `injector`, and a reactive `errors` signal.
- `binding.errors()` contains every error of the current node that is not owned by a concrete control, plus only the control-specific errors whose `formNode` is that binding. When two controls bind the same field, a native parse error from one control therefore remains absent from the other binding's errors even though the field aggregates both errors. Rebinding updates `node` and `errors` together, and binding-produced errors use the directive itself as their stable `formNode` identity.
- Every field, form, and array node also exposes `focus(options?)`. A field focuses the first of its current `[formNode]` bindings in DOM order. Forms and arrays search their current descendant bindings and focus the first rendered control in DOM order, independent of schema or array order. Signal custom controls use their optional `focus()` hook; native controls and CVAs focus the host element. Calling `focus()` without a bound control is a no-op, and destroyed or rebound directives are removed from the selection immediately. If a form child is named `focus`, that child keeps direct-property precedence and the operation remains available through `form.api.focus()`.
- Destroying the directive removes DOM listeners, disconnects select observation, and destroys its reactive effects through Angular's `DestroyRef` ownership.
- The directive supports server rendering for native controls and custom `ControlValueAccessor` components. Initial value and node-state bindings are rendered on the server, while browser-only select option observation is installed only in a browser environment. Native value conversion identifies controls structurally instead of depending on browser constructor globals.
- Client hydration reuses server-rendered controls rather than recreating them. Once hydrated, native events update the field normally, interaction state remains connected, and reactive value and validation bindings continue updating the claimed DOM nodes without hydration warnings or mismatches.
- In development, `[formNode]` warns whenever its bound field is hidden while the control remains rendered. The warning identifies the reactive field path, using `<root>` for a standalone root field. `hidden` is form state and does not manipulate DOM visibility: templates should remove hidden controls with `@if`. No warning is installed in production.

### Importing `FormNode`

Import the capitalized `FormNode` symbol from the package entry point and add it to the component's `imports`. The template binding remains the lower-camel-case `[formNode]` input:

```ts
import { Component } from '@angular/core';

import { field, FormNode } from '@gem/ng-forms';

@Component({
  imports: [FormNode],
  template: `<input [formNode]="name">`,
})
class ProfileEditor {
  name = field.strict('');
}
```

`FormNode` deliberately serves two TypeScript namespaces: it is the Angular directive value used in `imports`, and it is the clean generic instance type used by queries. Applications should import neither `_FormNode` nor a deep path beneath the package entry point.

### Querying a binding with `viewChild()`

Assign the directive's `formNode` export to a template reference, then query that reference by name with the signal-based `viewChild.required()` API. Parameterize `FormNode` with the exact node type to preserve the field, form, or array returned by `node()` without exposing Angular lifecycle and input infrastructure:

```ts
import { Component, viewChild } from '@angular/core';

import { field, FormNode } from '@gem/ng-forms';

@Component({
  imports: [FormNode],
  template: `<input #nameBinding="formNode" [formNode]="name">`,
})
class ProfileEditor {
  name = field.strict('');
  readonly nameBinding = viewChild.required<FormNode<typeof this.name>>('nameBinding');

  focusName() {
    const binding = this.nameBinding();
    const node = binding.node();

    node.set('Daniel');
    binding.focus();
  }
}
```

The three related names have distinct roles:

- `FormNode` is the imported Angular directive value and its public instance type.
- `[formNode]` binds a field, form, or array node to the control.
- `#nameBinding="formNode"` exports that concrete binding to the template; `nameBinding` is the local reference queried by `viewChild.required<FormNode<...>>('nameBinding')`.

The resulting query is a signal. Calling `nameBinding()` returns the binding; calling its `node()` signal returns the currently bound node. The remaining public binding API is `errors`, `element`, `injector`, `focus()`, `flush()`, and `reset()`.

The package exposes an `_FormNode` symbol solely because Angular's AOT compiler and linker must import the decorated implementation from the package entry point. It is framework infrastructure and must not be used by applications. `FormNodeBinding` remains available as the generic structural type for configuration callbacks and code that should not be named after the Angular directive.

### Automatic CSS classes

`provideFormNodeConfig()` can configure reactive CSS classes for every `[formNode]` binding and
every `$field`-backed Angular `[formField]` binding below the provider:

```ts
bootstrapApplication(App, {
  providers: [
    provideFormNodeConfig({
      classes: {
        'is-invalid': binding => binding.node().$api.invalid(),
        'is-touched': binding => binding.node().$api.touched(),
        'is-pending': binding => binding.node().$api.pending(),
      },
    }),
  ],
});
```

Each class predicate has its own computed reactive context. A predicate reruns only when a signal it read changes, including signals unrelated to the bound node. After rendering, `[formNode]` adds the class when the predicate returns `true` and removes it when it returns `false`. The nearest injected configuration applies to the binding.

The predicate receives the same stable `FormNodeBinding` exposed by the template directive, including the host `element`, its `injector`, the reactive `node` and binding-filtered `errors` signals, and the binding-specific operations. Generic binding code uses `$api` because the bound form may legally contain a child named `api`; this is one of the cases for which the collision-safe escape hatch exists.

This behavior follows Angular Signal Forms as inspected in Angular `22.1.4`, commit `898380974d49cf7976e9d89cc74a0801a26ce7b1`, specifically `FormField.errors`, `FormField.focus()`, `FormField.reset()`, and `FormField.installClassBindingEffect()` in `packages/forms/signals/src/directive/form_field.ts`, the public `FormFieldBinding` in `packages/forms/signals/src/api/types.ts`, and the binding coverage in `packages/forms/signals/test/web/form_field.spec.ts`.

### Native parse errors

Native controls parse their raw UI state before calling `setControlValue()`. If the browser reports
`ValidityState.badInput`, or a numeric model is bound to a text input containing a non-numeric value,
the field receives an external validation error with `kind: 'parse'`. The failed raw value remains in
the DOM so the user can correct it, while both `value()` and `controlValue()` retain their last valid
values. The interaction still marks the field dirty, and the parse error immediately participates in
the field and ancestor validation state. A successful later parse clears the error and follows the
normal control debounce rules.

Parse errors belong to an individual `[formNode]` binding. Two controls bound to the same field may
therefore contribute independent parse errors. Each parse error exposes `formNode`, whose `element`,
`injector`, reactive `node`, and `focus()` identify and operate on the exact binding that produced it.
The error's `targetNode` continues to identify the validated field. A programmatic model update clears
stale parse errors and writes the new value to every binding. `reset()` also clears each binding's parse state and forces
its raw DOM value back to the current model, including when the model value itself is unchanged.
Changing the directive's bound field or destroying the binding removes its previous error ownership.

Date, datetime-local, month, time, and week inputs can change between `badInput` and an empty valid
state without dispatching an `input` event. In the browser, `[formNode]` monitors their native validity
transitions using a small CSS animation hook, matching Angular Signal Forms. The style is shared per
document or Shadow Root, honors Angular's `CSP_NONCE`, and is removed when its last binding is
destroyed. No validity observer or style is installed during server rendering.

Native `input`, `select`, and `textarea` elements still require a `field()` because they edit scalar control representations. Aggregate nodes are accepted only through custom signal controls or CVAs capable of representing their complete object or array value. Forms and arrays expose that direct control representation through readonly `controlValue()` signals and may debounce it independently, without composing pending descendant control buffers.

The architecture follows Angular 22 Signal Forms `FormField`, `FormValueControl`, and `FormCheckboxControl` behavior as inspected at tag `22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`), especially `packages/forms/signals/src/directive/form_field.ts`, `packages/forms/signals/src/directive/form_field_spec.ts`, `packages/forms/signals/src/api/types.ts`, and the binding selection in `packages/forms/signals/src/field/node.ts`. `[formNode]` reproduces the pass-through result without depending on Angular's internal control-creation hook: component wrappers are discovered through the public `getDebugNode()` and `reflectComponentType()` APIs, while directives opt in through `provideFormNodePassThrough()`. Its signal-control integration remains independent and uses the same public discovery APIs. Signal interoperability remains a directive concern and does not change field semantics.

Updating component inputs first resolves aliases, property names, signal-input flags, and decorator transforms through public `reflectComponentType()` metadata. The isolated adapter then finds an input signal's node structurally through its own symbols, without importing Angular's private `ɵSIGNAL` or `ɵInputSignalNode` exports. When the component definition supplies `ɵcmp.setInput`, the adapter delegates to it so Angular's `ngOnChanges` bookkeeping is preserved; otherwise it applies the signal write or decorator-input assignment directly. Every successful write calls public `ChangeDetectorRef.markForCheck()`. The private input-node and component-definition access lives only under `form-node/angular-internals` and remains covered by JIT, full-AOT, server-rendering, hydration, OnPush, and real-Chromium tests.

Every private lookup and write is guarded independently. If Angular changes `ɵcmp.setInput`, Gem
falls back to the smaller input-signal writer. If signal-node discovery or
`applyValueToInputSignal()` is no longer compatible, that optional state-input write is skipped
without breaking value synchronization, control events, or the bound form node. Consumer-authored
input transforms remain outside this compatibility suppression and continue to surface their own
errors normally.

The first skipped write for each control instance and input name emits one descriptive console
warning; subsequent reactive attempts do not repeat it. The warning confirms that the control
remains connected and recommends `useControlState()` as the stable way to consume bound state
without writable state inputs, unless the component already consumes that facade. It also mentions
`ControlValueAccessor` as an alternative for value and disabled interoperability, not as a
replacement for `readonly`, `required`, errors, or the rest of the optional state surface.

This adapter is intentionally a temporary compatibility boundary. Angular's relevant implementation is `packages/core/src/render3/instructions/write_to_directive_input.ts`, `packages/core/src/render3/features/ng_onchanges_feature.ts`, `packages/core/src/render3/apply_value_input_field.ts`, and `packages/core/src/render3/component_ref.ts`. Neither the structurally discovered input node, its `applyValueToInputSignal()` method, nor `ɵcmp.setInput` is covered by Angular's public compatibility guarantees.

Angular 22.1.5 exposes `ComponentRef.setInput()` publicly, but a directive on an existing component host has no public API for obtaining that `ComponentRef`. Public `getDebugNode()` safely exposes the component instance, not arbitrary directive or host-directive instances and not a supported input writer. Its component discovery is covered separately in a production-mode Chromium process using a component compiled with full AOT, so the automatic path does not rely on development-mode debug metadata. Signal-control discovery is therefore intentionally limited to components. Every Angular upgrade must re-evaluate whether public APIs can replace the input writer. Consumers that want to avoid the input-writing compatibility boundary can call `useControlState()` in the custom component and read its normalized signals instead.

### Universal control-state state

`useControlState<TValue>()` returns a read-only `ControlState<TValue>` facade from a custom-control component's injection context. Each source adapter lives in its own file and owns the complete translation from its source into the common signal model, including source-specific defaults and normalization. The main facade only selects the first connected adapter and forwards its signals; it contains no source-specific state mapping. Its explicit precedence is `[formNode]`, `[formField]`, `[formControl]`, `formControlName`, then `ngModel`. The `[formNode]` adapter rendezvous through the shared host element without injecting `_FormNode` during component construction. The `[formField]` adapter resolves Angular's public same-host `FORM_FIELD` token after rendering and forwards its `FieldState` signals. The `[formControl]`, `formControlName`, and `ngModel` adapters resolve their concrete same-host `NgControl` after rendering, avoiding CVA construction cycles, observe the public `AbstractControl.events` stream, and reconcile directive/control identity and silent state changes after each browser render. Replacing a bound `FormControl` unsubscribes the previous control. Silent `{ emitEvent: false }` mutations become visible on the next render rather than synchronously. Every adapter cleans up through `DestroyRef`.

The implemented sources are `'formNode'`, `'formField'`, `'formControl'`, `'formControlName'`, and `'ngModel'`. Every state member is a signal. Angular Signal Forms supplies the complete state surface, while `AbstractControl` sources supply value, disabled, dirty, touched, invalid, pending, normalized errors, and directive names where applicable. State unavailable from `AbstractControl`—such as readonly, hidden, disabled reasons, and constraint metadata—keeps the same neutral defaults used while disconnected. Reactive Forms `ValidationErrors` record entries become individual `{ kind, ...details }` objects; `true` becomes `{ kind }`, while primitive payloads use `{ kind, value }`. Errors never expose Angular's `fieldTree` or `formField` references. Disabled reasons are normalized to source-neutral `{ message? }` objects instead of exposing Gem `sourceNode` or Angular `fieldTree` references. Unnamed active reasons are preserved as `{}`; only `[]` means that no reason is known.

Render-discovered adapters remain safely disconnected during server rendering and connect during the first browser render, including hydration. Their neutral signals make this transition safe. `[formNode]` uses its synchronous host registry and can already be connected during server rendering.

`markAsTouched()` delegates to the active source's native operation. It marks the Gem or Angular Signal Forms field using that engine's normal descendant propagation, and marks the active `AbstractControl` for Reactive Forms or `ngModel`. Calling it while disconnected is a no-op.

The facade otherwise remains read-only. User value changes travel through the custom control's
`model()`, `FormValueControl`, or `ControlValueAccessor` integration, while programmatic mutations
remain owned by the source forms API. `ControlState` therefore does not duplicate `setValue()`,
reset, availability, or validation operations.

## Internal structural behavior

These details are not public API, but explain current propagation behavior:

- Every nested node stores a reactive reference to its parent.
- Every node exposes `keyInParent()`, a reactive structural signal corresponding to Angular Signal Forms. Object children return their property name, while array items return their current numeric index. Moving or reconciling an array updates the index without changing node identity. Root nodes return `null`; this also applies to an item after it is removed and becomes a detached root. This deliberately differs from Angular 22.1.4, which throws when the root key is read. `path()` remains a string array, including stringified array indexes, so it continues to be suitable for serialization and DOM-oriented paths. Angular 22.1.4 types array-element keys as `number` but its current internal object-key map yields numeric keys as strings; this library deliberately returns the typed numeric index instead of reproducing that implementation mismatch.
- Descendants derive inherited state by reading their parent instead of receiving manually copied state.
- A private, non-enumerable symbol marks runtime nodes so shorthand normalization does not rely only on `typeof value === 'function'`.
- The symbol marker is omitted from public types.
- Runtime-only structural methods are omitted from public API types and prefixed with `_`.
- Callable field and form facades hide irrelevant built-in function members from their public TypeScript surface.

## Current boundaries

The current implementation does not yet provide:

- Runtime addition or removal of named object children after a `form()` is created.
- Schema-driven form generation from JSON definitions.

These boundaries describe the current codebase and are not commitments to a particular future API.
