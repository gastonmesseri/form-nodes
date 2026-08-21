# Behavior reference

This document records the behavior currently implemented by the library. It is an evolving specification and the source material for future user-facing documentation.

The internal state model is inspired by Angular 22 Signal Forms. The current reference baseline is Angular `22.1.x` at commit `004cf3a27734ae90738a0a745cc0369b52306ca3`. Public names and signatures intentionally belong to this library and do not attempt to reproduce Angular's API.

## Design guarantees

- The library provides small, typed, signal-based `field()` and `form()` primitives.
- `field()` and `form()` can be created and used anywhere without an Angular injection context.
- Their required execution paths do not use `inject()` or injection-context-dependent effects.
- Signals expose reactive state while actions are declared as methods in public types, allowing editors to distinguish state from behavior in IntelliSense.
- Values remain programmatically readable and writable regardless of disabled, readonly, or hidden state.

## Public exports

The package exports:

- `field()` and the `Field`, `FieldApi`, and `FieldOptions` types.
- `form()` and the `Form`, `FormApi`, `FormOptions`, `FormValue`, `FormSet`, and `FormPatch` types.
- The `ValidationError`, `ValidationResult`, `ValidationSuccess`, `ValidationStatus`, `Validator`, and `Validators` types.
- `asyncValidator()` and its `AsyncValidator`, `AsyncValidatorContext`, and `AsyncValidatorOptions` types.
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

A definition can contain fields, explicit nested forms, or shorthand nested objects.

A form is callable and returns its aggregated value:

```ts
profile();
profile.api.value();
```

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
| `set(value)` | Replaces the value | Marks dirty, even when the value is equal | No change |
| `api.patch(value)` | Same as `set(value)` | Marks dirty | No change |
| `reset()` | Preserves the current value | Clears dirty | Clears touched |
| `reset(value)` | Replaces the value | Clears dirty | Clears touched |

`reset(value)` handles falsy values such as an empty string or zero. Resetting does not replace validators, and validation is recomputed against a newly assigned value.

### Form values

| Operation | Value effect | Dirty effect | Touched effect |
| --- | --- | --- | --- |
| `api.set(value)` | Recursively assigns all supplied branches | Marks every affected leaf dirty | No change |
| `api.patch(value)` | Recursively assigns only supplied branches | Marks only affected leaves dirty | No change |
| `api.reset()` | Preserves every descendant value | Clears dirty throughout the subtree | Clears touched throughout the subtree |
| `api.reset(value)` | Recursively assigns the complete value | Clears dirty throughout the subtree | Clears touched throughout the subtree |

At the type level, `set()` requires every form key and `patch()` rejects unknown keys. At runtime, unknown keys passed through an unsafe cast are ignored and produce an English console warning.

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

```ts
const username = field('', [
  required,
  asyncValidator(async ({ value, abortSignal }) => {
    const available = await checkUsername(value(), abortSignal);
    return available ? null : { kind: 'usernameTaken' };
  }, { debounce: 300 }),
]);
```

`AsyncValidatorOptions` supports `debounce`, a `when(context)` condition, and `onError(error, context)`. The asynchronous context adds an `abortSignal` to the normal field context. Validators can pass it to APIs such as `fetch`; stale results are ignored even when the underlying operation does not honor cancellation.

Asynchronous validation behavior follows Angular 22 Signal Forms where applicable, but uses an internal Promise runner rather than Angular Resource so creation never requires an injection context:

- Asynchronous validators run only while the node is interactive and synchronous validation has no errors.
- Starting a new run aborts the previous run and immediately clears its asynchronous errors.
- `pending()` is true during debounce and execution.
- While pending with no errors, `validationStatus()` is `unknown`, and both `valid()` and `invalid()` are false.
- A completed error makes the validation status `invalid`; successful completion makes it `valid`.
- Child pending and invalid states propagate to ancestor forms.
- Disabling, hiding, or marking a node readonly cancels its active asynchronous validation. Returning it to an interactive state starts validation again.
- Rejected Promises produce no validation error unless `onError` maps the rejection to a validation result.
- Asynchronous results preserve validator-array order, not completion order.

Asynchronous validators accept Promise-like or RxJS Observable results. An Observable represents one validation operation: its first emitted result is used and the subscription is then closed. Completing without emitting is treated as successful validation. A stale or cancelled validation unsubscribes immediately. Observable errors use the same `onError` mapping as rejected Promises.

Validation behavior:

- A node with no failing validators has `errors()` equal to `[]`.
- All validators run against the current value.
- A validator that returns several errors has its result flattened into the node error array.
- Errors preserve validator order and their order within each validator result.
- Multiple errors with the same `kind` are preserved rather than overwritten.
- Validators returning `null`, `undefined`, or no value add no errors.
- Changing a field value recomputes its validation.
- Changing a descendant recomputes ancestor form validators against the aggregated value.
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

- `markAsTouched()` marks an interactive field touched.
- `markAsUntouched()` clears its touched state.
- Value changes through `set()` or `patch()` do not mark a field touched.
- Touched state is independent from validity and dirty state.

A form has no independent touched flag. It aggregates touched state from descendants:

- Any touched interactive descendant makes all its ancestor forms touched.
- `form.api.markAsTouched()` walks the subtree and marks every interactive descendant touched.
- `form.api.markAsUntouched()` clears touched throughout the subtree.
- Calling either action on a nested form affects only that subtree.
- Reset clears touched throughout the reset subtree.

## Dirty state

Fields start pristine:

```ts
dirty() === false
pristine() === true
```

- `set()` and `patch()` mark a field dirty.
- Setting the existing value still marks the field dirty.
- `markAsDirty()` records dirty state without changing the value.
- `markAsPristine()` clears dirty state without changing the value.
- Validator changes do not mark a field dirty.
- Dirty state is independent from touched and validity.

A form has no independent dirty flag. It aggregates dirty state from descendants:

- Any dirty interactive descendant makes all its ancestor forms dirty.
- `form.api.markAsDirty()` marks every descendant dirty.
- `form.api.markAsPristine()` clears dirty throughout the subtree without changing values.
- Calling either action on a nested form affects only that subtree.
- Reset clears dirty throughout the reset subtree.

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

## Non-interactive behavior

A node is non-interactive when at least one of these is true:

```ts
hidden() || disabled() || readonly()
```

While a node is non-interactive:

- Its validators are skipped, its own `errors()` is empty, and it is considered valid.
- Its invalid state does not make an ancestor invalid.
- Its public touched and dirty state is reported as false and does not affect ancestors.
- `markAsTouched()` is ignored.
- Values remain readable and programmatically writable.
- Validators and stored interaction state are retained.

When the node becomes interactive again:

- Validation resumes against the current value and validators.
- Previously recorded touched and dirty state becomes observable again.
- A value write or `markAsDirty()` performed while non-interactive can therefore appear as dirty afterward.

## Empty forms

An empty form has value `{}` and is valid, enabled, writable, visible, untouched, and pristine by default, provided it has no failing form validator.

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

- Asynchronous validators or pending state.
- Submission state.
- Control-value-accessor or template directives.
- Dynamic array primitives.
- Runtime addition or removal of form nodes.
- Schema-driven form generation from JSON definitions.

These boundaries describe the current codebase and are not commitments to a particular future API.
