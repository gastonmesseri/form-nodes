# Behavior reference

This document records the behavior currently implemented by the library. It is an evolving specification and the source material for future user-facing documentation.

The internal state model is inspired by Angular 22 Signal Forms. The current reference baseline is Angular `22.1.x` at commit `004cf3a27734ae90738a0a745cc0369b52306ca3`. Public names and signatures intentionally belong to this library and do not attempt to reproduce Angular's API.

Both `field()` and `form()` expose their public API members directly on the returned callable node. The complete API also remains available through `.api`:

```ts
const profile = form({ age: field(23) });

profile.disabled();
profile.disable();
profile.patch({ age: 30 });
profile.api.disabled();
```

A form also exposes its children as direct properties. When a child name collides with a direct API member, the child always wins in both runtime behavior and TypeScript. Use `.api` to access the form member in that case:

```ts
const profile = form({
  age: field(23),
  readonly: field(false),
});

profile.readonly(); // value of the nested field
profile.api.readonly(); // readonly state of the form
```

Every form also exposes a stable, readonly `children` map for explicit tree navigation. Its entries are the same node instances exposed directly on the form, and nested forms provide their own `children` map:

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

profile.children(); // value of the child field
profile.api.children.children(); // value of the same child field
```

Native function members such as `name`, `apply`, `arguments`, `call`, and `length` are hidden from the public `field()` and `form()` types. If a form declares a child with one of those names, that child is intentionally exposed instead and takes precedence in both TypeScript and runtime behavior:

```ts
const example = form({
  name: field('profile'),
  apply: field('value'),
});

example.name(); // 'profile'
example.apply(); // 'value'
```

## Design guarantees

- The library provides small, typed, signal-based `field()` and `form()` primitives.
- `field()` and `form()` can be created and used anywhere without an Angular injection context.
- Synchronous behavior and node-driven asynchronous validation do not require dependency injection.
- Asynchronous validators always use an Angular reactive watcher, including outside an injection context.
- Signals expose reactive state while actions are declared as methods in public types, allowing editors to distinguish state from behavior in IntelliSense.
- Values remain programmatically readable and writable regardless of disabled, readonly, or hidden state.

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
- `form()` and the `Form`, `FormApi`, `FormOptions`, `FormValue`, `FormSet`, and `FormPatch` types.
- The `ValidationError`, `ValidationResult`, `ValidationSuccess`, `ValidationStatus`, `Validator`, and `Validators` types.
- `asyncValidator()` and its `AsyncValidator`, `AsyncValidatorBaseContext`, `AsyncValidatorContext`, `AsyncValidatorOptions`, `AsyncValidatorState`, `ParameterizedAsyncValidatorConfig`, `ParameterizedAsyncValidatorContext`, and `ParameterizedAsyncValidatorOptions` types.
- Built-in `required`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `email`, `minDate`, and `maxDate` validators.

## Creating fields

`field()` creates a leaf node:

```ts
const name = field('David');
const age = field<number>(23);
const optionalName = field<string>();
```

Fields are nullable by default. The examples above have types `Field<string | null>`, `Field<number | null>`, and `Field<string | null>`. A field created without a value starts at `null`.

The preferred signature accepts an optional initial value followed by an options object:

```ts
const name = field('', {
  validators: [required],
  injector,
  nullable: true,
  disabled: false,
  readonly: false,
  hidden: false,
});
```

All options are optional, so state can be configured without supplying validators. Validators and state options can alternatively be passed as separate arguments:

```ts
field('', [required], { disabled: false });
```

`injector` is optional. When supplied, its `DestroyRef` deterministically owns the asynchronous validation watcher.

In the separate-argument form, the validator array is the second argument and state options are the third argument. When no initial value is passed, the runtime value starts as `null`.

A field is callable and returns its current value:

```ts
name();
name.value();
name.api.value();
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
const profile = form(
  {
    city: field('Moscow'),
    billingCity: field('Zurich'),
  },
  {
      validators: [sameCity],
      injector,
    disabled: false,
    readonly: false,
    hidden: false,
  },
);
```

All options are optional, so form state can be configured without supplying validators. Validators and state options can alternatively be passed as separate arguments:

```ts
form({ name: field('David') }, [validator], { hidden: false });
```

`injector` has the same optional asynchronous-validation role as it does for fields.

A definition can contain fields, explicit nested forms, or shorthand nested objects.

A form is callable and returns its aggregated value:

```ts
profile();
profile.api.value();
```

The callable and `value()` expose the fully materialized object shape in TypeScript tooling instead of an internal `FormValue<...>` alias. Nested forms and arrays are expanded recursively in IntelliSense.

Each child is exposed under its definition key. Form-level state and actions live under `form.api`.

The key `api` is reserved and rejected by the public types. Other function property names such as `name` and `length` remain valid child keys and resolve to the user-defined children at runtime.

## Nested forms

Nested containers can be explicit:

```ts
const profile = form({
  address: form({
    city: field('Moscow'),
    country: field('Russia'),
  }),
});
```

They can also use shorthand objects:

```ts
const profile = form({
  address: {
    city: field('Moscow'),
    country: field('Russia'),
  },
});
```

Shorthand nesting works at any depth. Every shorthand object is normalized to an ordinary nested form without validators or options. Use an explicit `form()` when that level needs its own validators or options.

Both forms provide the same child access and value shape:

```ts
profile.address.city();
profile.address.api.value();
profile.api.value();
```

Changes to any descendant are reflected reactively in every ancestor value.

## Type inference

- Field value types are inferred from their initial values or explicit generic arguments.
- Form value types are recursively inferred from their fields and nested forms.
- Shorthand objects infer the same values and nested field access as explicit forms.
- Validators receive a `FieldContext` whose `value` signal contains the inferred node value.
- `set()` and `reset(value)` require complete values at compile time.
- `patch()` accepts recursive partial form values.
- Incorrect value types and unknown keys are rejected at compile time.
- Field and form errors use readonly arrays of `ValidationError.WithTargetNode`.

## Field nullability

Fields include `null` in their value type by default, independently of whether their initial value is null:

```ts
const name = field('David');
// Field<string | null>

