# Behavior reference

This document records the behavior currently implemented by the library. It is an evolving specification and the source material for future user-facing documentation.

The package name and public import path are `@ngblocks/form-nodes`. The package rename does not change
exported symbols, node behavior, or Angular integration contracts.

The public common node contract is `AnyNode`; concrete model types are `FieldNode<TValue>`,
`GroupNode<TChildren>`, `FormNode<TChildren>`, and `ArrayNode<TItem>`.
Without generic arguments, `FieldNode`, `GroupNode`, `FormNode`, and `ArrayNode` erase value/child detail while
retaining category operations, including nested nodes with ancestors of a different category.
Unknown form/group children do not become statically declared properties: generic consumers
use `$api` to avoid child-name collisions. `FormNode` refers only to the `form()` primitive. Explicit generic arguments preserve value,
child, and item precision; an omitted structure differs from the explicitly empty `{}` structure.
These defaults change only the public type views, not runtime behavior. Angular 22 reference
checked: `22.1.x` at `ef48630a14f0bc8ba0a46d3fc7555c2a29f26a41` (`api/types.ts` and
`test/web/assertions.spec.ts` under `packages/forms/signals`).
These type names change no runtime state, validation, propagation, or factory inference.

Generic node error typing uses `ValidationErrorWithTargetNode<AnyNode>` for `NodeApi.errors`,
`allErrors`, and `getError`. Consumers retain the optional `message` (`string | undefined`)
and binding-specific `formNode`, including through `AnyNode.$api` and `DynamicNode`.
Messages remain optional; this type correction does not create or resolve additional messages.
Angular 22 reference: `22.1.x` at `ef48630a14f0bc8ba0a46d3fc7555c2a29f26a41`,
`packages/forms/signals/src/api/rules/validation/validation_errors.ts` and
`packages/forms/signals/test/node/api/validators/validation_errors.spec.ts`.

When child names are unknown, `AnyNode` consumers must use `$api` for state and operations:
children can shadow both direct API members and the `api` alias. `DynamicNode` exposes direct
common state and operations for declarations known not to shadow that surface. It is not a
runtime adapter or a collision check, and asserting an arbitrary node to `DynamicNode` cannot
make a colliding member safe. `isFormNode()` narrows identity to `AnyNode` without guaranteeing
the stronger direct-member contract. The generic API example exercises both supported uses.
`AnyNode` does not intersect `HiddenFunctionMembers`: its private members would reject arrays
with public `length` and forms/groups with colliding child names. Native function suggestions
can therefore remain visible in IntelliSense; they are not guaranteed node operations.

`FormNodeDirective` names the standalone `[formNode]` directive and its public binding view.
`FormNodesModule` imports and exports that directive for standalone and NgModule consumers.
It adds no providers, global configuration, validation rules, or interaction behavior. There is
currently no error-display component in the module. This change continues to use the inspected
Angular `22.1.x` reference at `ef48630a14f0bc8ba0a46d3fc7555c2a29f26a41`, including Signal Forms
`src/api/types.ts`, `src/api/assertions.ts`, and `test/web/assertions.spec.ts`; public type names
and the optional Angular module are this library's design choices.

`isFormNode(value: unknown): value is AnyNode` recognizes every primitive through the existing internal
node marker, including nested, configured, and detached nodes. It does not call the candidate,
read signal state, track dependencies, trigger validation, or change interaction or parent state,
and requires no injection context. Ordinary Angular signals, node API objects, plain objects, and
unmarked functions return false. The marker is local to a loaded package instance; separately
loaded copies do not share recognition. Narrowing exposes the shared `AnyNode` contract, not a
specific primitive or value type.

The identity-check reference inspected for this helper is Angular maintenance branch `22.1.x`,
commit `ef48630a14f0bc8ba0a46d3fc7555c2a29f26a41`:
`packages/forms/signals/src/api/assertions.ts`, `src/api/symbols.ts`, `src/field/proxy.ts`, and
`test/web/assertions.spec.ts`. Angular likewise checks a function's internal marker and rejects
ordinary signals. Form Nodes retains its own marker and `AnyNode` contract rather than recognizing
Angular `FieldTree` values; no state transition or propagation behavior changes.

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

## Angular compatibility

The package supports Angular `^21.0.7 || ^22.1.5` and builds with Angular 21.0.7 / TypeScript 5.9.3.
Angular 22 `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`) remains the behavioral authority.
The reference was re-resolved for this change; `api/control.ts`, `directive/form_field.ts`,
`directive/control_custom.ts`, `field/state.ts`, and `test/node/field_node.spec.ts` were inspected
alongside Angular 21 `v21.2.22` (`4c0bc4345a41ab48d8361e0bff18191da9c8c065`).

Form Nodes custom-control contracts now declare their own optional inputs, value/checked models,
touch output, and focus/reset methods. They use Angular core signal types, without inheriting the
version-specific Signal Forms UI interface. Runtime discovery and state propagation remain unchanged.
The former `$field` adapter and its schema samples are removed; `$api` is the sole reserved child key.
The binding options in `provideFormNodesConfig()` configure only `[formNode]`, using a token independent of Angular's config. Its `validatorMessages` option separately configures node messages.
`useFormNodeState()` retains all adapters, including external Angular Signal Forms; tests create real
Angular forms and use their native operations instead of converting Form Nodes trees.
Angular 21 `v21.0.7` (`8fd585cc0b4a7fc70ecb306c0c7b17f15393d0bf`) was additionally inspected
at `api/form_field_directive.ts` and `api/rules/validation/validation_errors.ts`.
Angular 21.0.7 is the minimum: it introduces `FormField` and `FORM_FIELD`. Error normalization
accepts Angular versions both with and without the optional `formField` error property.

## Design guarantees

- The library provides small, typed, signal-based `field()`, `group()`, `form()`, and `array()` primitives.
- Every primitive can be created and used anywhere without an Angular injection context.
- Synchronous behavior and node-driven asynchronous validation do not require dependency injection.
- Asynchronous validators always use an Angular reactive watcher, including outside an injection context.
- Signals expose reactive state while actions are declared as methods in public types, allowing editors to distinguish state from behavior in IntelliSense.
- Values remain programmatically readable and writable regardless of disabled, readonly, or hidden state.

## Construction inside computed declarations

`field()`, `form()`, `group()`, and populated `array()` declarations can run inside `computed()`.
Child normalization, item factories, validator-source normalization, and configuration getters
retain their signal dependencies. Initialization of parent links, array values, control buffers,
and validator watchers does not subscribe the declaring computation to mutable node state.
Editing values, validators, or descendants therefore does not by itself reconstruct the tree.

A dependency explicitly read by the declaration still invalidates the computation. Re-evaluation
creates a new tree when the declaration constructs fresh nodes; prior edits and interaction state
are not transferred. Existing retained trees keep their own lifecycle and injector ownership.
Reactive validators keep tracking their dependencies independently, including outside injection
contexts. This support concerns construction; ordinary mutation operations remain side effects.

The reference inspected for this correction was Angular `v22.1.5`, commit
`468b65b74566537456c192ac4281795c5a1e1a5e`. Angular's
`packages/forms/signals/src/field/structure.ts` materializes children inside `untracked()`, and
`packages/forms/signals/test/node/field_node.spec.ts` covers child access inside a computed.
Angular's root factory also installs a management effect through `src/field/manager.ts`, which is
not a model for root creation inside a computed. Form Nodes deliberately supports constructing fresh
trees in computed declarations and outside injection contexts, preserving dependencies of its
declaration factories; Angular's schema/model API is not the public contract.

## Configured primitive factories

`createFormPrimitives()` returns an isolated `field`, `form`, `group`, and `array` factory set.
Its optional defaults include `nullable`, `validatorMessages`, `inheritInjector`, and
`adoptBindingInjector`; the boolean policies retain their ordinary `true` defaults when omitted.
The package-level factories retain their nullable-by-default behavior. A nullability default applies
to direct fields, object field shorthands, dynamically added children, and nodes created later from
array templates or factories. An explicit `field.strict()` or `field.nullable()` call takes precedence, and an existing
node attached to a configured form retains the policy of the factory that originally created it.

In a non-nullable factory set, an untyped `field()`, `field(null)`, or `field(undefined)` returns
`FieldNode<unknown>` because no concrete initial value exists to infer a future type. An omitted value
starts at `null`; an explicit `undefined` is preserved. A typed `field<T>()` still requires an
initial value. Consumers can instead declare `field.nullable<T>()` to start at `null` with type
`FieldNode<T | null>`.

This initialization convenience belongs to Form Nodes' API. Angular v22.1.5 requires an existing model
signal in `packages/forms/signals/src/api/structure.ts`, passed through by
`src/util/normalize_form_args.ts`; its `test/node/form.spec.ts` and `test/node/field_node.spec.ts`
cover model-backed creation and values. Angular has no corresponding no-argument field factory.

The configured validator catalog is a fallback for every node created by the set, including a
standalone field. Explicit node and ancestor catalogs take precedence, followed by the configured
factory catalog, captured Angular provider catalogs, the process-wide catalog, and built-in text.
Configured injector policies apply to each newly created node, while a node-local option takes
precedence. The factory does not accept an injector because doing so would make that injector an
explicit owner of every created node instead of preserving hierarchical ownership.

Every runtime node exposes `nodeType()`, which returns the precise public discriminant `'field'`,
`'group'`, `'form'`, or `'array'`. The literal is stable for the node's lifetime and is preserved by
template cloning. Generic infrastructure can read the same method through `$api.nodeType()` when a
named child shadows the direct member. Internal capability selection also uses `$api.nodeType()`,
so the public and internal paths share the same discriminant. The separate private symbol used by
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

- `field()` and the `FieldNode`, `FieldApi`, and `FieldOptions` types.
- `form()` and the `FormNode`, `FormApi`, `FormOptions`, `FormValue`, `FormValueContract`, `FormSet`, and
  `FormPatch` types.
- `FormNodeValue<TNode>` for extracting the committed value type of any form, group, array, or field.
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

Fields are nullable by default. The examples above have types `FieldNode<string | null>`, `FieldNode<number | null>`, and `FieldNode<string | null>`. A field created without a value starts at `null`.

A field created from the literal `null` or `undefined` without an explicit generic is inferred as
`FieldNode<unknown>`. Their runtime values remain distinct: `null` stays `null`, while an explicitly
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

These reads refer to the same value. Most field state and actions are exposed both on the callable field and under `field.api`. `patch()` is exposed in the public types through `field.api` and `field.$api`; for a leaf field it behaves exactly like `set()`. The callable field also carries the runtime method, but intentionally omits it from its public type.

## Field value equality

`FieldOptions<TValue>.equal` accepts `'shallow'`, `'deep'`, or a typed
`(previous: TValue, next: TValue) => boolean` comparator. The default remains `Object.is`.
The option is captured at construction and applies to an exposed computed value. The internal
`value` signal always uses `Object.is`; `exposedValue` supplies the callable field, public `value()`,
validator context, update callbacks, and public parent composition. Equivalent exposed values
preserve the previous reference and do not rerun value-dependent sync or async validation.
Other dependencies, including interaction and explicit validation requests, retain their existing
effects. Array template clones preserve the field's equality option. Equality is not inherited.

Comparators run untracked during exposed computation. The first evaluation publishes the current
internal value without comparing, so writing before the first read can change that first exposed
value. Later evaluations compare against the last exposed value; intermediate writes may coalesce.
Actual nullable or undefined values are passed to subsequent comparisons, but temporary constructor
storage is never exposed. Comparator exceptions affect exposed reads after internal writes have
committed; a later internal change permits recovery. Identical internal writes are skipped under
`Object.is`, even if the custom comparator always returns false.

`shallow` uses the existing object/array own-key comparator with `Object.is` for direct values.
`deep` is an independent implementation of lodash 4.18.1 `isEqual`-style value semantics, including
own enumerable string/symbol keys, ordered arrays, dates, errors, regexes, boxed primitives,
typed arrays, buffers, maps, sets, and circular references. Map/set comparisons propagate unordered
comparison into nested arrays and map entry pairs. Functions and unsupported branded objects use
identity. Numbers use SameValueZero (`NaN` equals itself; signed zeroes are equal). Shared references
need not have identical aliasing in an otherwise equivalent acyclic graph. Deep comparison does
not snapshot in-place mutations. The implementation does not depend on lodash or unwrap its
library-specific chain objects.

`value.control()` retains the latest input independently of exposed equality. Control changes still
mark dirty. Only input identical to the current internal value under `Object.is` cancels obsolete
debounce work without scheduling replacement work. Publicly equivalent but internally different
input follows the existing debounce strategy. `set()` cancels pending control work and stores the
new value. `reset()` clears interaction, resets control bindings, and restores the latest internally
committed value, independently of a retained exposed value. `reset(value)` stores its explicit
value even when publicly equivalent. `update()` receives the exposed value.

The Angular reference is `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`):
`packages/core/primitives/signals/src/signal.ts`, `computed.ts`, and their corresponding
`packages/core/test/signals/` tests govern storage and exposed comparison. Signal Forms projects
children from a shared model through `packages/forms/signals/src/util/deep_signal.ts`, covered by
`packages/forms/signals/test/node/deep_signal.spec.ts`. Form Nodes deliberately adds public equality over
independently owned values; control interaction and committed storage remain separate.

Consumers that need their own comparison of a form, group, array, or field value should derive a
`computed(() => node(), { equal: comparator })`. A comparison returning true retains the derived
signal's previous value/reference and can suppress downstream recomputation, while the node and
its ancestors, validators, submission, and control buffers keep observing their own committed
values. This pattern gives one consumer its own comparator. Comparators must be pure and regard
values as interchangeable for that consumer; comparator signal reads are untracked. The Angular
`v22.1.5` computed implementation and `packages/core/test/signals/computed_spec.ts` establish these
semantics. The executable website example checks both retained consumer values and current node
values, plus downstream recomputation after equal and non-equal changes.

## Aggregate value equality

`form()`, `group()`, and `array()` accept `equal: 'shallow' | 'deep' | ((previous, next) => boolean)` with the
complete inferred aggregate value type. `Object.is` remains the default. The option is captured
at construction, is not inherited, and survives configured factories and template cloning.
`FieldNode`, `FormGroupNode`, and `ArrayNode` consistently name their internal model `value` and
their public computed `exposedValue`. Array comparators receive the complete inferred array value,
including nullable item values and properties; options are preserved in cloned array templates.

| Operation | Value path |
| --- | --- |
| Callable, public `value`, validator context `value` | Exposed aggregate snapshot. |
| Submission action value, update callback argument | Exposed aggregate snapshot. |
| Public form/group/array composition | Exposed child values. |
| Internal aggregation, reconciliation, keyed array matching | Current committed child values through internal `_value`. |
| Control synchronization and aggregate debounce baseline | Current committed values, independently of exposed equality. |
| Reset without a value | Preserve current child values; clear interaction and pending control work. |

