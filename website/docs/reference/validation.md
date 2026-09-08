---
title: Validation
---

# Validation reference {#validation-reference}

Every Form Nodes node can own validation rules. Fields validate one leaf value; forms, groups, and
arrays can validate their aggregate value while also collecting validation state from descendants.

Use [`validator()`](./validator.md) to type a reusable synchronous rule and
[`asyncValidator()`](./async-validator.md) for Promise- or Observable-based work.

```ts
import { asyncValidator, field, form, minLength, required, validator } from '@ngblocks/form-nodes';

const usernameAllowed = validator(({ value }) => {
  return value() === 'admin'
    ? { kind: 'reservedUsername', message: 'This username is reserved.' }
    : null;
});

const usernameAvailable = asyncValidator(({ value, abortSignal }) => {
  return api.checkUsername(value(), abortSignal).then(available =>
    available ? null : { kind: 'usernameTaken' },
  );
});

const myForm = form({
  username: field('', {
    validators: [required, minLength(3), usernameAllowed, usernameAvailable],
  }),
});
```

## 🧭 API map {#api-map}

| I want to… | Start with | Details |
| --- | --- | --- |
| Declare rules on a node | `validators` | [The validators property](#the-validators-property) |
| Write a reusable synchronous rule | `validator()` | [`validator()` reference](./validator.md) |
| Run asynchronous validation | `asyncValidator()` | [`asyncValidator()` reference](./async-validator.md) |
| Understand each node type | `field()`, `group()`, `form()`, `array()` | [Validation by node type](#validation-by-node-type) |
| Read errors and status | Node validation signals | [Validation state](#validation-state) |
| Target a child from an aggregate rule | `targetNode` | [Error ownership](#error-ownership) |
| Replace rules at runtime | `setValidators()` | [Replacing validators](#replacing-validators) |

## ✅ The validators property {#the-validators-property}

The `validators` option accepts one validator or a readonly array. Array entries may be `null` or
`undefined`, which are ignored.

```ts
type DeferredValidator = () => any;

type ValidatorSource<TValue> =
  | DeferredValidator
  | ComposableValidator<TValue>
  | readonly [
    validator?: DeferredValidator | ComposableValidator<TValue> | null | undefined,
    ...validators: (DeferredValidator | ComposableValidator<TValue> | null | undefined)[],
  ];
```

```ts
const myForm = form({
  email: field('', {
    validators: [required, minLength(3)],
  }),
});
```

Parameterless source callbacks can reference the form being initialized, such as
`() => equalTo(this.myForm.password())`, without return annotations.
Their return type is intentionally unchecked, including overloaded functions callable without
arguments. This also applies to parameterless callbacks passed to `validator()` and the callback
signature of `asyncValidator()`. Use context-taking callbacks for checked reusable rules and call
overloaded factories such as `uniqueItems()` when you need value-compatibility checking. The
supported runtime results are unchanged. See
[Self-referencing validators](../guides/validation.md#self-referencing-validators) for a complete example.

The shorthand positional validator argument is equivalent:

```ts
const name = field('', [required, minLength(3)]);
```

Use the options form when the node also needs configuration such as `disabled`, `readonly`,
`hidden`, debounce, injector ownership, array tracking, or form submission.

### 🔸 Accepted validator entries {#accepted-validator-entries}

| Entry | Example | Behavior |
| --- | --- | --- |
| Built-in validator | `required`, `requiredIf(() => condition)` | Runs synchronously |
| Configured built-in | `minLength(3)` | Runs synchronously and exposes constraint metadata |
| Inline callback | `({ value }) => ...` | Infers the node value type contextually |
| `validator()` result | `adult` | Reusable typed synchronous validator |
| `asyncValidator()` result | `usernameAvailable` | Managed asynchronous validator |
| `null` or `undefined` | `enabled ? required : null` | Ignored inside a source array |

All standard built-in validator factories accept `when` in their options object. `requiredIf()`
uses its condition argument for the same purpose:

```ts
const myForm = form({
  newsletterEmail: field('', [
    email({ when: ({ value }) => value() !== '' })
  ]),
});
```

Signals read by `when` are tracked. While it returns `false`, the validator contributes no errors
or constraint metadata.

Async validators must be direct source entries. Do not return an `asyncValidator()` from a
synchronous validator.

## 📐 Validation by node type {#validation-by-node-type}

| Node | Own validator value | Descendant validation | Important distinction |
| --- | --- | --- | --- |
| `field()` | Complete leaf value, including objects or arrays stored as one value | None | One error and interaction boundary |
| `group()` | Object assembled from enabled children | Aggregates child state and errors | Can be a root without submission |
| Object shorthand `{ ... }` | Same aggregate object as `group()` | Aggregates child state and errors | No group-specific options at declaration |
| `form()` | Object assembled from enabled children | Aggregates child state and errors | Adds submission state and operations |
| `array()` | Array assembled from enabled item nodes | Aggregates item state and errors | Paths and ownership follow reconciled items |

These node boundaries are unchanged by concise declarations. The
[declaration shorthand matrix](../concepts/creating-nodes.md#declaration-shorthand-matrix) shows
which primitive owns validation for every shorthand category.

### 🔸 field() {#field}

A field validator observes the complete field value. If a field stores an object or array, the
validator still sees that value as one leaf:

```ts
const tags = field<string[]>([], {
  validators: ({ value }) => value().length <= 5
    ? null
    : { kind: 'tooManyTags', maximum: 5 },
});
```

Use `array()` instead when each item needs independent validation, errors, paths, or state.

### 🔸 group() and object shorthand {#group-and-object-shorthand}

A group validator observes the aggregate object. It is appropriate for cross-field rules:

```ts
const confirmation = field('');

const credentials = group({
  password: field(''),
  confirmation,
}, {
  validators: ({ value }) => value().password === value().confirmation
    ? null
    : { kind: 'passwordMismatch', targetNode: confirmation },
});
```

The object shorthand creates the same kind of aggregate branch, but use explicit `group()` when
that branch needs its own `validators` or other group options.

### 🔸 form() {#form}

Form validation behaves like aggregate group validation. A form additionally uses its validation
state to gate submission and exposes submission operations:

```ts
const booking = form({
  departure: field<Date>(),
  returnDate: field<Date>(),
}, {
  validators: ({ value }) => {
    const { departure, returnDate } = value();

    return departure && returnDate && returnDate < departure
      ? { kind: 'returnBeforeDeparture' }
      : null;
  },
  onSubmit: async value => saveBooking(value),
});
```

Invalid or unresolved validation prevents a normal submission run. See
[Submission](../guides/submission.md) for the complete submission lifecycle.

### 🔸 array() {#array}

An array can validate the collection while item nodes validate individual values:

```ts
const contacts = array({
  email: field('', [required, email]),
}, {
  initialValue: [{ email: '' }],
  validators: ({ value }) => value().length > 0
    ? null
    : { kind: 'contactRequired' },
});
```

Array-level errors belong to the array unless `targetNode` names an item or descendant. Item
errors remain owned by their item node after insertions, removals, moves, or reconciliation.

## ✅ Synchronous validators {#synchronous-validators}

A synchronous validator receives `ValidatorContext<TValue>` and may return success, one error,
several errors, or synchronous conditional composition.

```ts
type ValidationResult =
  | null
  | undefined
  | void
  | ValidationError.ValidatorResult
  | readonly ValidationError.ValidatorResult[];
```

Every signal read during execution is a dependency. When it changes, validation is recomputed.
See [`validator()`](./validator.md) for the complete callback context and composition rules.

## ⏳ Asynchronous validators {#asynchronous-validators}

`asyncValidator()` marks a validator for managed scheduling. It can return a Promise-like or
Observable-like operation. Form Nodes owns pending state, debounce, cancellation, dependency
tracking, error mapping, and stale-result suppression.

```ts
const referenceExists = asyncValidator(({ value, abortSignal }) => {
  return api.referenceExists(value(), abortSignal).then(exists =>
    exists ? null : { kind: 'unknownReference' },
  );
}, {
  debounce: 250,
});
```

Synchronous validation runs first. Async validators on the same node do not start while that node
has a synchronous error. See [`asyncValidator()`](./async-validator.md) for both signatures and
the complete execution lifecycle.

## ✅ Validation state {#validation-state}

Every node exposes its validation state directly:

| Member | Meaning |
| --- | --- |
| `errors()` | Errors owned directly by this node |
| `allErrors()` | Own errors plus errors owned by descendants |
| `getError(kind)` | First own error matching `kind` |
| `validationStatus()` | `'valid'`, `'invalid'`, or `'unknown'` |
| `valid()` | No errors or unresolved validation in the subtree |
| `invalid()` | This node or a descendant currently has an error |
| `pending()` | Async validation is unresolved on this node or a descendant |
| `debouncing()` | Async validation is waiting for its delay |
| `validators()` | Normalized readonly collection of directly registered validators |
| `validators({ resolve: true })` | Final references reached through synchronous compositions |
| `hasValidator(validator, { resolve: true })` | Whether that exact reference occurs in the resolved list |

`unknown` means no error currently makes the node invalid, but an asynchronous result is still
pending. It does not refer to the TypeScript value type.

### 🔸 Aggregate state {#aggregate-state}

Forms, groups, and arrays combine their own validation with descendant state:

- an error on the aggregate or any participating descendant makes it invalid;
- pending work on the aggregate or a descendant contributes pending state;
- an existing error takes precedence over pending work for `validationStatus()`;
- `errors()` remains local, while `allErrors()` traverses the subtree.

## 🚨 Error ownership {#error-ownership}

An error returned without `targetNode` is assigned to the node whose validator produced it.
Aggregate validators can target a descendant so the error appears where the user can resolve it:

```ts
return {
  kind: 'passwordMismatch',
  message: 'Passwords must match.',
  targetNode: myForm.confirmation,
};
```

`errors()` on that descendant includes the targeted error. `allErrors()` on its ancestors includes
it while preserving the descendant as `targetNode`. The `formNode` property is reserved for errors
created by a concrete rendered control binding.

## ✅ When validation is skipped {#when-validation-is-skipped}

Disabled, readonly, and hidden state exclude a node's validation while that state is active.
In-flight asynchronous validation is cancelled. When the node returns to an interactive state,
validation runs again against its current value.

Disabled children are also omitted from aggregate values. See
[Interaction and availability](../guides/interaction-and-availability.md) for propagation rules.

## ✅ Replacing validators {#replacing-validators}

`setValidators(source)` replaces the node's complete validator source and immediately revalidates
the committed value:

```ts
myForm.username.setValidators([required, minLength(5)]);
```

Replacing rules does not change the current value or mark the node dirty or touched. Read the
normalized current collection with `validators()`.

## 🔗 Related reference {#related-reference}

- [`validator()`](./validator.md) — reusable synchronous validators and callback context
- [`asyncValidator()`](./async-validator.md) — asynchronous scheduling and cancellation
- [Built-in validators](./built-in-validators.md) — available rules and constraints
- [Node API](./node-api.md) — shared validation properties and methods
- [Errors and validation status](../guides/errors-and-status.md) — displaying and typing errors

### 🔸 Validator inspection and resolution {#validator-inspection-and-resolution}

`validators` remains an Angular `Signal` of directly registered functions. Its options overload and
`hasValidator` accept `{ resolve?: boolean }`, defaulting to false. Resolved inspection shares
synchronous validation evaluation and follows returned functions, preserving order and duplicates.
It lists registered async validators without executing their async work. Successful leaves remain
present; this is not an active-constraint query. See
[Inspect resolved validators](../guides/validation.md#inspect-resolved-validators) for complete
examples and the behavior of wrappers, disabled nodes, and invalid compositions.