const emptyName = field<string>(null, []);
// Field<string | null>
```

The nullable type affects the complete field API. `value`, `set`, `patch`, `reset`, and validators all use `TValue | null`.

Pass `nullable: false` to remove null from the field type:

```ts
const name = field('David', { nullable: false });
// Field<string>

name.set('Ana');
// name.set(null); // TypeScript error
```

A non-nullable field requires a non-null initial value. `field<string>(null, { nullable: false })` is rejected by TypeScript.

Nullability intentionally does not change reset behavior. In line with this library's Signal Forms-inspired reset model, `reset()` without a value preserves the current value and clears interaction state. It does not reset nullable fields to null or non-nullable fields to their initial value. `reset(value)` always uses the supplied value.

This differs from Angular Reactive Forms, where `nonNullable` also controls whether a no-argument reset returns to null or to the initial value. Angular Signal Forms instead derives nullability from the model type and does not provide a nullability option.

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

Every new control update restarts the complete delay. `flush()` commits the latest buffered value immediately and cancels its timer. A missing, non-finite, zero, or negative debounce commits control updates immediately.

Programmatic operations are never debounced. `set()`, `api.patch()`, and `reset(value)` cancel any pending control update and synchronize `controlValue()` and `value()` immediately. `reset()` without a value cancels the pending update, discards the buffered control value, and restores `controlValue()` from the currently committed value. This prevents a stale timer from overwriting a newer programmatic value. A control update marks the field dirty immediately; reset clears dirty and touched state as usual.

Synchronous and asynchronous validators observe only committed `value()` changes. Parent forms likewise aggregate committed child values, including for nested forms. A field's `controlValue()` represents only the control bound directly to that field and is not aggregated from descendants. `debouncing()` is independent from asynchronous validation `pending()`.

This follows the control buffer semantics inspected in Angular Signal Forms 22.1.x at commit `004cf3a27734ae90738a0a745cc0369b52306ca3`, primarily `packages/forms/signals/src/api/types.ts`, `packages/forms/signals/src/field/node.ts`, `packages/forms/signals/src/field/state.ts`, and the debounce/reset field tests. This library exposes action methods instead of Angular's writable state signals to preserve its public API style.

#### Inherited and aggregate debounce behavior

`form()` and `array()` accept `debounce` as an inherited default for descendant fields. A field's
own `debounce` takes precedence, and nested aggregate nodes can establish a different default for
their subtrees. The nearest configured node wins:

```ts
const profile = form(
  {
    name: field(''),
    address: {
      city: field('', { debounce: 100 }),
    },
  },
  {
    debounce: 300,
  },
);
```

Here, `name` inherits 300 ms and `address.city` overrides it with 100 ms. An explicit zero or
negative value also overrides an inherited delay and commits control updates immediately. Dynamic
array items resolve the effective debounce after they are attached, so both current and future
items inherit from their array and ancestors.

Aggregate nodes do not expose an aggregated `controlValue()`. Pending descendant control values
remain local to their fields, and a form or array `value()` continues to contain only committed
descendant values. This follows Angular Signal Forms, whose node-level `controlValue()` explicitly
does not incorporate child control values.

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

Every validation error has a `kind` string and may have a human-readable `message`. Custom errors may include additional data. A validator result can be `null`, `undefined`, or `void` for success, a single `ValidationError.WithoutTargetNode`, or a readonly array of such errors.

Validators do not assign their own target. When their results are exposed through `errors()`, the validator runner associates every error with the node being validated through `targetNode`:

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
```