The exposed aggregate is a lazy computed signal. The first read publishes the current value
without comparing; subsequent evaluation retains the previous value/reference when equality
returns true. Reads inside the comparator are untracked, intermediate writes can be coalesced,
and comparator errors affect exposed reads after child writes have already committed. A later
dependency change permits recovery. Fields follow the same exposed-value strategy.

Public parent computations track public child signals independently of the internal aggregate.
Each aggregate independently constructs its internal snapshot from internal child values and its
public snapshot from exposed child values. Both computations remain lazy and memoized. An equal
public change therefore does not force public parents to revalidate, while controls and buffers
still observe the latest committed child values, even across arrays. Public and control snapshots
can contain equal data without sharing object/array identity.

Array equality never filters structural operations. `items()`, indexed access, length, iteration,
parent/key/path signals, detachment, interaction, and child validation remain based on current nodes.
Keyed reconciliation uses internal committed values even when the public array retains an older
snapshot. Reordering equal-valued nodes still changes the internal array snapshot and invalidates
obsolete pending control input on the array or an ancestor. A custom comparator that ignores order
or count can deliberately retain a public array with a different order or length from current nodes;
consumers render dynamic rows using `items()`. Array equality is not inherited by item nodes.

Value-only synchronous validation retains its result, and asynchronous validation keeps pending
work when its computed dependencies compare equal. Tracked asynchronous callbacks poll actual
producer changes before restarting; an unchanged computed dependency clears its dirty notification
without losing subsequent notifications. Reads of other signals or direct child nodes remain
independent validation triggers. Child errors, availability, and interaction propagate normally.
Submission and update callbacks receive the same exposed model available to consumers; equality
must represent interchangeable values for those operations and the aggregate's validation rules.

`reset(value)` writes the supplied child values even if the public aggregate retains an equivalent
snapshot. Control-facing values may therefore differ from public aggregate reads with no pending
debounce. This is intentional; `value.control` remains a control representation rather than another
general-purpose public model accessor. Angular `[formField]` synchronization and `[formNode]`
control buffers use committed values so retained snapshots cannot revert control input.

Reference: Angular `v22.1.5`, commit `468b65b74566537456c192ac4281795c5a1e1a5e`:
`packages/core/primitives/signals/src/computed.ts`, `watch.ts`, and the matching computed tests
govern retained values and dependency polling. Signal Forms `util/deep_signal.ts` and
`test/node/deep_signal.spec.ts` project child values from a shared model. Form Nodes' two aggregate value
paths are an intentional extension for independently owned child nodes.

For array identity and moves, also inspected Angular `packages/forms/signals/src/field/structure.ts`
and `packages/forms/signals/test/node/dynamic.spec.ts` on the same release: object array children
preserve their node identity across moves and subsequent writes target the new key. Form Nodes retains its
explicit `trackBy`/index reconciliation API and adds independent public equality without changing
structural ownership.

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

`FormNodeValue<typeof node>` extracts any node instance's committed value type, equivalently to
`ReturnType<typeof node>`. It accepts forms, groups, arrays, and fields, whether standalone or
nested, including array items. It preserves nested values, field nullability, configured defaults,
and child names that collide with direct API members. `FormValue<TNodes>` continues to accept a
child-node map. This type-only helper does not change runtime behavior or widen the declaration's
static value type when dynamic children are added.

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
validators, configuration, and all common node operations, but it has no `onSubmit` option or
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
`FieldNode<unknown>`, and each shorthand preserves its `null` or `undefined` runtime value. Every array is
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
keys in `packages/forms/signals/src/field/structure.ts`; it does not expose Form Nodes' declaration
shorthand boundary. Form Nodes therefore intentionally uses the stricter rule above for its definition
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
  literal `null` and `undefined` infer `FieldNode<unknown>`.
- Shorthand objects infer the same values and nested field access as explicit groups.
- Validators receive a `FieldContext` whose `value` signal contains the inferred node value.
- `set()` and `reset(value)` require complete values at compile time.
- `patch()` accepts recursive partial form values.
- Incorrect value types and unknown keys in typed value updates are rejected at compile time.
- Field and form errors use readonly arrays of `ValidationErrorWithTargetNode`.

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
| `value.control.set(value)` | Updates `value.control()` immediately and commits `value()` after the configured debounce | Marks dirty immediately | No change |
| `flush()` | Immediately commits a pending `value.control()` | No additional change | No change |
| `api.patch(value)` | Same as `set(value)` | Preserves current state | No change |
| `reset()` | Preserves the current value | Clears dirty | Clears touched |
| `reset(value)` | Replaces the value | Clears dirty | Clears touched |

`reset(value)` handles falsy values such as an empty string or zero. Resetting does not replace validators, and validation is recomputed against a newly assigned value.

`update()` is the immutable convenience form of reading and setting a complete value. Its updater runs synchronously once and receives `value()`, never a pending `value.control()`:

```ts
age.update(value => (value ?? 0) + 1);
```

The operation is executed untracked, delegates to the same programmatic behavior as `set()`, cancels pending field control debounce, synchronizes `value.control()`, and preserves existing dirty and touched state.

### Control-originated value debounce

`value.control()` is the immediate value owned by the UI control bound to a field. `value()` is the committed model value used by validators and aggregated by parent forms. Configure `debounce` on a field and send future UI updates through `value.control.set()`:

```ts
const search = field('', { debounce: 300 });

search.value.control.set('angular');

search.value.control(); // 'angular' immediately
search.value(); // '' until 300 ms elapse
search.debouncing(); // true
```

Every new control update restarts the complete delay. `debounce: 'blur'` instead keeps the latest control value buffered until the native control blurs, a Signal control emits `touch`, a CVA invokes its touched callback, or application code calls `markAsTouched()`. Marking any interactive node touched commits its own pending control value for every debounce strategy, matching Angular Signal Forms. Aggregate `markAsTouched()` also applies this to descendants unless `skipDescendants` is true. A custom debouncer receives an `AbortSignal` and may return a promise; the value commits when that promise resolves. A newer control value aborts the previous signal and ignores its eventual settlement. A rejected debouncer leaves the committed value unchanged and ends `debouncing()`. A synchronous `void` result commits immediately, while a synchronous throw is propagated after cancelling the debounce. `flush()` commits the latest buffered value immediately for every strategy and aborts custom asynchronous work. A missing, non-finite, zero, or negative numeric debounce commits control updates immediately.

Programmatic operations are never debounced. On fields, forms, and arrays, `set()`, `api.patch()`, and `reset(value)` cancel any pending control update and synchronize `value.control()` and `value()` immediately. `reset()` without a value aborts custom asynchronous debounce work, discards the buffered control value, and restores `value.control()` and any bound custom control from the currently committed value. This prevents a stale completion from overwriting newer programmatic state. A control update marks its directly bound node dirty immediately; reset clears dirty and touched state as usual without dirtying aggregate descendants.

Scheduled control-value debounce callbacks have weak ownership of their node state and per-update
abort controller. Otherwise unreachable fields, forms, groups, arrays, and parent trees can be
collected while timers or custom promises remain pending, including after cancellation. A callback
that runs after collection does nothing. A retained node still owns its active controller and
completes normally; replacement, reset, flushing, rejection, and stale-result checks are unchanged.
Application-owned callbacks, values, control bindings, and injectors retain their existing ownership.

The shared buffer creates scheduled callbacks in separate function scopes containing only weak
references and scheduling inputs. Merely reading a `WeakRef` from a callback created alongside
other live-state closures is insufficient to establish that ownership boundary. Custom settlements
also use weak controller references so obsolete promises do not retain cancelled controllers and
their abort reasons. The GC regression covers pending timers, resolving/rejecting custom work,
cancelled promises, and live completion in both class-field emit modes.

This ownership correction was checked against Angular Signal Forms `v22.1.5` at commit
`468b65b74566537456c192ac4281795c5a1e1a5e`, specifically `packages/forms/signals/src/field/node.ts`
and `packages/forms/signals/test/node/api/debounce.spec.ts` for completion, replacement, and touch
semantics. Weak lifetime for standalone Form Nodes nodes is an additional library contract, rather than a
requirement inferred from Angular's injector-owned field lifecycle.

Synchronous and asynchronous validators observe only committed `value()` changes. Parent forms likewise aggregate committed child values, including for nested forms. Every node exposes `value.control()`, but it represents only the control bound directly to that node and does not aggregate pending control values from descendants. `debouncing()` is independent from asynchronous validation `pending()`.

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

Aggregate nodes expose `value.control()` for a custom control bound directly to that form
or array. Such a control has its own debounce buffer: `value.control()` changes immediately while
`value()` and descendants retain their committed values until the aggregate strategy completes or
`flush()` runs. Descendants remain pristine because the dirty interaction belongs to the aggregate
control. A newer programmatic or descendant value invalidates the aggregate buffer so stale work
cannot overwrite it.

Pending control values from descendants are intentionally not composed into an ancestor's
`value.control()`. Until those descendants commit, both ancestor `value()` and `value.control()` keep
their last committed representation. This follows Angular Signal Forms, whose node-level
`controlValue()` explicitly does not incorporate child control values. This library exposes
control writes through `value.control.set()` and its binding API; the nested signal does not
implement the full Angular `WritableSignal` interface.

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

At the type level, `set()` and the result of `update()` require every form key, while `patch()` rejects unknown keys. At runtime, unknown keys passed through an unsafe cast are ignored and produce an English console warning in development mode. The `update()` callback runs synchronously once in an untracked context and delegates its complete result to `set()`.

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
TypeScript and Angular strict-template error. `get(key)` returns
`DynamicNode | undefined`; initially declared children keep their original precise and non-optional
direct-property types. `DynamicNode` exposes the state and
operations common to every primitive directly, including `value`, `disabled`, validation, and
interaction state, while hiding native function members and omitting primitive-specific methods.

New children immediately receive their parent, key, path, nearest form, structural root, inherited state, debounce,
and injector. They participate in aggregate value, errors, validation status, pending, touched,
dirty, focus, reset, and control operations as soon as the structural version changes. Duplicate
keys and reserved `$api` keys throw before any entry in a batch is attached. A node that
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
the result of `get()` when they need a dynamic value. Fixed-shape `set()`, `patch()`, `update()`, and
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

Every validation error has a `kind` string and may have a human-readable `message`. Custom errors may include additional data. A validator result can be `null`, `undefined`, or `void` for success, a message string, a single `ValidatorError`, or a readonly array of strings and error objects.

Validators normally omit their own target. When their results are exposed through `errors()`, the validator runner associates every untargeted error with the node being validated through `targetNode`:

```ts
const name = field('', [required]);
const error = name.errors()[0];

error.kind === 'required';
error.targetNode === name;
```

Error variants are exported directly without a namespace. Their target and binding constraints are unchanged:

```ts
ValidationErrorForKind<TKind>
ValidationErrorWithTargetNode<TNode>
ValidationErrorWithOptionalTargetNode<TNode>
ValidationErrorWithoutTargetNode
ValidatorError<TNode>
```

Field errors use their `FieldNode<TValue>` as the target type. Form errors use their complete `FormNode<TNodes>` as the target type. A form, group, or other aggregate validator may explicitly return a descendant in `targetNode` for a cross-field rule. The internal defaulting operation preserves that target; otherwise it assigns the validated node. `formNode` remains reserved for errors produced by concrete rendered bindings.

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

A class property may reference its own node or form from a deferred synchronous validator,
including sibling value reads through `this.myForm`, without a callback return annotation.
Primitive configuration arguments do not participate in inference of the declared value/model;
unified argument tuples preserve the positional-validator and options forms without circular
overload inference. Inference barriers wrap validator and options alternatives separately, keeping
option-object property completion available for all primitives and configured factories. Both
block and expression callbacks support direct results and returned arrays of synchronous validators.
Validator-source arrays use contextual tuples so the compiler does not
compare a deferred callback's return against other array entries while inferring the owner.

The deliberate type-checking tradeoff is confined to parameterless callbacks supplied as validator sources
or passed to the callback signatures of `validator()` and `asyncValidator()`,
whose accepted return type is `any`. This also admits overloaded functions with a zero-argument
signature, and does not check a deferred validator's value compatibility with its consumer.
Use context-taking callbacks for checked authoring and the called form of overloaded factories such as
`uniqueItems()` for checked value compatibility. Context-taking callbacks retain their checked contracts
both directly and through the helpers. `ComposableValidator`, `ValidationResult`, and the parameterized
asynchronous configuration retain their checked contracts. Contextual helper overloads prevent callback
results from participating in inference; fallback overloads still infer explicitly annotated standalone contexts. The
runtime result/composition protocol is unchanged; arbitrary values and unmarked asynchronous
callbacks are not newly supported. Field values, node kinds, child names, and aggregate models
remain precisely typed, including explicit nullability and configured primitive defaults.

Nodes with mixed synchronous and asynchronous validators defer the first asynchronous watcher run to a microtask so synchronous guards, `when`, and
`params` callbacks are not evaluated during construction. Reading asynchronous errors or pending state
flushes that initial setup synchronously, while deferring the asynchronous callback itself until the
microtask. Subsequent reads do not flush later scheduled revalidation. Synchronous failures still suppress
asynchronous execution, and pending/error aggregation and weak injector ownership remain unchanged.

Synchronous validator callbacks remain lazy: read the class property inside the callback, after
assignment, rather than evaluating the reference while constructing its arguments. External and
sibling signals read during validation invalidate the same computed validation result; they do
not mark fields dirty or touched.

This existing dependency behavior was checked against Angular `v22.1.5`
(`468b65b74566537456c192ac4281795c5a1e1a5e`), the latest stable Angular 22 tag inspected:
`packages/forms/signals/src/api/rules/validation/validate.ts`,
`packages/forms/signals/src/field/validation.ts`,
`packages/forms/signals/test/node/api/validators/max_length.spec.ts` (dynamic sibling constraint),
and `packages/forms/signals/test/node/field_node.spec.ts` (conditionally required sibling).
The mixed-validator startup regression was also checked against
`packages/forms/signals/src/api/rules/validation/validate_async.ts` (the synchronous-validity gate) and
`packages/forms/signals/test/node/validation_status.spec.ts` (asynchronous status and parent aggregation).
The same release tag was re-resolved for this change.
Angular declares rules against a separate model/schema; this class-initializer inference pattern
and returned-validator composition belong to Form Nodes' public API.

Validator result normalization is defensive. Non-array objects with a readable string
`kind` are accepted as validation errors; `kind: ''` is allowed. `null` and `undefined` are silent success
results. Strings become `{ kind: 'custom', message }`, including empty and whitespace-only strings;
no trimming or deduplication occurs. Arrays may mix strings and structured errors.
`errors()` and `allErrors()` expose normalized objects; `getError('custom')` returns the first
matching error, including explicitly returned objects with that kind. Use an explicit error kind
to identify a particular rule. Other primitives, malformed objects, unreadable `kind` getters,
and nested arrays are ignored with a development-only diagnostic. Valid error references, order,
custom properties, and duplicate kinds are preserved. Invalid entries do not block validity.
Warnings are emitted per invalid entry when validation recomputes, not for repeated cached reads.
Form Nodes returned as results are recognized before function composition and ignored without
executing them; this includes a child validator accidentally returning `ctx.parent()`.