Field errors use their `Field<TValue>` as the target type. Form errors use their complete `Form<TNodes>` as the target type. The internal defaulting operation preserves a target that is already present, preparing the error model for future tree validators that can direct an error to a different node.

This property corresponds behaviorally to Angular Signal Forms' `fieldTree`, but is named `targetNode` to match this library's field-and-form node model. Angular's optional `formField` reference is not implemented: it identifies a concrete `[formField]` directive binding and will only make sense once this library has an equivalent binding layer.

Synchronous and asynchronous validators share one readonly validator array. Asynchronous validators must be explicitly wrapped with `asyncValidator()`; the library does not invoke a validator merely to detect whether it returns a Promise or Observable.

Validator callbacks receive a flat readonly facade of the field or form being validated. It includes `value`, `form`, `parent`, `path`, and the interaction and availability signals (`touched`, `dirty`, `disabled`, `readonly`, `hidden`, and their complements). `field` references the real callable node being validated, including when that node is a form, while `api` exposes its complete API as an escape hatch for validation state and mutable operations:

```ts
field('David', {
  validators: [context => {
    context.value();
    context.disabled();
    context.path();
    context.field();
    context.api.errors();
    return null;
  }],
});
```

The flat properties reference the same stable signals as `api`; they are not copied state snapshots. The synchronous context object also remains stable between executions. Signals read through either surface participate in normal reactive dependency tracking. `ValidatorApi<TValue>` preserves the validated value type, while `field` defaults to the common callable `Node` type.

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
  validators: [context => context.touched() ? requiredName : null],
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

`AsyncValidatorOptions` supports `debounce`, a `when(context)` condition, and `onError(error, context)`. The asynchronous context extends the same flat readonly facade with an `abortSignal` belonging only to that execution. Parameterized validators additionally receive their `params` snapshot. Neither execution-specific property is added to or mutated on `field`. Validators can pass the signal to APIs such as `fetch`; stale results are ignored even when the underlying operation does not honor cancellation.

Asynchronous callbacks also receive the complete runtime node `api`. By default it is typed as `AsyncValidatorApi<TValue>`, so value access, validation and interaction state, and common node operations preserve the validated value type. Automatic validators react to API signals they read. Parameterized validators may read API signals explicitly inside `params`; their `validate` callback remains untracked. The exact owner type can be supplied explicitly as the second generic argument for a callback validator, for example `asyncValidator<string | null, FieldApi<string | null>>(...)`. Parameterized validators use the third generic argument: `asyncValidator<TValue, TParams, TApi>({...})`. A future owner-contextual validator declaration signature may infer the exact `FieldApi` or `FormApi` automatically.

Every field and form API exposes `path: Signal<readonly string[]>`. The root path is `[]`; each descendant appends its key in the parent, such as `['address', 'city']`. Validator callbacks access the same reactive path through either `context.path()` or `context.api.path()`. This follows Angular 22 Signal Forms' `pathKeys` model while using this library's `path` name.

Every API also exposes `parent: Signal<Node | null>`, which returns the complete callable parent node or `null` at the root. Nodes reached through a form are refined to their concrete parent type, so `profile.address.city.api.parent()` is typed as `typeof profile.address | null`. A standalone field reference cannot know its future owner and therefore retains the general `Node | null` parent type even after being inserted into a form; access through the form provides the refined type.

Nodes returned by the common validator API's `parent()` and `form()` remain callable, but native JavaScript function members such as `apply`, `bind`, `call`, `name`, and `prototype` are intentionally hidden from the public type and IntelliSense. Exact `Field` and `Form` return types apply the same hiding while preserving form keys that intentionally use one of those names.

`api.form` resolves the root form for the current node. A root form returns itself, every nested form and field returns the same root form, and a standalone field returns `null`. Nodes reached through a form refine the signal to that exact root form type, including across nested forms. Because it is reactive, inserting a standalone field into a form updates `form()` and retriggers automatic async validators that read it. Validator callbacks can use the flat `context.form()` or the equivalent `context.api.form()`. A validator declared before its owner is known retains `Node | null`; supplying the refined field API explicitly, such as `asyncValidator<TValue, typeof profile.age.api>(...)`, exposes `typeof profile | null` through both surfaces inside the callback.

Root-form type resolution follows at most ten parent links. This limit affects TypeScript inference only: paths within ten levels retain the exact root form type, while deeper paths safely fall back to `Node`. Runtime parent and root traversal remains correct and has no depth limit.

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

The watcher does not require dependency injection. When an explicit or current injector exists, its `DestroyRef` owns the watcher; destroying it stops future reactive executions and cancels the current Promise or Observable operation. Outside an injection context, the watcher weakly references its node-owned target, and a `FinalizationRegistry` disconnects it if that target becomes unreachable. Garbage-collection cleanup is necessarily nondeterministic, while injector cleanup is immediate.

The node value and the `when` condition are tracked before the debounce timer starts. A debounced validator that discovers automatic dependencies starts its publication timer immediately and invokes the service in the next microtask without waiting for that timer. Every signal it reads becomes a dependency, including external signals. Its result is not published until the initial debounce period has elapsed. If any discovered dependency changes during that period, the first operation is cancelled and the replacement invocation waits for a full debounce period before running. Later changes use the same cancellation and debounce behavior.

Synchronous validators remain lazy and first run when validation state is consumed. Both synchronous and asynchronous validators can therefore refer to a class-owned form from a field initializer, such as `this.profile.name()`, without observing an uninitialized `this.profile`. Such callbacks are coupled to that class instance; `context.api.form()` remains preferable for reusable validators.

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

When coupling a validator to its owning class is undesirable, `context.api.form()` is always available as a fallback. Its default type is the general callable `Node | null`, so it supports common form operations but does not expose exact sibling keys:

```ts
const root = context.api.form();
root?.api.valid();
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
| `required` | Any value | Fails for `null`, `undefined`, `''`, `false`, and `NaN` | `{ kind: 'required' }` |
| `min(limit)` | `number | null` | Passes for `null` and `NaN` | `{ kind: 'min', min }` |
| `max(limit)` | `number | null` | Passes for `null` and `NaN` | `{ kind: 'max', max }` |
| `minLength(limit)` | A value with numeric `length` or `size`, or `null` | Passes for `null` and `''` | `{ kind: 'minLength', minLength }` |
| `maxLength(limit)` | A value with numeric `length` or `size`, or `null` | Passes for `null` and `''` | `{ kind: 'maxLength', maxLength }` |
| `pattern(expression)` | `string | null` | Passes for `null` and `''` | `{ kind: 'pattern', pattern }` |
| `email` | `string | null` | Passes for `null` and `''` | `{ kind: 'email' }` |
| `minDate(limit)` | `Date | null` | Passes for `null` and invalid dates | `{ kind: 'minDate', minDate }` |
| `maxDate(limit)` | `Date | null` | Passes for `null` and invalid dates | `{ kind: 'maxDate', maxDate }` |

`required` supports direct use and an options object with a message:

```ts
field('David', [required]);
field('David', [required({ message: 'Name is required' })]);
```

The direct validator produces `{ kind: 'required' }`. The options form adds the message as `{ kind: 'required', message }`. Passing a string directly is intentionally rejected. Field contexts carry a non-enumerable internal symbol marker, allowing overloaded validators to recognize genuine contexts without relying on their structural shape or exposing the marker in the public `FieldContext` type.

Optional-value validators deliberately accept empty values so they can be composed with `required`. For example, `email` validates format only when a value exists; `[required, email]` validates both presence and format.

The required emptiness rules follow Angular 22 Signal Forms. Empty arrays, empty sets, and empty objects are not considered empty by `required`. Length validators inspect `length` or `size`, so `minLength(1)` can reject an empty array or set.

Numeric, length, date, and pattern constraints can be static values or zero-argument functions:

```ts
const minimumAge = signal(18);