The same normalization processes synchronous results, Promise/Observable results, and asynchronous
`onError` results. Invalid asynchronous results finish pending state normally and do not call
`onError`; existing cancellation and stale-result checks still run before publication. Normalization
does not catch exceptions thrown by validator callbacks or change explicit composition guards.
Arrays containing synchronous validators discard malformed entries before enforcing the existing
prohibition on mixing valid errors and validators.

Defensive filtering and string-message shorthand are intentional extensions beyond Angular `v22.1.5`
(`468b65b74566537456c192ac4281795c5a1e1a5e`). Inspected
`packages/forms/signals/src/api/rules/validation/validate.ts`,
`packages/forms/signals/src/field/validation.ts` (`normalizeErrors` and `addDefaultField`), and
`packages/forms/signals/test/node/api/validators/validation_errors.spec.ts`. Angular's normalization
assumes typed error objects; Form Nodes checks runtime results because parameterless callbacks
have intentionally unchecked return types. Valid-error state propagation is unchanged.

Signals read by either the outer or returned validators are dependencies of the same synchronous validation `computed()`. Nested composition is supported, and every level receives the same context object. `null` and `undefined` entries in a returned validator array are ignored, which allows concise conditional entries such as `() => [required, enabled() ? minLength(2) : null]`. After empty and malformed entries are removed, an array must contain either only validators or only validation errors; mixing validators and errors in one returned array throws because its intended evaluation order would be ambiguous. Circular composition throws an English runtime error, and resolution is limited to 100 returned-validator levels to protect against chains that continually allocate new functions.

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

Every API also exposes `parent: Signal<AnyNode | null>`, which returns the complete callable parent node or `null` at the root. Nodes reached through a form are refined to their concrete parent type, so `profile.address.city.api.parent()` is typed as `typeof profile.address | null`. A standalone field reference cannot know its future owner and therefore retains the general `AnyNode | null` parent type even after being inserted into a form; access through the form provides the refined type.

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
a helper's value generic preserves that type on the generic owner's callable value and its
`value`, `api.value`, and `$api.value` signals, including async callback contexts. The primitive
kind and child keys remain unspecified. Without a value generic or a consuming node, these reads
remain `unknown`. Omit helper generics for inline inference or
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
tests those distinct `fieldTree`, `state`, and `value` accesses. Form Nodes preserves that distinction
between node identity and reactive node state while adding an explicit readonly signal wrapper.
State reads through the node keep their existing dependency tracking and state propagation; removing
flat context state and API properties changes only the public access path. The context constructor
reuses its existing `node` signal when synchronous and asynchronous validation share the context.

Structural-root type resolution follows at most ten parent links. This limit affects TypeScript
inference only: paths within ten levels retain the exact root type, while deeper paths safely fall
back to `AnyNode`. Runtime traversal remains correct and has no depth limit. Nearest-form inference
uses the form type exposed by the immediate parent and preserves explicit nested workflow boundaries.

This ownership split is library-specific. Angular 22.1.5 Signal Forms, inspected at tag `22.1.5`
(`468b65b74566537456c192ac4281795c5a1e1a5e`) in
`packages/forms/signals/src/api/structure.ts`, `packages/forms/signals/src/field/structure.ts`, and
`packages/forms/signals/test/node/form.spec.ts`, creates one `FieldTree` root from a model signal and
does not expose Form Nodes' explicit nested-form workflow primitive or separate `form()` and `root()`
lookups. Form Nodes retains comparable reactive parent/path behavior while defining these ownership
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
for descendant field trees. Form Nodes deliberately generalizes that lifecycle behavior to every
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

See [Validator messages and internationalization](../website/docs/guides/validator-messages.md) for the complete
consumer-oriented guide, including setup recommendations, SSR considerations, callback parameters,
and examples for every configuration scope.

Built-in messages resolve from lowest to highest priority as follows:

1. The English message included with the library.
2. The process-wide catalog installed by `configureGlobalFormNodes()`.
3. The closest Angular catalog captured from `provideFormNodesConfig()`.
4. The closest fallback catalog from the node's `createFormPrimitives()` factory set.
5. The closest ancestor form or array `validatorMessages` option.
6. The validator's own `message` option.

Each catalog is partial. An absent entry, or a message function that returns `undefined`, continues
to the next lower-priority layer.

Use global configuration for non-Angular applications or a deliberate process-wide default:

```ts
const restoreMessages = configureGlobalFormNodes({
  validatorMessages: () => ({
    required: () => language() === 'es'
      ? 'Este campo es obligatorio.'
      : 'This field is required.',
    min: ({ min }) => `The minimum value is ${min}.`,
  }),
});

// Useful in tests or temporary scopes.
restoreMessages();
```

The returned function removes this call's overrides independently, preserving later registrations
and skipping already cleaned-up registrations during restoration. Because this state belongs to the JavaScript module, concurrent SSR
requests must not mutate it per request; use a provider or form scope instead.