const age = field<number>(null, {
  validators: [min(minimumAge)],
});
```

Constraint functions execute during computed validation, so Angular signals read by them are tracked. Returning `undefined` temporarily disables that constraint. `pattern()` accepts a `RegExp` or a function returning a `RegExp | undefined`.

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

Each state option has this type:

```ts
boolean | (() => boolean)
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

### Possible future disabled reasons

The current public contract exposes only the effective `disabled()` boolean. It does not expose
why the node is disabled. A possible future extension is a readonly `disabledReasons()` signal
comparable to Angular Signal Forms, where each active reason identifies the node that originated
the disablement and may include a user-facing message:

```ts
type DisabledReason = {
  readonly sourceNode: Node;
  readonly message?: string;
};
```

This should not be implemented merely by translating the current mutable, configured, and
inherited boolean sources into arbitrary labels. Before adding the public API, the disabled
configuration must provide a natural way for consumers to supply meaningful reasons and optional
messages. The design must then define reasons for imperative `disable()`, conditional disabled
sources, multiple simultaneous reasons, inherited reasons, their ordering, and what `enable()`
removes. A descendant should retain an inherited reason's original source node so consumers can
identify which ancestor caused the effective state.

Angular derives `disabled()` from whether its accumulated reason list is non-empty. Its list
contains parent reasons followed by active local disabled rules. This behavior was inspected in
Angular `v22.1.4` at commit `898380974d49cf7976e9d89cc74a0801a26ce7b1`, primarily in
`packages/forms/signals/src/api/types.ts`, `packages/forms/signals/src/api/rules/disabled.ts`,
`packages/forms/signals/src/field/state.ts`, and the disabled tests in
`packages/forms/signals/test/node/field_node.spec.ts`. This section records a design direction for
future consideration and is not part of the current public contract.

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

A plain object returned by a factory or used as a template is normalized to a `form()` node. Both forms may also define a `field()`, an explicit `form()`, or another `array()`:

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

The explicit factory contract deliberately prevents node reuse. Returning the same live `field()`, `form()`, or `array()` instance more than once throws because items must not share values, parents, interaction state, validation state, or asynchronous watchers.

### Constructor signatures

Templates and factories support the same argument combinations:

```ts
array(templateOrFactory);
array(templateOrFactory, options);
array(templateOrFactory, validators, options?);
array(templateOrFactory, initialValue, options?);
array(templateOrFactory, initialValue, validators, options?);
```

`initialValue` is either a non-negative item count or an array of item values. Validators can therefore retain the same shorthand style as fields and forms:

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
- Numeric properties are readonly. Structure must be changed through `push()`, `insert()`, `removeAt()`, `move()`, `clear()`, `set()`, or `reset()`.
- `forEach()` iterates item nodes and receives `(item, index, arrayNode)` like the native array method.
- Array nodes are iterable, so `for...of`, spread, and `Array.from()` also produce item nodes rather than item values.
- `map()` transforms nodes into a normal result array, while `filter()` returns a normal array containing the matching nodes and supports TypeScript type predicates.
- `find()` returns the first matching node and supports TypeScript type predicates.
- `findIndex()` returns the index of the first matching node or `-1`.
- `some()` and `every()` test nodes with native short-circuit behavior.
- `includes()` and `indexOf()` compare node identity and accept the native optional `fromIndex` argument.
- `forEach()`, `map()`, `filter()`, `find()`, `findIndex()`, `some()`, `every()`, `includes()`, `indexOf()`, and each iterator use the item snapshot captured when the operation begins; structural mutations during an active operation do not alter that traversal.
- `length()` returns the current item count.
- Item paths use decimal index segments such as `['sons', '0', 'name']`.
- Items inherit `form()` from the root form containing the array.

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
- `move()` preserves the exact node instance and all of its state; it only changes item order and paths.
- `removeAt()` and `clear()` detach removed nodes from the tree. A removed node retained by application code remains usable independently: its parent and path are cleared, inherited state is removed, and subsequent value, validation, dirty, or touched changes do not affect the former array.
- Invalid insertion and movement indexes throw `RangeError`. `removeAt()` returns `undefined` for a missing index.

`set(values)` preserves existing node identities by index for the common prefix, creates or removes trailing nodes to match the requested length, and preserves existing interaction state. `reset(values)` performs the same length reconciliation but leaves the array and every item pristine and untouched. `reset()` without a value keeps the current structure and values while resetting interaction state.

By default, reconciliation is positional. Applications that replace or reorder object values immutably can provide `trackBy` in the array options to preserve each node with its logical entity:

```ts
const people = array(
  {
    id: field('', { nullable: false }),
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

The complete value propagates immediately to the array and every ancestor. Existing nodes in the common index prefix are updated and retain their identity and runtime state. Additional values create fresh nodes from the configured template or factory, with correct parent, root form, and index-derived paths. Surplus nodes are removed and detached from the tree; retained external references to those removed nodes remain usable as independent roots. Descendants remain attached to that removed root, and their paths are recalculated relative to it. Their values, interaction state, pending validation, and eventual errors no longer contribute to the former array or form ancestors. Setting an empty array removes every item, and a later `form.set()` can create a new collection from the same definition recipe.

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

## Control binding with `[formNode]`

`FormNodeDirective` binds a field node to a native form control or to a component that implements Angular's `ControlValueAccessor` contract:

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
  readonly name = field('Marco', { debounce: 200, nullable: false });
  readonly country = field('ch', { nullable: false });
}
```

The directive currently provides these behaviors:

- Two-way synchronization with native `input`, `textarea`, and `select` elements, including number, range, checkbox, radio, date-like, and multiple-select values.
- Native input updates use `setControlValue()`. They therefore mark the field dirty and honor the field's own or inherited control debounce; programmatic `set()` updates remain immediate and pristine.
- A blur event marks the field touched. IME composition is buffered until `compositionend`.
- `disabled`, `readonly`, `required`, and `aria-invalid` are synchronized from field state to applicable DOM properties.
- Changes to native select options reapply the field value, including options rendered after the initial binding.
- Components that provide `NG_VALUE_ACCESSOR` are connected through their `ControlValueAccessor`. The directive also provides a lightweight `NgControl` view for compatibility with controls that inspect it, including Angular Material-style controls.
- Model-to-view `writeValue()` calls are guarded against reentrant `onChange` callbacks. A legacy CVA that invokes its registered change callback from inside `writeValue()` therefore cannot mark the field dirty, write the value back, or create a feedback loop.
- When several Angular accessors match, selection follows Angular's precedence: one custom accessor, then one specialized built-in accessor, then the default accessor. Multiple accessors within the selected category are rejected as ambiguous.
- Synchronous validators provided by a CVA through `NG_VALIDATORS` participate in the field's real validation state. Their Angular validation key becomes `error.kind`, and `registerOnValidatorChange()` invalidates the reactive result. These binding-owned errors are suppressed with the field's other errors while it is disabled, readonly, or hidden and are removed when the binding is destroyed or changes field.
- `NG_ASYNC_VALIDATORS` are not adapted by this CVA compatibility layer. Asynchronous validation belongs to the node's `asyncValidator()` pipeline, which owns cancellation, pending state, debounce, and stale-result handling explicitly.
- Exporting the directive as `#binding="formNode"` provides `focus()`, `flush()`, and `reset()` operations and a reactive `node` reference.
- Destroying the directive removes DOM listeners, disconnects select observation, and destroys its reactive effects through Angular's `DestroyRef` ownership.

This first integration layer intentionally accepts `Field` nodes. Aggregate `form()` and `array()` nodes do not expose their own buffered `controlValue()`, so binding an aggregate custom control requires a separate aggregate-control protocol rather than pretending it is a leaf field.

The architecture follows Angular 22 Signal Forms `FormField` behavior as inspected at tag `22.1.4` (`898380974d49cf7976e9d89cc74a0801a26ce7b1`), while keeping the public name and node model specific to this library. Native parsing errors, configurable state classes, and a first-class signal-based custom-control protocol remain subsequent layers; they should be implemented as adapters around the same directive rather than by changing field semantics.

## Internal structural behavior

These details are not public API, but explain current propagation behavior:

- Every nested node stores a reactive reference to its parent.
- Descendants derive inherited state by reading their parent instead of receiving manually copied state.
- A private, non-enumerable symbol marks runtime nodes so shorthand normalization does not rely only on `typeof value === 'function'`.
- The symbol marker is omitted from public types.
- Runtime-only structural methods are omitted from public API types and prefixed with `_`.
- Callable field and form facades hide irrelevant built-in function members from their public TypeScript surface.

## Current boundaries

The current implementation does not yet provide:

- Submission state.
- Aggregate custom-control binding and a first-class signal-control protocol.
- Runtime addition or removal of named object children after a `form()` is created.
- Schema-driven form generation from JSON definitions.

These boundaries describe the current codebase and are not commitments to a particular future API.