Configure an Angular application or route once with a factory that may use `inject()`:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      validatorMessages: () => {
        const translations = inject(TranslationService);

        return {
          required: () => translations.translate('validation.required'),
          min: ({ min }) => translations.translate('validation.min', { min }),
        };
      },
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
declare module '@ngblocks/form-nodes' {
  interface ValidationErrorMap {
    readonly unavailableUsername: ValidationError & {
      readonly kind: 'unavailableUsername';
      readonly suggestion: string;
    };
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
- `value.control.set()` represents an update from a bound UI control and marks the field dirty immediately, including when the control reports the existing value.
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
  readonly sourceNode: AnyNode;
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

Field, form/group, array, and shorthand-object recipes capture declarative inputs in isolated callback scopes, so the recipe itself does not retain the source node or its parent tree. Application-owned values, validator callbacks, state sources, and explicit injectors retain their existing identity and ownership; references held by that application configuration are not removed by compiling a template.

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

`form()` accepts `onSubmit(value, form)`, `onSubmitBlocked(form)`, and `submitWhen` options and exposes `submit()` plus the reactive
`submitting()` state:

```ts
const profile = form({
  name: field('', [required]),
}, {
  onSubmit: async value => saveProfile(value),
  onSubmitBlocked: () => showValidationMessage(),
});

const submitted = await profile.submit();
```

Submission marks the form and its descendants touched before checking validation. Invalid forms do
not run the action and resolve to `false`; `onSubmitBlocked`, when configured, runs instead. Pending
validation does not block submission by default, matching Angular Signal Forms. Set
`submitWhen: 'valid'` to require `valid()`, or `submitWhen: 'always'` to run the action despite invalid or
pending validation. Only one action may run at a time. Concurrent calls resolve to `false`, while
`submitting()` is `true` on the submitted form and inherited by every descendant. The state is
cleared in a `finally` block if the action succeeds or rejects.

Calling `submit()` on a form without a configured action is non-destructive: it marks and flushes
the subtree and resolves to `false`. It does not throw. This keeps an explicit `form()` usable where
a structural `group()` would also have been sufficient.

`FormNodeDirective` also binds this behavior when its `[formNode]` host is a native form:

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

Submission gating, inherited state, and concurrency were inspected against Angular `v22.1.5`
(`468b65b74566537456c192ac4281795c5a1e1a5e`): `packages/forms/signals/src/api/structure.ts`
(`submit` and `shouldRunAction`), `src/field/submit.ts`, and `test/node/submit.spec.ts` under
`packages/forms/signals/`. The public API intentionally uses flat form options, a value-first
callback, and explicit gate names: `'valid'`, `'not-invalid'` (default), and `'all'`.
Unlike Angular, a missing action returns `false` after touching/flushing rather than throwing;
returned server-validation errors are not interpreted. Form Nodes uses one `FormNodeDirective` directive.

`onSubmitBlocked` runs synchronously and untracked only when the validation gate rejects the
attempt, including pending validation with `'valid'`. Pending validation is not awaited and does
not schedule a retry. Concurrent attempts and missing actions do not invoke this callback.
Its exceptions reject `submit()` without starting the action. `onSubmit` also runs untracked,
receives the exposed value snapshot followed by the exact form, and may return `void` or
`PromiseLike<void>`. Its rejection propagates while `submitting()` clears in `finally`.
`'all'` changes only the gate: validators and errors remain active. Submission options are
local to each form; nested forms inherit submission state, not another form's callbacks or policy.
The tolerant `group()` native-form binding is a deliberate library extension: Angular's `FormRoot`
does not expose an equivalent public distinction between this library's structural group and
submission-owning form.

## Control binding with `[formNode]`

Form Nodes binds its own nodes through `[formNode]`. The `$field` adapter has been removed.
`useFormNodeState()` still observes independently created Angular Signal Forms through `[formField]`;
it does not create or synchronize a second Angular form tree for Form Nodes nodes.

`FormNodeDirective` binds a field node to a native form control, and binds field, group, form, or array nodes
to an explicitly provided signal custom control or a component that implements Angular's
`ControlValueAccessor` contract:

```ts
@Component({
  imports: [FormNodeDirective],
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
- Native input updates use `value.control.set()`. They therefore mark the field dirty and honor the field's own or inherited control debounce; programmatic `set()` updates remain immediate and pristine. A dynamically bound native input `type` remains live: changing between compatible textual types such as `password` and `text` preserves model-to-view and view-to-model synchronization.
- Resetting a field or an ancestor form cancels its pending native-control debounce, restores the rendered committed value immediately, and prevents the cancelled value from reappearing when its timer would have completed.
- A blur event marks the field touched. IME composition is buffered until `compositionend`.
- `disabled`, `readonly`, `required`, `aria-invalid`, `min`, `max`, `minLength`, `maxLength`, and `pattern` are synchronized from field state to applicable DOM properties. Applicability observes an input type bound during Angular initialization. Date limits are formatted for native `date` and `month` inputs. Native range controls apply browser clamping to their displayed value as constraints change; this does not rewrite a programmatic model value until the control emits an input event. When several pattern validators are active, the generated native pattern requires all of them; the node validators remain the authoritative validation behavior.
- Native controls receive a stable generated `name` in the form `${APP_ID}.formN.path.to.field`. Bindings for the same field share the same name, which preserves radio grouping, while fields in different root trees receive different names. Because the path is reactive, names follow array items when their indexes change. An explicitly authored native `name` is replaced by the generated field name, matching Angular Signal Forms.
- Changes to native select options reapply the field value, including options rendered after the initial binding.
- A reused radio input re-evaluates its authored `value` after every Angular render, so changing the option represented by an existing DOM node immediately recalculates its checked state without requiring a model change.
- `provideFormNodesConfig({ classes })` configures reactive classes for `[formNode]` bindings only. Its token is independent of Angular Signal Forms configuration; both providers can coexist. `ANGULAR_FORMS_STATUS_CLASSES` remains opt-in.
- Components that provide `NG_VALUE_ACCESSOR` are connected through their `ControlValueAccessor`. If the CVA component declares standard Signal Forms state inputs, including a signal input named `name`, those inputs receive the same field state used for signal-native custom controls. The directive also provides a lightweight `NgControl` view for compatibility with controls that inspect it, including Angular Material-style controls.
- A wrapper component may consume an input whose template name is exactly `formNode` and delegate that node to an inner `[formNode]` control. The outer directive becomes pass-through: it performs no synchronization, validation, CSS-class work, hidden-field warning, or focus registration. Only the delegated inner control is a binding. This is automatic and requires no provider. An aliased property is valid as long as its public template input name is `formNode`.
- Component wrappers are detected automatically from Angular's public component metadata. A directive that consumes or re-exports `formNode`, including a host directive, must add `providers: [provideFormNodePassThrough()]` because Angular exposes no equivalent public runtime reflection API for directive inputs. The provider affects only the injector on that host element.
- Components implementing Angular's standard `FormValueControl<T>` (`value = model<T>()`) or `FormCheckboxControl` (`checked = model<boolean>()`) are discovered automatically from their compiled component metadata. Separate input/output pairs require experimental bindInputOutputPairs: true; actual models and CVAs do not. They require no library-specific interface, provider, or registration. The model synchronizes in both directions and user changes follow the field's normal `value.control.set()` debounce behavior. A model must provide an initial value rather than use `model.required()`: Angular's template compiler has a special rule allowing `[formField]` to satisfy its custom control's required model input, but cannot extend that rule to third-party binding directives. Unlike Angular's internal control-creation hook, `[formNode]` connects during directive initialization, so the model is synchronized after the custom component's own `ngOnInit` and before its initialized view is consumed.
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
- Runtime helpers and storage on the injected `FormNodeNgControl` adapter use `_` prefixes,
  including node/binding access, emitters, error ownership, observation snapshots, cleanup, and
  descendant lookup. They are not consumer APIs. Implemented Angular contract members retain
  their Angular names; this internal naming change does not alter values, validation, notification,
  or lifecycle behavior. The member audit used Angular `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`),
  re-resolved as the latest stable Angular 22 release, inspecting `NgControl`,
  `AbstractControlDirective`, `AbstractControl`, and Signal Forms' `InteropNgControl`.
- The injected `NgControl` and its `control` expose stable `valueChanges` and `statusChanges`
  observables. `control.events` emits Angular `ValueChangeEvent`, `StatusChangeEvent`,
  `TouchedChangeEvent`, and `PristineChangeEvent` instances with the adapter as `source`. Values
  follow `_controlValue()`, including pending debounce input and writes suppressed by public equality.
  Status precedence remains disabled, valid, invalid, then pending. Error details are the node's own
  errors indexed by `kind`; aggregate validity and interaction still include descendants.
- CVA value input uses the callback registered through `registerOnChange()`. The existing
  binding routes it to the current node's control-value pipeline, tracks the last view value to
  avoid write-back echoes, and ignores changes during `writeValue()` and after destruction.
  `registerOnTouched()` updates interaction and flushes blur debounce. Binding replacement changes
  which node those callbacks address. `viewToModelUpdate()` remains unsupported: Angular's
  directive implementation updates a view-model cache and emits `ngModelChange`, while its
  shared pipeline writes the control separately. `[formNode]` has no such output or cache, so
  forwarding that method to a node write would implement different semantics; a dummy method
  would discard an application action. Consumers must use the registered CVA change callback.
- `control.updateValueAndValidity()` deliberately remains a no-op like Angular Signal Forms.
  Reactive state is current when read, with no imperative refresh lifecycle in the adapter.
  Calls do not execute configured or binding-owned validators again, clear imperative or settled
  async errors, change dirty/touched state, commit debounce input, restart/cancel pending
  validation, or force notifications. `emitEvent` and `onlySelf` have no effect; independent
  changes and later async completion still notify normally, and parents remain reactive.
  Nonreactive CVA rule changes must notify the existing `registerOnValidatorChange()` callback.
  Replacing node validators uses the node API. Reactive rule dependencies need no refresh call.
  Focused field/nested-form tests verify callbacks, debounce, rebinding, cleanup, errors, validator
  counts, and async ownership; browser tests verify real input and a CVA rule-change callback.
  This audit preserves existing runtime behavior and defines `viewToModelUpdate()` as outside
  the supported contract. Latest stable Angular 22 was re-resolved as `v22.1.5`, commit
  `468b65b74566537456c192ac4281795c5a1e1a5e`. Inspected
  `packages/forms/src/directives/shared.ts` (view-change/blur pipelines and `updateControl`),
  `packages/forms/src/directives/ng_model.ts`, `reactive_directives/form_control_directive.ts`,
  and `reactive_directives/form_control_name.ts` (`viewToModelUpdate`),
  `packages/forms/src/model/abstract_model.ts` (imperative recalculation and async cancellation),
  `packages/forms/test/reactive_integration_spec.ts` (forced value/status notifications),
  `packages/forms/signals/src/controls/interop_ng_control.ts` (no-op refresh), and
  `packages/forms/signals/test/web/interop.spec.ts` (CVA input and validator-change integration).
- `NgControl.validator`, `NgControl.asyncValidator`, and both corresponding `control` properties
  are read-only and return `null`: the combined adapter exposes no transferable Angular
  `ValidatorFn`/`AsyncValidatorFn`. This deliberately does not describe whether the node has
  configured rules, binding-owned `NG_VALIDATORS`, imperative errors, or pending asynchronous
  validation. Property reads neither execute rules nor change dependencies, errors, interaction,
  or cancellation. Node validation stays authoritative across reactive changes, replacement of
  validators, binding replacement, and destruction. Binding-owned synchronous callbacks remain
  memoized in their existing connection and respond to `registerOnValidatorChange()`; they are
  not exported for duplicate execution. Reading errors and subscribing to status remain supported.
  `hasValidator(Validators.required)` retains its metadata mapping, including `requiredIf`;
  arbitrary Angular validator identities and invoking/copying/assigning Angular validator
  functions are unsupported. Use node APIs to configure rules and adapter state to observe them.
  A cached-error function would incorrectly claim to validate its supplied `AbstractControl`,
  while exporting node callbacks would bypass reactive contexts and async ownership; neither is
  part of this compatibility contract. The directive and control therefore share the same view,
  unlike Reactive Forms' independently composed directive and control functions.
  Latest stable Angular 22 re-resolved as `v22.1.5`, commit
  `468b65b74566537456c192ac4281795c5a1e1a5e`. Inspected
  `packages/forms/src/directives/abstract_control_directive.ts` (composed-function getters),
  `packages/forms/src/model/abstract_model.ts` (function getters/setters and validation execution),
  `packages/forms/test/directives_spec.ts` (composition and invocation),
  `packages/forms/test/form_control_spec.ts` (replacement, clearing, and async functions),
  `packages/forms/signals/src/controls/interop_ng_control.ts` (no function export), and
  `packages/forms/signals/test/web/interop.spec.ts` (legacy validator errors and change callbacks).
  Integration tests cover reactive field and nested-form rules, async cancellation without extra
  execution, and a browser CVA with deferred `useNgControl` lookup and `NG_VALIDATORS`.
- `NgControl.reset(value?)` and `NgControl.control.reset(value?, options?)` delegate to the
  currently bound node's reset. Omitted/undefined values preserve current committed data;
  explicit values use the existing node reset semantics (complete form values, array
  reconciliation, literal null/falsy/object field values). Angular `{ value, disabled }` wrappers
  are not interpreted; disabled configuration is unchanged. Reset clears subtree interaction
  and binding-owned errors, cancels control debounce, and resynchronizes control rendering even
  under public equality. Siblings retain their state and ancestors recompute. Configured
  validators stay installed. Unchanged asynchronous dependencies retain pending work; changed
  dependencies cancel obsolete work through the existing node pipeline, without adapter-owned
  execution. Reset after binding replacement affects only the current node; after destruction
  it is inert. Calls are untracked.
  `{ emitEvent: false }` uses the synchronous reset snapshot as this adapter's next observation
  baseline, suppressing its value/status/interaction notifications without hiding subsequent
  writes, later asynchronous results, or replacement-node initialization. Other bindings and
  ancestor adapters retain their own notifications. Unsuppressed adapter reset emits a synchronous
  `FormResetEvent` after node reset, including when state is unchanged. Existing scheduled,
  coalesced state-change notifications follow; unchanged value/status do not force emissions.
  Direct node reset does not generate an adapter `FormResetEvent`. Angular's directive type
  accepts only the value; use `control.reset()` for notification options. `onlySelf: true` and
  `overwriteDefaultValue: true` are ignored with one `console.warn` per reset call in development mode because
  reactive node parents cannot be isolated and nodes have no stored reset default. Reset still
  completes and respects `emitEvent`. False/omitted options produce no warning.
  Unlike the node API, adapter `reset(undefined)` means no replacement value, matching Angular's
  directive forwarding and Signal Forms reset argument handling.
  Reference re-resolved to latest stable Angular 22 `v22.1.5`, commit
  `468b65b74566537456c192ac4281795c5a1e1a5e`: inspected Signal Forms
  `packages/forms/signals/src/field/node.ts` (`reset`/`_reset`),
  `packages/forms/signals/test/node/field_node.spec.ts` (falsy values, descendant interaction,
  pending asynchronous and blur debounce), and `src/controls/interop_ng_control.ts` (reset TODO);
  Reactive Forms `packages/forms/src/directives/abstract_control_directive.ts`,
  `packages/forms/src/model/form_control.ts`, `form_group.ts`, `form_array.ts`, and
  `packages/forms/test/form_control_spec.ts` (default values, wrappers, reset notifications).
  The differences above intentionally preserve node ownership rather than recreate Reactive
  Forms' defaults, isolated parent updates, synchronous state streams, or validator lifecycle.
- The injected `NgControl.name` reads the node's structural `keyInParent()` (`string`, numeric
  array index, or `null` for roots/detached nodes). `path` returns a fresh mutable copy of the
  node's string-segment path from its current structural root. Groups and nested forms contribute
  their keys; nested forms do not restart paths. Detaching a subtree clears its own name/path,
  while descendants retain their paths relative to that subtree. Array moves, reattachment, and
  binding replacement update reactive reads independently of public value equality. Reads do
  not mutate values, validation, interaction state, or pending work. Consumers cannot rename
  nodes through this read-only adapter or mutate metadata by changing a returned path array.
  HTML names, control name inputs, and DOM/container nesting do not determine these properties.
  Angular declares these members on directives, not `AbstractControl`; use the injected directive
  surface in typed CVAs. The existing combined runtime adapter exposes identical values on
  `control`, without adding a separate control object or a new public type. Deferred same-host
  lookup through a component-local `useNgControl` helper is covered in browser integration tests.
  This is an intentional extension of Angular Signal Forms, whose adapter leaves name/path as
  TODOs. Latest stable Angular 22 was re-resolved as `v22.1.5`, commit
  `468b65b74566537456c192ac4281795c5a1e1a5e`. Inspected sources:
  `packages/forms/signals/src/controls/interop_ng_control.ts` and
  `packages/forms/signals/test/web/interop.spec.ts` (combined adapter and separate CVA name input);
  `packages/forms/src/directives/ng_control.ts`, `abstract_control_directive.ts`,
  `reactive_directives/form_control_name.ts`, `reactive_directives/form_control_directive.ts`,
  and `shared.ts` (nullable name, named string-segment paths, standalone empty path);
  `packages/forms/src/model/abstract_model.ts` (no control name/path members) and
  `packages/forms/test/directives_spec.ts` (named/nested path diagnostics and directive/control
  property forwarding). Form Nodes follows structural node ownership rather than requiring
  Angular `ControlContainer` registration.
- Both the injected `NgControl` and its `control` implement `getError(code, path?)` and
  `hasError(code, path?)`. Queries use the same own-error projection as `control.errors`, including
  original imperative payloads and the last error for a duplicate kind. Without a path they inspect
  only the bound node, independently of aggregate invalidity. Relative dot-separated paths and
  arrays of string/number segments select actual descendants; numeric negative array indices count
  from the end. Segment arrays preserve literal dots and empty child names. An empty string selects
  the current node, while an empty segment array resolves no node. Queries never traverse field
  values, inherited properties, or API members. Child names that collide with API members remain
  accessible. Signal dependencies follow rebinding, dynamic children, and array positions even when
  public aggregate equality retains a previous value.
- Error queries follow Angular `v22.1.5` `packages/forms/src/model/abstract_model.ts`
  (`get`, `getError`, `hasError`), `form_group.ts` and `form_array.ts` (`_find`, `at`), and
  `packages/forms/test/form_group_spec.ts` (`getError`, `hasError`). `getError` returns `null` for
  unresolved paths or absent error maps, and `undefined` for an absent key in an existing map.
  `hasError` uses payload truthiness, including `false` for falsy imperative payloads despite node
  invalidity. Unlike Angular's plain dictionary lookup, inherited error-map properties are excluded.
  This extends Signal Forms' lightweight interop adapter, which omits these methods.
- `NgControl.control.setErrors(errors, { emitEvent? })` lets a CVA contribute control-originated
  errors, including parsing failures, to the bound node. Each binding owns one source in the existing
  external-error registry. Calls replace that source; `null` and `{}` clear it without clearing
  configured validators, asynchronous errors, or another binding's errors. Ancestor validity and
  submission checks use the combined node state. This operation does not write values, mark dirty
  or touched, or cancel an independent asynchronous validation run.
- Imperative Angular error keys become node error kinds. The original payload is retained in
  `context`, a string `payload.message` is exposed as `message`, and errors carry the current
  `targetNode` and `formNode`. The NgControl view unwraps these payloads back to their original shape;
  validator-originated node errors retain the existing complete-object projection. Spreading the
  currently exposed validator error objects into `setErrors()` does not adopt those objects as
  imperative errors. Components should submit only their own errors. Repeating a source with the
  same keys and payload references does not produce a feedback notification.
- Imperative errors persist across value writes and validation runs until the control clears or
  replaces them; reset clears them, and rebinding or destruction unregisters them. Non-interactive
  nodes suppress these errors consistently with other external errors. A CVA may clear its source
  in `writeValue()` after a programmatic value change. This is an intentional extension of Angular
  `v22.1.5`: Signal Forms' lightweight InteropNgControl omits `setErrors()`, and its
  `signals/compat/src/signal_form_control/signal_form_control.ts` rejects it. Classic Reactive Forms
  replaces manual errors on revalidation (`packages/forms/src/model/abstract_model.ts` and the
  `setErrors` tests in `packages/forms/test/form_control_spec.ts`). Control-owned source lifetime
  preserves parsing errors independently of valid model values and reactive validator execution.
- `emitEvent: false` suppresses this adapter's resulting status notification during effect
  synchronization. It does not silence node signals, ancestor propagation, or another binding's
  adapter. A subsequent independent validation or disabled-state change still emits. Sources update
  untracked, including when a subscription reports another error; destroyed bindings ignore late
  `setErrors()` callbacks.
- Same-host `NgControl` lookup and `startWith(control.status)` work in both
  `ngAfterContentInit()` and `ngAfterViewInit()`. An independent Angular `FormControl` inside the
  component retains Angular's own semantics: `enable()` revalidates and replaces manually assigned
  errors, including when already enabled; `disable()` clears errors. Copying adapter errors with
  `setErrors()` before `enable()` therefore needs an internal validator that returns those external
  errors, or the component must copy errors after enabling. Form Nodes does not intercept mutations
  on that independent control. Verified against Angular `v22.1.5`
  `packages/forms/src/model/abstract_model.ts` (`enable`, `disable`, `updateValueAndValidity`)
  and `packages/forms/test/form_control_spec.ts` (`setErrors`, `disabled errors`).
- The observation effect publishes an initial snapshot, then emits for changes in value, status,
  errors, pending, touched, and pristine. Status notifications also cover error-detail and pending
  changes without a different status string. Getters are immediately current; stream emissions occur
  during Angular effect synchronization and may coalesce multiple writes. Late subscribers receive
  future emissions without replay, so consumers read getters for their initial state. Subscriber
  callbacks run untracked. No duplicate `FormControl` or validation engine is maintained.
- Rebinding keeps the injected adapter and subscriptions stable, publishes the replacement's complete
  snapshot, and drops the previous node's reactive dependencies. Binding destruction removes the
  observation effect and completes the streams. This bridge serves state inspection, subscriptions, and binding-owned `setErrors()`;
  error queries can select descendants, but other Reactive Forms mutation and tree-traversal APIs
  such as `control.get()` are not provided. CVA changes still enter through the
  registered change/touch callbacks, and programmatic operations belong to the node API.
- Angular reference: latest stable tag `v22.1.5`, commit
  `468b65b74566537456c192ac4281795c5a1e1a5e`, resolved from remote tags. Inspected
  `packages/forms/signals/src/controls/interop_ng_control.ts` and
  `packages/forms/signals/test/web/interop.spec.ts` for the readonly CVA view and buffered values;
  `packages/forms/signals/compat/src/signal_form_control/signal_form_control.ts` and
  `packages/forms/signals/test/node/compat/signal_form_control.spec.ts` for effect-driven streams,
  untracked callbacks, and state-event classes; and
  `packages/forms/test/reactive_integration_spec.ts` for classic event payloads. Form Nodes
  deliberately extends Angular's lightweight interop view with observable state, using the compat
  layer's effect timing, and additionally notifies error-detail changes even when status is unchanged.
- `NG_ASYNC_VALIDATORS` are not adapted by this CVA compatibility layer. Asynchronous validation belongs to the node's `asyncValidator()` pipeline, which owns cancellation, pending state, debounce, and stale-result handling explicitly.
- Exporting the directive as `#binding="formNode"` provides the typed public binding API. `node` is the single reactive reference to the current bound node. `focus()`, `flush()`, and `reset()` operate on this concrete binding or its current node. The binding also exposes its host `element`, host `injector`, and a reactive `errors` signal.
- `binding.errors()` contains every error of the current node that is not owned by a concrete control, plus only the control-specific errors whose `formNode` is that binding. When two controls bind the same field, a native parse error from one control therefore remains absent from the other binding's errors even though the field aggregates both errors. Rebinding updates `node` and `errors` together, and binding-produced errors use the directive itself as their stable `formNode` identity.
- Every field, form, and array node also exposes `focus(options?)`. A field focuses the first of its current `[formNode]` bindings in DOM order. Forms and arrays search their current descendant bindings and focus the first rendered control in DOM order, independent of schema or array order. Signal custom controls use their optional `focus()` hook; native controls and CVAs focus the host element. Calling `focus()` without a bound control is a no-op, and destroyed or rebound directives are removed from the selection immediately. If a form child is named `focus`, that child keeps direct-property precedence and the operation remains available through `form.api.focus()`.
- Destroying the directive removes DOM listeners, disconnects select observation, and destroys its reactive effects through Angular's `DestroyRef` ownership.
- The directive supports server rendering for native controls and custom `ControlValueAccessor` components. Initial value and node-state bindings are rendered on the server, while browser-only select option observation is installed only in a browser environment. Native value conversion identifies controls structurally instead of depending on browser constructor globals.
- Client hydration reuses server-rendered controls rather than recreating them. Once hydrated, native events update the field normally, interaction state remains connected, and reactive value and validation bindings continue updating the claimed DOM nodes without hydration warnings or mismatches.
- In development, `[formNode]` warns whenever its bound field is hidden while the control remains rendered. The warning identifies the reactive field path, using `<root>` for a standalone root field. `hidden` is form state and does not manipulate DOM visibility: templates should remove hidden controls with `@if`. No warning is installed in production.

### Importing `FormNodeDirective`

Import the capitalized `FormNodeDirective` symbol from the package entry point and add it to the component's `imports`. The template binding remains the lower-camel-case `[formNode]` input:

```ts
import { Component } from '@angular/core';

import { field, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `<input [formNode]="name">`,
})
class ProfileEditor {
  name = field.strict('');
}
```

`FormNodeDirective` deliberately serves two TypeScript namespaces: it is the Angular directive value used in `imports`, and it is the clean generic instance type used by queries. Applications should import neither `_FormNode` nor a deep path beneath the package entry point.

### Querying a binding with `viewChild()`

Assign the directive's `formNode` export to a template reference, then query that reference by name with the signal-based `viewChild.required()` API. Parameterize `FormNodeDirective` with the exact node type to preserve the field, form, or array returned by `node()` without exposing Angular lifecycle and input infrastructure:

```ts
import { Component, viewChild } from '@angular/core';

import { field, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `<input #nameBinding="formNode" [formNode]="name">`,
})
class ProfileEditor {
  name = field.strict('');
  readonly nameBinding = viewChild.required<FormNodeDirective<typeof this.name>>('nameBinding');

  focusName() {
    const binding = this.nameBinding();
    const node = binding.node();

    node.set('Daniel');
    binding.focus();
  }
```

The three related names have distinct roles:

- `FormNodeDirective` is the imported Angular directive value and its public instance type.
- `[formNode]` binds a field, form, or array node to the control.
- `#nameBinding="formNode"` exports that concrete binding to the template; `nameBinding` is the local reference queried by `viewChild.required<FormNodeDirective<...>>('nameBinding')`.

The resulting query is a signal. Calling `nameBinding()` returns the binding; calling its `node()` signal returns the currently bound node. The remaining public binding API is `errors`, `element`, `injector`, `focus()`, `flush()`, and `reset()`.

The package exposes an `_FormNode` symbol solely because Angular's AOT compiler and linker must import the decorated implementation from the package entry point. It is framework infrastructure and must not be used by applications. `FormNodeBinding` remains available as the generic structural type for configuration callbacks and code that should not be named after the Angular directive.

### Automatic CSS classes

`provideFormNodesConfig()` can configure reactive CSS classes for every `[formNode]` binding below the provider:

```ts
bootstrapApplication(App, {
  providers: [
    provideFormNodesConfig({
      classes: {
        'is-invalid': binding => binding.node().$api.invalid(),
        'is-touched': binding => binding.node().$api.touched(),
        'is-pending': binding => binding.node().$api.pending(),
      },
    }),
  ],
});
```

Each class predicate has its own computed reactive context. A predicate reruns only when a signal it read changes, including signals unrelated to the bound node. After rendering, `[formNode]` adds the class when the predicate returns `true` and removes it when it returns `false`. The nearest explicit class provider applies to the binding, with the global map as fallback.

The predicate receives the same stable `FormNodeBinding` exposed by the template directive, including the host `element`, its `injector`, the reactive `node` and binding-filtered `errors` signals, and the binding-specific operations. Generic binding code uses `$api` because the bound form may legally contain a child named `api`; this is one of the cases for which the collision-safe escape hatch exists.

This behavior follows Angular Signal Forms as inspected in Angular `22.1.4`, commit `898380974d49cf7976e9d89cc74a0801a26ce7b1`, specifically `FormField.errors`, `FormField.focus()`, `FormField.reset()`, and `FormField.installClassBindingEffect()` in `packages/forms/signals/src/directive/form_field.ts`, the public `FormFieldBinding` in `packages/forms/signals/src/api/types.ts`, and the binding coverage in `packages/forms/signals/test/web/form_field.spec.ts`.

### Native event ordering

Native `input`, `change`, `blur`, `compositionstart`, and `compositionend` listeners are prepared
with public `Renderer2.listen()` during directive construction, before consumer template listeners
are registered. Only `input`, `textarea`, and `select` elements receive these listeners. During
initialization, the selected native adapter supplies their callbacks; selecting a CVA, custom
control, or pass-through binding removes the prepared listeners instead. Non-native custom hosts
never receive these listeners, and the dispatcher never subscribes to Angular outputs with the same
names. Destruction disconnects listeners and clears their callbacks. This preserves a single
standalone `FormNodeDirective` import without adding a second selector-based directive or relying
on Angular's private control creation APIs.

Immediate updates expose the newly parsed field value, parent composition, dirty state, and
synchronous validation inside the consumer handler. Blur exposes the updated touched state and
flushes blur debounce before that handler. Timed debounce and IME buffering retain their existing
semantics; parse failures expose errors while retaining the last valid value. Consumer resets are
not subsequently overwritten by a late transport listener. Rebinding resolves the current node.
Custom adapter transports remain responsible for their own output/CVA timing.

Reference inspected: Angular `22.1.x`, commit `ef48630a14f0bc8ba0a46d3fc7555c2a29f26a41`,
`packages/forms/signals/src/directive/control_native.ts`, `control_custom.ts`, `control_cva.ts`,
`form_field.ts`, and `packages/forms/signals/test/web/form_field.spec.ts`. Angular selects one
transport before registering its native DOM listeners or custom callbacks through internal
`ControlDirectiveHost` APIs. Reactive Forms' `packages/forms/src/directives/default_value_accessor.ts`
registers input and composition through host metadata on a selector-specific accessor;
`packages/forms/src/directives/shared.ts` commits change-mode input synchronously. Form Nodes
preserves early native listener ordering using public APIs, with temporary constructor-time
registrations on native hosts until initialization resolves the transport.

### Custom control event ordering

The directive declares Angular host listeners for the custom-control contract outputs
`valueChange`, `checkedChange`, and `touch`. Angular connects those listeners during view creation
before consumer template handlers, without asking for the component during directive construction.
Only the selected custom adapter supplies their callbacks. Its metadata chooses either the value
or checked transport, including model/input aliases; unsupported output names remain inactive.
A `touch` hook without a declared `touch` output retains its direct subscription for compatibility.

With immediate updates, the corresponding template output handler sees the new node value, parent
composition, dirty state, and synchronous validation. The `touch` handler sees touched state and
blur-debounce flushing. This also holds when a custom component injects `FORM_NODE` or the concrete
directive during construction. Token identity is unchanged; no cyclic-injection recovery or
constructor-time component discovery is needed. Configured debounce still leaves committed values
pending, and `value.control()` exposes the pending representation. Rebinding uses the current node.
Consumer resets inside handlers are not overwritten by a second transport subscription.

The three host listeners exist on all bindings, but native, CVA, and pass-through adapters never
activate their callbacks. Native DOM events with those names are ignored instead of being treated
as Angular output payloads. Only the selected custom output changes state; sibling output names
cannot take over its transport. Angular removes host output listeners on destruction, and the
binding clears its callbacks. Disabled experimental pairs retain their no-write behavior.

NgControl remains lazy and shares the selected accessor and concrete binding state. CVA callbacks
remain synchronous: an event emitted after `onChange` sees the update, subject to configured
debounce; an event emitted before it cannot see a value not yet delivered to the form engine.
That component-owned order also applies to Angular Reactive Forms. Construction-time outputs
before binding initialization are not treated as user interaction.

Reference: Angular `22.1.x`, commit `05a05f59657f048a87f3d4eb9ddb7968cfe8060e`,
`packages/forms/signals/src/directive/control_custom.ts`, `control_cva.ts`, and `form_field.ts`,
with custom-model and CVA coverage in `packages/forms/signals/test/web/form_field.spec.ts` and
`interop.spec.ts`. Angular uses its internal `ControlDirectiveHost` creation hook for model and
touch transport. Form Nodes uses public Angular host listeners and component metadata to preserve
that ordering on both supported Angular majors, accepting inactive contract listeners on other
hosts instead of relying on Angular internals.

### Native parse errors

Native controls parse their raw UI state before calling `value.control.set()`. If the browser reports
`ValidityState.badInput`, or a numeric model is bound to a text input containing a non-numeric value,
the field receives an external validation error with `kind: 'parse'`. The failed raw value remains in
the DOM so the user can correct it, while both `value()` and `value.control()` retain their last valid
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

Native `input`, `select`, and `textarea` elements still require a `field()` because they edit scalar control representations. Aggregate nodes are accepted only through custom signal controls or CVAs capable of representing their complete object or array value. Forms and arrays expose that direct control representation through `value.control()` signals and may debounce it independently, without composing pending descendant control buffers.

The architecture follows Angular 22 Signal Forms `FormField`, `FormValueControl`, and `FormCheckboxControl` behavior as inspected at tag `22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`), especially `packages/forms/signals/src/directive/form_field.ts`, `packages/forms/signals/src/directive/form_field_spec.ts`, `packages/forms/signals/src/api/types.ts`, and the binding selection in `packages/forms/signals/src/field/node.ts`. `[formNode]` reproduces the pass-through result without depending on Angular's internal control-creation hook: component wrappers are discovered through the public `getDebugNode()` and `reflectComponentType()` APIs, while directives opt in through `provideFormNodePassThrough()`. Its signal-control integration remains independent and uses the same public discovery APIs. Signal interoperability remains a directive concern and does not change field semantics.

Updating component inputs first resolves aliases, property names, signal-input flags, and decorator transforms through public `reflectComponentType()` metadata. The isolated adapter then finds an input signal's node structurally through its own symbols, without importing Angular's private `ɵSIGNAL` or `ɵInputSignalNode` exports. When the component definition supplies `ɵcmp.setInput`, the adapter delegates to it so Angular's `ngOnChanges` bookkeeping is preserved; otherwise it applies the signal write or decorator-input assignment directly. Every successful write calls public `ChangeDetectorRef.markForCheck()`. The private input-node and component-definition access lives only under `form-node/ng-internals` and remains covered by JIT, full-AOT, server-rendering, hydration, OnPush, and real-Chromium tests.

Every private lookup and write is guarded independently. If Angular changes `ɵcmp.setInput`, Form Nodes
falls back to the smaller input-signal writer. If signal-node discovery or
`applyValueToInputSignal()` is no longer compatible, that optional state-input write is skipped
without breaking value synchronization, control events, or the bound form node. Consumer-authored
input transforms remain outside this compatibility suppression and continue to surface their own
errors normally.

In development mode, the first skipped write for each control instance and input name emits one descriptive console
warning; subsequent reactive attempts do not repeat it. The warning confirms that the control
remains connected and recommends `useFormNodeState()` as the stable way to consume bound state
without writable state inputs, unless the component already consumes that facade. It also mentions
`ControlValueAccessor` as an alternative for value and disabled interoperability, not as a
replacement for `readonly`, `required`, errors, or the rest of the optional state surface.

This adapter is intentionally a temporary compatibility boundary. Angular's relevant implementation is `packages/core/src/render3/instructions/write_to_directive_input.ts`, `packages/core/src/render3/features/ng_onchanges_feature.ts`, `packages/core/src/render3/apply_value_input_field.ts`, and `packages/core/src/render3/component_ref.ts`. Neither the structurally discovered input node, its `applyValueToInputSignal()` method, nor `ɵcmp.setInput` is covered by Angular's public compatibility guarantees.

Angular 22.1.5 exposes `ComponentRef.setInput()` publicly, but a directive on an existing component host has no public API for obtaining that `ComponentRef`. Public `getDebugNode()` safely exposes the component instance, not arbitrary directive or host-directive instances and not a supported input writer. Its component discovery is covered separately in a production-mode Chromium process using a component compiled with full AOT, so the automatic path does not rely on development-mode debug metadata. Signal-control discovery is therefore intentionally limited to components. Every Angular upgrade must re-evaluate whether public APIs can replace the input writer. Consumers that want to avoid the input-writing compatibility boundary can call `useFormNodeState()` in the custom component and read its normalized signals instead.

### Universal form node state

The facade's `value()` reports current committed binding data. For `[formNode]`, it reads the
node's internal `_value`, so public equality cannot hide committed changes from a custom control.
It does not report pending debounce input; that remains in the control's `model()` and the node's
`value.control()`. Error/validation signals still follow the node's exposed-value validation rules.
The `[formField]` adapter reads Angular's own committed `FieldState.value`, and AbstractControl
adapters read their source control values. Those are external forms APIs, not Form Nodes public reads
that should be rewritten to `_value`.

`useFormNodeState<TValue>()` returns a read-only `ControlState<TValue>` facade from a custom-control component's injection context. Each source adapter lives in its own file and owns the complete translation from its source into the common signal model, including source-specific defaults and normalization. The main facade only selects the first connected adapter and forwards its signals; it contains no source-specific state mapping. Its explicit precedence is `[formNode]`, `[formField]`, `[formControl]`, `formControlName`, then `ngModel`. The `[formNode]` adapter rendezvous through the shared host element without injecting `_FormNode` during component construction. The `[formField]` adapter resolves Angular's public same-host `FORM_FIELD` token after rendering and forwards its `FieldState` signals. The `[formControl]`, `formControlName`, and `ngModel` adapters resolve their concrete same-host `NgControl` after rendering, avoiding CVA construction cycles, observe the public `AbstractControl.events` stream, and reconcile directive/control identity and silent state changes after each browser render. Replacing a bound `FormControl` unsubscribes the previous control. Silent `{ emitEvent: false }` mutations become visible on the next render rather than synchronously. Every adapter cleans up through `DestroyRef`.

The implemented sources are `'formNode'`, `'formField'`, `'formControl'`, `'formControlName'`, and `'ngModel'`. Every state member is a signal. Angular Signal Forms supplies the complete state surface, while `AbstractControl` sources supply value, disabled, dirty, touched, invalid, pending, normalized errors, and directive names where applicable. State unavailable from `AbstractControl`—such as readonly, hidden, and disabled reasons—keeps the same neutral defaults used while disconnected. Reactive Forms `ValidationErrors` record entries become individual `{ kind, ...details }` objects; `true` becomes `{ kind }`, while primitive payloads use `{ kind, value }`. Errors never expose Angular's `fieldTree` or `formField` references. Disabled reasons are normalized to source-neutral `{ message? }` objects instead of exposing Form Nodes `sourceNode` or Angular `fieldTree` references. Unnamed active reasons are preserved as `{}`; only `[]` means that no reason is known.

Render-discovered adapters remain safely disconnected during server rendering and connect during the first browser render, including hydration. Their neutral signals make this transition safe. `[formNode]` uses its synchronous host registry and can already be connected during server rendering.

`markAsTouched()` delegates to the active source's native operation. It marks the Form Nodes or Angular Signal Forms field using that engine's normal descendant propagation, and marks the active `AbstractControl` for Reactive Forms or `ngModel`. Calling it while disconnected is a no-op.

The facade otherwise remains read-only. User value changes travel through the custom control's
`model()`, `FormValueControl`, or `ControlValueAccessor` integration, while programmatic mutations
remain owned by the source forms API. `ControlState` therefore does not duplicate `setValue()`,
reset, availability, or validation operations.

## Internal structural behavior

### Internal value-read audit

Audited all runtime folders under `src/lib`, using both a text search for value references and
TypeScript type inspection of callable node reads. Value identifiers in primitive arguments,
plain-data utilities, descriptors, metadata, DOM controls, and third-party control APIs are not
Form Nodes node-value reads. The relevant routing is:

| Consumer | Intended value source |
| --- | --- |
| Internal aggregate computations and array `trackBy` matching | Child `$api._value()`. |
| Control-buffer baseline/invalidation and field commits/reset | Internal class `value`, exposed across nodes as `$api._value`. |
| Angular adapter model initialization, synchronization, and bound-control reset | `$api._value()`. |
| `useFormNodeState()` for a Form Nodes `[formNode]` binding | `$api._value()`, independently of exposed equality. |
| Native controls, signal control models, and CVA rendering/validation | `_controlValue()` (or equivalent field `value.control()`), including pending input. |
| Public aggregate construction, built-in/custom validators, metadata contexts, submit, and update callbacks | Exposed values, intentionally respecting public equality. |
| Array-template/definition cloning | Captured initial values and definition recipes; no current node-value read. |

The audit found and corrected the `[formNode]` form-node-state adapter's public callable read.
Remaining direct callable reads in runtime infrastructure construct the public form/group and
array aggregates. Angular reference: `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`),
`packages/forms/signals/src/field/node.ts`, `util/deep_signal.ts`, and the deep-signal and debounce
node tests. These establish the distinction between current committed values and pending control
input; Form Nodes additionally supports an independent equality-filtered public representation.

### Node structure

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

### Development diagnostics

All Form Nodes `console.warn` diagnostics go through the internal `warnInDevMode()` helper,
which uses Angular's public `isDevMode()` and requires no injection context. This covers ignored
form/group keys, extra array patch indexes, unsupported adapter reset options, hidden rendered
nodes, and failed custom-control input synchronization. Production mode suppresses these
warnings without changing the associated operation, validation, cleanup, or existing warning
frequency in development. The hidden-node diagnostic still avoids installing its watcher in
production. This does not intercept Angular, application, or other dependency console output.

Reference: Angular `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`), re-resolved as
latest stable Angular 22. `packages/core/src/util/is_dev_mode.ts` defines development as the
default and production through `enableProdMode()` or the optimized Angular CLI build. Existing
Signal Forms interop ownership and node state behavior remain unchanged. Tests cover development
warnings without DI, production-mode helper suppression, and actual form/group/array/reset/input
warning paths in the separate production Chromium process.


## Optional custom-control state inputs

`provideFormNodesConfig({ syncInputs: false })` disables matching state and constraint
input writes by `[formNode]` for custom signal controls and CVA components.
With no provider, synchronization uses the global setting, whose library default is false. This option inherits independently
from classes and messages; omitted options preserve their nearest explicit provider.
Provider/global fallback is captured at connection time. Rebinding resolves the new node's own mode and initial declarations before using that fallback.
Input discovery still records public names and aliases so native fallback does not overwrite
a custom control's own input channels. The effect observes rebinding but skips state reads and
optional writes while the effective mode is disabled. Model value/checked, optional node access, touch, focus, reset, native state,
and CVA `setDisabledState()` retain their existing behavior. Node state and validation do not
change merely because the corresponding UI inputs are owned by the consumer.

This is an intentional experimental opt-in boundary compared with Angular 22 `v22.1.5`
(`468b65b74566537456c192ac4281795c5a1e1a5e`), whose
`packages/forms/signals/src/directive/control_custom.ts` synchronizes recognized state inputs
and whose `test/web/form_field.spec.ts` covers that propagation. Angular synchronizes inputs
by default; Form Nodes intentionally does not.
This provider does not configure Angular's own directives.


## Direct NgControl registration and legacy state hooks

A `NgControl.valueAccessor` assigned during component construction takes precedence over
`NG_VALUE_ACCESSOR` discovery at `[formNode]` initialization. The existing CVA connection owns
value transport, touched/debounce behavior, disabled callbacks, rebinding, and destruction.
The direct assignment must happen before initialization; later replacements are not connected.
Control-originated edits do not echo through `writeValue()`.

For method-wrapping observers with untracked data reads, the adapter invokes its otherwise
non-validating `updateValueAndValidity()` boundary during reactive node-state synchronization.
This lets wrappers invalidate data caches without adding control events, restarting validators,
or changing synchronous node behavior. Reactive `_status`, `_touched`, and `_pristine` computeds
support the supplied legacy state-observation pattern; they are not public node APIs.
The adapter remains partial: hook options that require dynamic Angular `addValidators()` or
`addAsyncValidators()` are not supported. Validators remain node-owned. A helper that skips the
touched callback once touched must remove that guard for repeated blur-debounced edits.

Reference: Angular `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`), refreshed for this
change. Inspected `packages/forms/src/model/abstract_model.ts` for internal status/interaction
signals, `packages/forms/src/directives/ng_control.ts` and `directives/shared.ts` for accessor
ownership, and `packages/forms/signals/test/web/reactive_fvc.spec.ts` for disabled propagation.
Unlike Angular's real `FormControl`, the adapter's notification boundary performs no validation.

## Angular signal interoperability

Fields, forms, groups, and arrays implement `Signal<T>` for their exposed committed value and
are recognized by Angular `isSignal()`. Their callable surface uses the existing exposed computed
signal (with the array proxy preserving symbol access), so dependency tracking, configured equality,
commit timing, reset, and parent aggregation retain their existing semantics. No additional injection
context is required. Effect-based consumers retain Angular's own injection requirements. This does
not promise the complete `WritableSignal<T>` interface.

Reference: Angular `v22.1.5`, commit `468b65b74566537456c192ac4281795c5a1e1a5e`,
`packages/core/src/render3/reactivity/api.ts` and `packages/core/test/signals/is_signal_spec.ts`
define the signal identity contract. Signal Forms' `packages/forms/signals/src/field/proxy.ts` and
`packages/forms/signals/test/node/field_node.spec.ts` distinguish tree access from value tracking.
Unlike Angular's field tree, calling a Form Nodes node reads its value directly; signal compatibility
is a deliberate public API difference, not a change to validation or state propagation.

## Immediate-child iteration

`form()` and `group()` expose `forEachChild(callback, options?)`, returning `void`. Without options,
or with includeDynamic false, it snapshots only initially declared immediate children. The
callback receives their concrete union and a string key. With `{ includeDynamic: true }`, it
includes declared and dynamically added nodes and the callback receives `DynamicNode`. A runtime
boolean also uses `DynamicNode`, since added nodes may be included. These rules apply equally to
root and nested forms, explicit and shorthand groups, and their collision-safe API aliases.

Snapshots retain object-entry order after filtering, without descending into groups, forms, or
arrays. Additions during iteration are deferred to the next opted-in call; removals do not remove
nodes from the current snapshot. Callback exceptions propagate and stop iteration. A child named
`forEachChild` takes precedence on the direct surface; `$api.forEachChild()` remains available.

Iteration tracks the structure version and the callback's own signal reads, but does not read
child values or alter validation, state, or ownership by itself. Callback operations retain their
normal propagation rules. An empty declaration performs no default callbacks even after add();
its default callback child type is DynamicNode. Opting in visits its added children as DynamicNode. The children
map and Object.values(children) still include all runtime children with their existing types.

Reference: Angular `v22.1.5`, commit `468b65b74566537456c192ac4281795c5a1e1a5e`,
`packages/forms/signals/src/field/structure.ts` (`children()`) returns an immediate-child list;
`packages/forms/signals/test/node/field_node.spec.ts` covers reactive child access and removal
from aggregates. The public callback API and its snapshot mutation semantics are Form Nodes
API decisions; they do not reproduce an Angular public method. The latest maintenance tag was
rechecked for this change. Filtering uses the existing dynamic-key ownership classification;
attachment, removal, aggregate values, validation, and descendant state propagation are unchanged.

## Runtime child map typing

The public `children` map combines precisely typed declared properties with a readonly string
index signature of `DynamicNode`. Known keys such as `children.name` keep their exact node and
parent types. Arbitrary keys such as `children.nonExisting` or `children[key]` are supported;
with `noUncheckedIndexedAccess`, their type includes `undefined`. `get(key)` always returns
`DynamicNode | undefined`, independently of that compiler option. `DynamicFormChildren` remains
available as an explicit map type whose index signature always includes `undefined`.

`Object.values(children)` includes `DynamicNode` in its inferred element type and may retain
concrete declared-node alternatives. It no longer promises only the declared child union, since
runtime enumeration includes added nodes. Use `forEachChild()` without dynamic inclusion for
that exact declared-child union; `{ includeDynamic: true }` visits all immediate children with
`DynamicNode` callbacks. Adding and removing children does not widen known properties or expose
unknown names directly on the form or group itself. Runtime contents, validation, and state
propagation are unchanged.

Reference inspected: Angular `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`),
`packages/forms/signals/src/field/structure.ts` (`children()`) and
`packages/forms/signals/test/node/field_node.spec.ts` (removed children). This dictionary's
public TypeScript shape and the declared-child iteration distinction are Form Nodes API choices.

## Error and validator presence queries

All primitive nodes, their public API aliases, and dynamically retrieved nodes expose
`hasError(kind)` and `hasValidator(validator)`. `hasError` checks the current local `errors()` by
kind, not descendant `allErrors()`. It includes async and external errors when they appear there,
and follows existing disabled/hidden filtering and async completion/cancellation semantics.
`hasValidator` without resolution checks the normalized directly registered list by function reference, including
async functions. It does not execute validators, inspect composed return values, search children,
or inspect external control validators. Passing, disabled, pending, and conditionally skipped
validators remain registered until `setValidators()` replaces them.

Both queries memoize with a bounded 20-argument cache and track the underlying error/list signal.
Callbacks in reactive consumers observe boolean transitions; neither query imperatively changes node state.
Factory instances compare by identity, so retain the original function for later lookup.
Child-name collisions retain the ordinary `$api` escape hatch.

Reference: Angular `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`), Signal Forms
`packages/forms/signals/src/api/types.ts` defines local `getError` semantics. Its
`packages/forms/signals/src/controls/interop_ng_control.ts` only implements a required-validator
compatibility special case, not general validator registration queries. Form Nodes deliberately
provides general identity-based lookup, comparable to the factory-reference tests in
`packages/forms/test/form_control_spec.ts`. It searches its unified sync/async registry rather
than Angular Reactive Forms' separate lists.

`forEachChild()` preserves the concrete parent types of declared children for both forms and groups.
The union is inferred without `undefined`. Mixed string and number fields expose a union of values
on reads, but writes must be accepted by every possible member: `set('')` is rejected when a numeric
field may be visited. Homogeneous string fields can all accept `set('')`. Explicit dynamic inclusion
widens the callback to DynamicNode, matching the additional nodes that can be visited.

## Empty-declaration enumeration types

When the declared child key set is empty, forms and groups expose `children` as a readonly
string-keyed `DynamicNode` map. This yields `DynamicNode[]` for `Object.values(children)`, without
`undefined`. Default forEachChild iteration visits no declared children and has a DynamicNode callback
child type; `{ includeDynamic: true }` visits added children with a DynamicNode callback.
Nonempty declarations preserve their concrete child union for default iteration. This is determined statically and applies to nested nodes and configured
factories; adding or removing runtime children does not change the chosen type. `get(key)` remains
optional, direct dynamic properties remain unsupported, and `add()` retains its exact return type.
The value shape, map enumeration, lookup, and attachment behavior remain unchanged.
Reference rechecked: Angular `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`),
`packages/forms/signals/src/field/structure.ts` (`children()`) and
`packages/forms/signals/test/node/field_node.spec.ts` (empty-object aggregation).
The `DynamicNode` fallback and declared-versus-added iteration selection are Form Nodes public API choices.

## Explicit validator resolution queries

`validators` keeps its `Signal<Validators<T>>` identity and no-argument registered-list read, and
adds a `{ resolve?: boolean }` call overload. `hasValidator` accepts the same optional second
argument. Omitted or false resolution never runs validators. True resolution follows returned
synchronous functions and function arrays recursively and returns only final function references,
with declaration order and duplicates preserved. Successful functions, including functions returning
null, undefined, or arrays without functions, remain leaves. This does not infer active constraints,
unwrap functions called internally by wrappers, search descendants, or inspect external controls.
Factories are still compared by exact returned-function identity.

The synchronous runner records leaf references alongside its errors and metadata. A shared lazy
computed evaluation serves normal validation and explicit resolution; reading either order does
not repeat validators until a tracked dependency or interaction boundary changes. Resolved presence
queries memoize by validator identity and normalized boolean resolution mode, rather than options
object identity. Registered-list reads track only registration; resolved reads also track the node
value and whatever dependencies validator execution actually reads.

Explicit inspection resolves even noninteractive nodes on demand, without changing their ordinary
suppressed errors, validity, or interaction state. Normal validation still skips hidden, disabled,
and readonly nodes. Registered async validators are included without executing, cancelling, or
restarting async work. Nested async validators, circular/deep compositions, thrown exceptions, and
mixed error/function arrays retain the synchronous runner's existing rejection behavior.

Reference reviewed: latest Angular 22 maintenance tag `v22.1.5`, commit
`468b65b74566537456c192ac4281795c5a1e1a5e`. Inspected
`packages/forms/signals/src/field/validation.ts`, its node validation-status and hidden/readonly
API tests, and `packages/forms/signals/src/controls/interop_ng_control.ts`. Angular's interop
hasValidator only special-cases required metadata and offers no general resolved-validator list.
Explicit resolution is a Form Nodes API extension; on-demand evaluation for inspection does not
change Angular-comparable normal validation suppression or parent aggregation rules.

## Unified Angular configuration provider

`provideFormNodesConfig({ validatorMessages, classes, syncInputs })` and `FormNodesConfig`
replace the two previous provider functions and the singular config type. The helper returns
ordinary `Provider[]`, supporting application, route, NgModule, and component injectors.

Each of the three options uses an independent token. Omitting an option (or passing `undefined`)
preserves its inherited provider. Explicit `classes` replace only the class map without merging;
explicit `syncInputs` changes only synchronization. With no provider, each binding option uses its global setting, then the library default
(an empty class map or disabled synchronization). An empty configuration registers nothing;
`{ classes: {} }` clears only classes. Multiple calls within one injector follow the same per-option
rule, with the last explicit registration winning. Native controls, value binding, interaction
hooks, node validation, and captured message catalogs retain their existing behavior.
Providing a message catalog does not merge it with a parent injector's catalog.

The message factory executes once on first provider resolution in an injection context. Selected
message callbacks remain reactive; the factory itself is not a computed callback. Nodes capture
provider messages at creation, through their explicit injector or current injection context.
Later binding adoption does not replace that catalog. Existing node-local and ancestor-node
message fallback, global fallback, and built-in defaults retain their precedence. No provider is
required for synchronous node operations or explicitly triggered asynchronous validation outside DI.

Reference inspected: Angular `v22.1.5`, commit
`468b65b74566537456c192ac4281795c5a1e1a5e`, `packages/forms/signals/src/api/di.ts` and
`packages/forms/signals/test/web/form_field.spec.ts` configuration tests. Angular's binding provider
also returns ordinary providers. Form Nodes intentionally adds its own message catalog section;
Angular's configuration tokens remain independent.

### Object catalogs in the unified provider

`FormNodesConfig.validatorMessages` accepts `ValidatorMessages | (() => ValidatorMessages) | null`.
A direct catalog is registered with `useValue`; a factory retains `useFactory` and its injection
context. Both forms use the same token, capture at node creation, precedence, and reactive message
callbacks. Omitting the option still inherits the provider catalog. Supplying `{}` installs an
empty catalog, preserving normal ancestor-node, global, and built-in fallback.

Checked against Angular `v22.1.5` configuration implementation and configuration tests cited above.
Angular's configuration provider uses `useValue`; Form Nodes' message catalog remains an additional
library feature with factory support.

### Resetting individual provider options

All three `provideFormNodesConfig()` options accept `null` to install that option's default in
the current injector. `classes: null` registers an empty class map; `syncInputs: null`
registers false; `validatorMessages: null` registers an empty catalog. These are explicit providers,
so they shadow the same option in ancestor injectors and override earlier registrations in the
same injector. Omission and `undefined` still inherit without registering a provider.

A message reset does not force built-in wording. Node-local and form-tree catalogs, catalogs
captured by ancestor nodes, and global messages still resolve as before. The overridden injector
catalog is not resolved merely to supply the empty catalog. Existing nodes retain their captured
catalogs; new nodes capture the reset catalog. Message callbacks in applicable fallback catalogs
remain reactive. Factory return types remain catalogs; null is supported on the option itself.

Angular reference remains `v22.1.5`, `packages/forms/signals/src/api/di.ts` and configuration tests
in `packages/forms/signals/test/web/form_field.spec.ts`. Explicit null reset semantics are a
Form Nodes API addition; the underlying Angular binding state transitions remain unchanged.

## Process-wide Form Nodes configuration

`configureGlobalFormNodes()` and `GlobalFormNodesConfig` replace the message-only global setter.
Each option updates independently; omission and undefined preserve current global values. Null
resets only that option to an empty class map, disabled synchronization, or an empty message catalog.
Explicit maps replace rather than merge. The global setter is safe outside Angular DI.

Binding precedence is nearest explicit option provider, then global option, then library default.
Provider null class/synchronization options bypass the global setting. Provider null messages
supply an empty catalog but preserve node-tree and global fallback. Node-local and captured
provider message precedence is unchanged.

Global class maps are captured at directive creation and provider/global input synchronization at control
connection. Changing or restoring global settings does not reconnect existing controls or replace
existing class effects. Captured class predicates keep their signal dependencies. Global message
sources and selected callbacks remain reactive for existing and new failing nodes. Global sources
are not DI factories; the setter does not establish an injection context.

Every configuration call returns an idempotent per-option cleanup. Removing an older registration
does not overwrite a newer one; when newer registrations are removed, inactive registrations are
skipped. Identity is tracked per registration, including equal primitive values and reused maps.
Global defaults are shared module state; request-scoped values belong in providers or node options.

Reference: Angular v22.1.5, commit 468b65b74566537456c192ac4281795c5a1e1a5e,
packages/forms/signals/src/api/di.ts and configuration tests in
packages/forms/signals/test/web/form_field.spec.ts. Angular configures binding classes through DI;
this process-wide fallback is an intentional Form Nodes extension. Native-control state, model
binding, touch, reset, validation, and injector ownership retain their existing transitions.

## Experimental custom-control binding configuration

`syncInputs` and `bindInputOutputPairs` are independent experimental options on every primitive,
factory defaults, Angular providers, and process-wide configuration. Both default to false.
Each resolves through the node's captured option (including factory defaults), nearest explicit
provider, global fallback captured on connection, then false. Undefined inherits; null/false disables.
A parent node option does not configure descendants. Provider/global changes affect future bindings;
rebinding uses the replacement node's configuration. Lists and objects replace rather than merge.

### Input synchronization

`syncInputs` only copies node state/constraints into matching inputs of an active custom control.
It does not enable a value connection or change validation/propagation. The presets are declared,
all, and signal-controls; true is not accepted. Declared selects initial disabled, readonly, and
hidden options whose values are not undefined, including disabledReasons with disabled. False
counts as an explicit declaration. Validators never select inputs in this preset. All selects
every supported input; signal-controls is shorthand for all inputs targeting real model controls.

Lists select exact public input names regardless of declarations. Objects accept
`{ inputs: 'declared' | 'all' | readonly SyncInputName[], target?: 'all' | 'signal-controls' | 'cva' }`.
Target defaults to all and filters the selected adapter without changing precedence. Directly
assigned NgControl.valueAccessor takes precedence over provided CVAs, then custom controls, then
native controls. A model-bearing CVA still matches cva, not signal-controls. An active pair only
matches all. Empty lists never enable value binding. Disabled in a list does not imply disabledReasons.

Every selection updates reactively. Selected constraints track conditional/reactive metadata and
validator additions/removals, including neutral values. Writes may replace component defaults and
authored bindings. Unselected inputs retain their last values. Inactive pairs receive no state-input
writes even when syncInputs is all. Native DOM state and CVA setDisabledState remain enabled.
Models keep their public value, node reference, touch, focus, and reset connections in every mode.
useFormNodeState reads remain available without optional input writes.

### Paired value connections

`bindInputOutputPairs: true` enables recognized value/valueChange or checked/checkedChange input/output
pairs through the internal writer. CVAs and actual models take precedence and do not consult this
flag for their standard connection. Public aliases, signal inputs, and decorator inputs work.
Pair changes follow pending/committed debounce, dirty state, validation, and parent propagation;
touch commits blur updates. Synchronous writer feedback is suppressed.

False/null/omission without an enabled fallback leaves the complete pair connection inactive:
no value writes, no change/touch processing, no component focus/reset calls, no optional state
writes, and no writable node reference. The node reference is cleared on pause/destroy. Input
values remain unchanged. The host is still recognized, so pausing does not cause an adapter error.
Rebinding back to an enabled node resynchronizes the current control value even if unchanged since
the pause. Destroy unsubscribes outputs. Use initialized value inputs instead of required inputs.

Factory defaults preserve both options independently across template clones and dynamic children.
A node can override either option without resetting the other; provider and global sections follow
the same independent behavior. Global cleanup restores only its registrations and preserves later
changes, skipping registrations already cleaned up. No injection context is needed to declare nodes.

Angular reference: v22.1.5, commit 468b65b74566537456c192ac4281795c5a1e1a5e.
Inspected packages/forms/signals/src/directive/control_custom.ts, control_cva.ts, bindings.ts,
packages/core/src/render3/instructions/control.ts, and the custom model, paired value/checkbox,
state-input, and rebinding tests in packages/forms/signals/test/web/form_field.spec.ts. Angular
connects supported controls and writes recognized state inputs; independent opt-ins, target
filters, declared-only selection, and complete pair suspension are intentional Form Nodes API choices.

### Deferred: subtree binding defaults

A proposed form/group/array option tentatively called globalOptions would configure that node and
its descendants. It is not implemented; naming, precedence, and inheritance remain open. Neither
binding option introduces subtree inheritance.


### Required state from Angular AbstractControl bindings

`useFormNodeState().required()` recognizes directly registered `Validators.required` / `Validators.requiredTrue` and enabled
Angular `RequiredValidator` instances supplied through same-host `NG_VALIDATORS`, including the
checkbox subclass. Directive inputs use Angular's public `booleanAttribute()` normalization, so
an empty attribute is true and false or the string 'false' is false. These sources are combined
with OR; a valid value or disabled control does not erase the rule. No validator functions are
executed to discover metadata. The facade also reports required while its existing normalized own
errors contain the exact kind `required`, including custom, composed, async, and manual errors.
This fallback applies to all supported sources and counts Angular error keys regardless of their
payload, matching `hasError`. It does not aggregate descendant errors; it clears when the error
clears unless metadata still supplies required state. The two semantic `hasValidator(required)`
queries use this same result.

Control events update the state; required presence participates in the post-render snapshot so
silent changes and directive toggles still invalidate it even when value, errors, and status are
unchanged. Rebinding releases the old subscription and follows the replacement. Disconnection
returns the facade's neutral false. Form Nodes `node.required()` and the Signal Forms adapter
retain their existing underlying semantics; the facade adds the error fallback without modifying
the observed Angular control. Error-only required state can disappear after successful validation
or when disabling an Angular control clears its errors.

Reference: Angular v22.1.5 (`468b65b74566537456c192ac4281795c5a1e1a5e`), resolved from release tags.
Inspected `packages/forms/src/model/abstract_model.ts` (`hasValidator`, `_updateHasRequiredValidator`),
`packages/forms/src/directives/validators.ts` (`RequiredValidator`, `CheckboxRequiredValidator`),
and `packages/forms/signals/test/web/reactive_fvc.spec.ts` and `template_fvc.spec.ts`.
The direct-reference check matches Angular's required metadata bridge. This hook additionally
recognizes the standard required directive through its public instance and input rather than
probing Angular's private validator arrays or executing validation.


### Declared model and validator metadata

Model discovery now resolves the public value/valueChange or checked/checkedChange pair through
`reflectComponentType()`. The input must be signal-based and both sides must refer to the same
class property exposing callable/set/subscribe operations. Aliases use that property rather than
assuming the public input name is the member name. Undeclared internal signals and separate
input/output properties cannot become direct model transports; separate pairs retain their
experimental opt-in. Field and form connections retain value, interaction, and rebind semantics.

Angular AbstractControl adapters now collect standard MinValidator, MaxValidator,
MinLengthValidator, MaxLengthValidator, and PatternValidator inputs from same-host NG_VALIDATORS.
Public inputs join the post-render snapshot so constraints change even without different errors
or status. Numeric bounds parse floating strings; length bounds parse integer strings while
numeric inputs retain their values. Null, undefined, and NaN have neutral metadata. Zero is valid.
String patterns get missing anchors, empty patterns are omitted, and RegExp objects are preserved.
Multiple lower bounds use the maximum, upper bounds use the minimum, and patterns accumulate.
Disabling a control retains its declared metadata. No validator is executed for introspection,
and parameters inside factory/composed validators remain unavailable. Angular's standard min/max
directives apply only to number-input hosts; custom tags do not acquire them from attributes alone.

Reference remains Angular v22.1.5, commit 468b65b74566537456c192ac4281795c5a1e1a5e, re-resolved
from release tags. Additional inspected sources: packages/core/src/render3/instructions/control.ts,
packages/forms/src/directives/validators.ts, and packages/forms/src/validators.ts.
Recognizing direct requiredTrue as required metadata deliberately extends Angular's required-only
bridge; the hook describes checkbox obligations as well as empty-value requirements. Node-level
required and validation behavior is unchanged. Strongest-bound reduction is this facade's policy
when multiple standard validator instances contribute to its single numeric signals.


### Error queries on the common control-state facade

`useFormNodeState().hasError(kind)` and `getError(kind)` query the shared normalized `errors()`
signal for every supported binding. Matching is exact and case-sensitive; names are not translated
between forms APIs. `hasError` checks entry presence and `getError` returns the first matching
object by identity, or undefined. Neither query walks descendant paths, collects additional errors,
or explicitly triggers validation. Signal tracking follows the current binding, async error updates,
control replacement, and cleanup; silent Angular control changes follow the existing render snapshot.
Methods can be destructured because they do not depend on their receiver. No binding means false
and undefined. Error payloads are read-only in the public type, with unknown additional properties.

This intentionally differs from Angular AbstractControl: its getError returns the raw payload
(or null when there is no error map), and hasError checks payload truthiness. The common facade
returns the complete normalized object and reports presence even for false, zero, or null payloads.
This follows the existing Form Nodes kind-based query semantics across all sources. It does not
change node validation, error propagation, adapter normalization, or required metadata.

With { resolve: true }, Form Nodes bindings forward to the node's resolved query: synchronous
compositions are evaluated to inspect their final references, reuse validation evaluation, and track
reactive dependencies. Resolution works for fields, forms, and nested forms, including disabled
nodes, and does not start asynchronous validators. Angular AbstractControl bindings retain direct
reference semantics because no public composition-resolution API exists; FormField arbitrary
queries remain undefined. The two required aliases retain semantic required-state behavior
regardless of resolve. Rebinding selects the replacement node's resolution and dependencies.

Reference: Angular v22.1.5, commit 468b65b74566537456c192ac4281795c5a1e1a5e, re-resolved from tags.
Inspected packages/forms/src/model/abstract_model.ts (getError, hasError),
packages/forms/signals/src/api/control.ts, and packages/forms/signals/test/node/field_node.spec.ts
(error-list behavior). Tests exercise field and aggregate Form Nodes, Angular Signal Forms,
Reactive Forms, template-driven forms, asynchronous completion, rebinding, and disconnection.


### Validator queries on the common control-state facade

`useFormNodeState().hasValidator(validator: unknown, options?: { resolve?: boolean })` returns boolean or undefined. The exact
exported Form Nodes required function and Angular Validators.required are semantic aliases for
the active adapter's required() state, including conditional requirements and requiredTrue-based
obligations. Other function arguments delegate to direct reference queries: node.hasValidator()
without resolution by default for Form Nodes, and Angular hasValidator() OR hasAsyncValidator() for
AbstractControl sources. FormField has no arbitrary-reference capability and returns undefined.
No binding and non-function arguments also return undefined. Supported queries return false for
unregistered references, even when they came from a different forms library.

Factory results (including required('Message') and requiredIf()) are not special aliases; a registered
conditional function can be present while inactive. Validators.requiredTrue is an ordinary
reference query. Default queries do not execute validators or resolve compositions. The facade
uses closures so methods can be destructured. Queries track active bindings and validator changes.
Angular snapshots now include the public validator and asyncValidator function references, catching
silent registration changes even when value, errors, status, and constraints remain unchanged.
Normal Angular updateValueAndValidity() remains necessary to update validation results; reading
an async registration never starts async work. Rebinding and destruction release the current source.

With { resolve: true }, Form Nodes bindings forward to the node's resolved query: synchronous
compositions are evaluated to inspect their final references, reuse validation evaluation, and track
reactive dependencies. Resolution works for fields, forms, and nested forms, including disabled
nodes, and does not start asynchronous validators. Angular AbstractControl bindings retain direct
reference semantics because no public composition-resolution API exists; FormField arbitrary
queries remain undefined. The two required aliases retain semantic required-state behavior
regardless of resolve. Rebinding selects the replacement node's resolution and dependencies.

Reference: Angular v22.1.5, commit 468b65b74566537456c192ac4281795c5a1e1a5e, re-resolved from tags.
Inspected packages/forms/src/model/abstract_model.ts (hasValidator, hasAsyncValidator, validator
assignment), packages/forms/test/form_control_spec.ts (reference queries), and
packages/forms/signals/src/controls/interop_ng_control.ts (required metadata bridge).
The facade deliberately extends the required equivalence to Form Nodes' export, combines Angular
sync/async reference queries, and uses undefined for unsupported Signal Forms queries rather than
claiming absence. Node-level hasValidator semantics and validation execution are unchanged.

### Memoized control-state queries

The common facade memoizes hasError, getError, and hasValidator with computedFunction, allowing
20 argument combinations per error query and 32 per validator query. Error queries use the kind;
validator queries use the function reference and options.resolve === true. Fresh options objects and omitted/false resolve
values therefore reuse equivalent queries. Cache eviction affects reuse, not query results.
Each computation tracks the active binding, including replacement and destruction.
Boolean/undefined results use Object.is equality to suppress unchanged downstream computations.
getError also uses reference equality, preserving the current normalized error object rather than
retaining an older shallow-equal object. Resolution and asynchronous execution rules are unchanged.

Reference: Angular v22.1.5, commit 468b65b74566537456c192ac4281795c5a1e1a5e.
Inspected packages/core/primitives/signals/src/computed.ts and
packages/core/test/signals/computed_spec.ts for equality, dependency tracking, and version changes;
packages/forms/signals/src/field/state.ts and controls/interop_ng_control.ts for computed form state
and the required query bridge. Argument-keyed caching is a Form Nodes API choice.

The same shared cache limits apply to FieldNode, ArrayNode, FormGroupNode, and the control-state
facade. Each hasError/getError cache allows 20 distinct error kinds, including absent kinds.
Each hasValidator cache allows 32 reference/resolve combinations, enough for 16 validator
references queried in both modes. Limits are per function per instance, not application-wide.
Entries are allocated on demand; increasing a limit does not preallocate computed signals.
The existing least-recently-used eviction keeps cache ownership bounded; consumers may retain
evicted computations until their dependencies are updated or they become unreachable.
These are internal sizing choices, not Angular behavior requirements. The Angular v22.1.5
computed implementation and equality tests inspected above remain the behavioral reference.


Required error fallback reference: Angular `22.1.x` at
`ef48630a14f0bc8ba0a46d3fc7555c2a29f26a41`, inspected
`packages/forms/signals/src/field/node.ts`, `src/api/rules/validation/required.ts`, and
`test/node/api/validators/required.spec.ts` under `packages/forms/signals`.
Angular distinguishes REQUIRED metadata from validation errors. The common facade's own-error
fallback intentionally extends that metadata-only behavior; it does not register validators.

## Binding value outputs

`[formNode]` exposes typed `formNodeControlValueChange` (immediate parsed control value) and
`formNodeValueChange` (exposed committed node value). Only the selected control adapter initiates
these notifications. Native forms and pass-through bindings do not forward child notifications.
Without debounce, the node and synchronous parent/validation state are updated before either
handler; the control-value output runs first. With debounce, the committed notification runs after
successful completion or an early touch/blur/flush/submission commit, without waiting for async
validation. Each pending edit carries its own completion callback, so replacement, reset,
programmatic writes, and rejected debounce completion cannot notify for cancelled edits. A
notification is suppressed when the originating binding is destroyed or points to a different node.
Programmatic node writes (including public `value.control.set`) do not independently emit outputs.

Native duplicate parsed values do not restart debounce or emit duplicate outputs; Date values are
compared by timestamp and multiple-selection values by their entries. IME buffering and parsing
errors retain their existing behavior. Validity-monitor updates are not output events. Custom/CVA
callbacks retain each transport notification, including equal payloads; callbacks identify the
control-to-model direction but cannot certify physical user input. Model-to-view writes remain
guarded. Output names are separate from the value/checked pair discovery contract.

Reference inspected: Angular `22.1.x` commit `05a05f59657f048a87f3d4eb9ddb7968cfe8060e`,
`packages/forms/signals/src/field/node.ts` (`debounceSync` and synchronization),
`src/directive/control_custom.ts`, `src/directive/control_cva.ts`, and
`src/directive/control_native.ts`, with `test/node/api/debounce.spec.ts` and
`test/web/form_field.spec.ts` under `packages/forms/signals/`. These govern immediate control
updates, deferred committed values, touch flushes, and replacement cancellation. The two public
outputs and native duplicate suppression are library-specific contracts rather than Angular API
parity. Configured public equality can retain an equivalent exposed committed snapshot; control
output payloads still report the current control value.

### Field literal-union IntelliSense

Generic field overloads accepting the value type precede generic overloads accepting only
`undefined`, so TypeScript's language service can suggest literal members while editing an empty
quoted initial value. This applies to `field()`, `field.nullable()`, and configured nullable
factories; strict variants retain their suggestions. Overload ordering changes editor completions
without widening accepted values or changing runtime behavior. Non-generic null/undefined
initialization still infers unknown, and explicit generic undefined initialization retains
undefined in the resulting type. Automated language-service checks exercise both quote styles and
all three argument layouts against source and built package declarations.

## Restoring captured initial values

`resetToInitial()` is a programmatic operation on field, group, form, and array APIs. Existing
`reset()` semantics remain value-preserving, and `reset(value)` remains a one-off value replacement.
Neither loading data nor later programmatic/control writes redefine the captured baseline.
Field baselines are captured on declaration; array-created nodes recapture effective initialization
after provided row data is applied. Form attachment does not rebase existing fields.

Object branches restore current children recursively, including fields dynamically added later;
removed object fields are not recreated. Arrays capture actual initial values after factory and
initialValue initialization and restore count/order with existing index/key reconciliation. Missing
nodes are freshly constructed, then initialized from captured data; generated IDs are not recomputed
as the restored values. Retained nodes keep validators/options and dynamic schema. Restoring a row
alone uses that row's own effective creation baseline; restoring its array uses the array baseline.
Nested arrays inherit initialization supplied through outer records.

Supported snapshot containers are ordinary arrays, plain/null-prototype objects, and standard
Date/Map/Set instances, including cycles and aliases within a value graph. Own descriptors are
copied without invoking accessors. Custom classes/subclasses and other opaque values retain
references; accessors retain external behavior. Frozen/sealed object-wide state is not guaranteed.
Every restoration copies protected supported values again. Cross-field identity is not guaranteed.

Restoration clears subtree dirty/touched and control parsing state, cancels debounce work and its
pending output callbacks, and synchronizes controls via existing reset hooks. It does not emit
formNodeValueChange/formNodeControlValueChange, clear ancestor-owned flags, restore validator or
availability configuration, cancel submissions, or promise validity. Normal reactive validation,
cancellation, and equality behavior applies to restored committed values. Native reset buttons and
binding.reset() continue to use reset(), not resetToInitial(). Outside-injection-context declaration,
synchronous restoration, and explicitly triggered asynchronous validation remain supported.

Angular reference: maintenance branch 22.1.x, commit 05a05f59657f048a87f3d4eb9ddb7968cfe8060e.
Inspected packages/forms/signals/src/field/node.ts reset/_reset and
packages/forms/signals/test/web/form_field.spec.ts reset/parser-reset cases. Angular preserves
committed data when reset() receives no value and clears interaction/parser state. Captured initial
restoration is an additional Form Nodes API, not a change to that existing reset behavior.

## Nested public value signals

`value` is a `NodeValueSignal<TValue, TSet>` on every node kind. Its call retains exposed equality
semantics. `value.committed()` reads raw committed data recursively, bypassing configured node and
child equality without bypassing debounce. `value.control()` reads the node's own pending buffer
or raw committed value; aggregate reads do not compose pending child drafts. Normal Angular signal
identity checks apply to every view. The views are reactive and have stable identities.

`value.committed.set()` delegates to the existing complete `set()` operation, cancelling pending
input and preserving interaction state. `value.control.set()` receives complete control input,
marks the selected node dirty even for equal input, preserves touched state, and applies inherited
or configured debounce. Aggregate normalization and committed validation/propagation remain the
same. Setters do not emit binding outputs by themselves. Public `controlValue`/`setControlValue`
are removed; internal control transport retains its private API. `$api.value` handles collisions.

Reference inspected: Angular `22.1.x`, commit `05a05f59657f048a87f3d4eb9ddb7968cfe8060e`,
`packages/forms/signals/src/field/node.ts` (control setter, dirty marking, debounce/sync) and
`packages/forms/signals/test/node/api/debounce.spec.ts` (immediate input, delayed commit, touch).
The nested naming and separate pre-equality committed view are Form Nodes public API choices.

The nested value facade and both nested signals intersect `HiddenFunctionMembers`: completion
lists expose `committed`/`control` on `value` and `set` on each nested view, while preserving
Angular signal assignability and call signatures. This affects public typing only. An explicit
bare `FieldNode` annotation retains all views and setters with `any` values; a supplied value
generic retains precise read/write types. Language-service tests verify the completion lists
against both source and packaged declarations.

## Submission history and closest-form injection

Each explicit `form()` exposes readonly `submitted: Signal<boolean>`. The flag starts false and
is set synchronously at the start of `submit()`, before concurrency, action, and validation guards.
It records an attempt, including invalid, missing-action, and concurrent attempts, not success.
The existing return value, rejection, touched propagation, debounce flushing, and validation policy
of `submit()` remain unchanged. `submitted` is not filtered by disabled/readonly/hidden state and
is not inherited or aggregated. Nested forms record only their own direct attempts. `submitting`
continues to describe an active action and remains inherited as before.

`reset()`, `reset(value)`, and `resetToInitial()` clear history on the selected form and descendant
forms, including forms reached through groups and arrays. Field-only resets do not clear ancestors.
Value writes and action completion or rejection preserve history. Resetting during an action does
not cancel the action; its finalization does not set history again. A subsequent attempt after reset
sets the flag again even when concurrency blocks its action. Fresh clones/items start false. The
property is form-only; use `$api.submitted()` for a form with a child named `submitted`.

`useClosestForm()` requires an injection context and returns a `Signal<CallableNodeApi<FormApi<any>> | null>`.
It injects the nearest `FORM_NODE` once with optional resolution, including the current host, then
reactively resolves `binding.node().$api.form()?.$api`. It follows rebinding, attachment, detachment, and
reparenting. Forms return their callable API; unowned nodes and missing bindings return null. A nearest
unowned binding prevents fallback to farther bindings. Angular DI boundaries apply; this is not
DOM traversal, HTML form-owner lookup, or NgForm compatibility. The signal must not be read before
the binding's required input is initialized. Components created after an attempt observe existing
history without an event replay or subscription. Binding scope and the model tree can differ;
a separately supplied node input does not change the hook's chosen binding.

Angular reference: `22.1.x` at `05a05f59657f048a87f3d4eb9ddb7968cfe8060e`.
Inspected `packages/forms/signals/src/directive/form_root.ts`,
`packages/forms/signals/src/field/submit.ts`, and tests
`packages/forms/signals/test/node/form_root.spec.ts` and `node/submit.spec.ts` for submission action,
concurrency, and inherited in-progress state. Those Signal Forms facilities do not supply this
persistent attempt flag. Its semantics are an intentional additional Form Nodes feature inspired
by `packages/forms/src/directives/ng_form.ts`: onSubmit sets submitted before emitting ngSubmit,
and resetForm clears it. Unlike NgForm's directive-owned flag, ours belongs to the model and works
without Angular DI or a native form. Existing no-action submission behavior also differs from
FormRoot: Form Nodes marks touched even without an action, and now records the attempt as well.

## Callable collision-safe APIs

Every node's `$api` is a separate Angular signal facade enriched with the node API and internal
underscore-prefixed transport methods. `api` aliases the same facade unless shadowed by a child.
Calls delegate to the exposed `value` signal, retaining public equality, debounce, validation,
and aggregate composition semantics. The facade has stable identity, is not marked as a node,
and does not expose direct children. Children cannot overwrite its operations; array `length`
is installed as a signal through property descriptors rather than assigning to the function's
non-writable built-in property. `CallableNodeApi<TApi>` preserves read types and hides native
function members on concrete views. Common AnyNode APIs stay structurally callable to accept both
ordinary APIs and arrays whose `length` overrides the native function property.

`useClosestForm()` now returns the owning form's callable API rather than its collision-prone node.
Consumers read history with `closest()?.submitted()` and values with `closest()?.()`. Ownership,
rebinding, initialization, and null-resolution rules are unchanged. Unlike Angular Signal Forms'
field tree API, this callable API facade is a Form Nodes public design choice; no underlying
submission or state propagation rules change.

## Native submission outputs

`formNodeSubmit` and `formNodeSubmitBlocked` are binding outputs for native form hosts bound to
form() nodes. The attempt sets submitted, touches interactive descendants, flushes pending values,
and emits `{ value, form, event }` before checking submitWhen and invoking the declared action.
The value uses the exposed snapshot, including public equality. The blocked output follows the
attempt when validation rejects it, including pending state under 'valid', even without onSubmit.
The declaration's onSubmitBlocked retains its action-required contract. Concurrent attempts flush
pending values and emit attempts only; they do not touch the already submitting subtree again,
emit validation-blocked notifications, or run another action. Reentrant submit calls during
preparation cannot duplicate actions. Programmatic submissions do not emit binding outputs.
Group bindings retain touch/flush/reset behavior without submission outputs. Async output listeners
are not awaited. Synchronous listeners can affect the later validation gate; payloads retain the
snapshot taken before notification. Form-level history and reset propagation remain unchanged.

Reference: Angular 22.1.x at 05a05f59657f048a87f3d4eb9ddb7968cfe8060e,
packages/forms/signals/src/directive/form_root.ts and packages/forms/signals/test/node/form_root.spec.ts,
packages/forms/signals/test/node/submit.spec.ts (validation gates, concurrency, touched descendants),
and packages/forms/src/directives/ng_form.ts with template_integration_spec.ts (ngSubmit ordering).
Signal Forms FormRoot delegates to configured submit options and has no matching output; these
outputs are an intentional public API extension. NgForm provides the precedent for notifying native
attempts after state preparation. Our submitWhen modes and template blocked output retain the
library's explicitly documented validation semantics.
