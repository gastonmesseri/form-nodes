---
title: validator()
---

# validator()

Attach a synchronous validator directly to a field, form, or array. The consuming node contextually
infers its value type:

```ts
import { field, form, required, validator } from '@gem/ng-forms';

const adult = validator<number | null>(({ value }) => {
  const age = value();

  return age !== null && age < 18
    ? { kind: 'adult', minimumAge: 18, actual: age }
    : null;
});

const myForm = form({
  age: field<number>(null, [required, adult]),
});
```

## API map

| I want to… | Start with | Details |
| --- | --- | --- |
| Write a validator inline | `({ value }) => ...` | [Inline validators](#inline-validators) |
| Declare a reusable typed validator | `validator<TValue>()` | [Signature](#signature) |
| Read node value, tree, or state | `ValidatorContext<TValue>` | [Context reference](#context-reference) |
| Return success or errors | `ValidationResult` | [Validation results](#validation-results) |
| Enable rules reactively | Return another validator | [Conditional composition](#conditional-composition) |
| Replace validators at runtime | `setValidators()` | [Validator sources](#validator-sources) |
| Assign an aggregate error to a child | `targetNode` | [Error ownership](#error-ownership) |
| Type custom error data | `ValidationErrorMap` | [Typed custom errors](#typed-custom-errors) |

## Inline validators

Use an inline callback when a rule belongs to one node and its value type can be inferred from that
node. Use `validator()` when the rule is declared separately and therefore has no consuming node
from which TypeScript can infer its value.

## validator()

Use `validator<TValue>()` when declaring a reusable validator separately from its consuming node:

```ts
import { field, form, required, validator } from '@gem/ng-forms';

export const adult = validator<number | null>(({ value }) => {
  const age = value();

  return age !== null && age < 18
    ? { kind: 'adult', minimumAge: 18, actual: age }
    : null;
});

const myForm = form({
  age: field<number>(null, [required, adult]),
});
```

The helper returns the original function. It adds typing, not a runtime wrapper, injection
requirement, eager execution, or different reactivity.

`TValue` must match the exact node value. Default fields normally include `null`; forms and arrays
use their non-null aggregate values. A validator declared as `validator<number>()` therefore fits a
field created with `field.strict()`.

### Signature

```ts
validator<TValue>(
  validate: ComposableValidator<TValue>,
): ComposableValidator<TValue>;
```

`TValue` is the exact committed value type of the field, form, group, or array. The return value is
the original `validate` function by identity.

### Value type and inference

When `validator()` is declared separately, there is no consuming node from which TypeScript can
infer `TValue`. If the generic is omitted, `value()` is therefore `unknown` and must be narrowed:

```ts
const notBlank = validator(({ value }) => {
  const currentValue = value(); // unknown

  return typeof currentValue === 'string' && currentValue.trim().length > 0
    ? null
    : { kind: 'blank' };
});
```

Specify the exact node value type when the reusable rule belongs to a known domain:

```ts
const adult = validator<number | null>(({ value }) => {
  const age = value(); // number | null

  return age !== null && age < 18 ? { kind: 'adult' } : null;
});
```

The type must include `null` for nullable fields. Contextual inference remains available when a
callback is written directly inside a node's `validators` source.

## Validator context

| Member | Description |
| --- | --- |
| [`value()`](#custom-validator-context-value) | Current committed node value with its inferred type. |
| [`field`](#custom-validator-context-field) | Real callable node being validated, including when it is a form or array. |
| [`api`](#custom-validator-context-api) | Typed common API for validation, state, navigation, and node operations. |
| [`form()`](#custom-validator-context-form) | Root aggregate that owns the node, or `null` for a standalone field. |
| [`parent()`](#custom-validator-context-parent) | Direct parent node, or `null` at the root. |
| [`path()`](#custom-validator-context-path) | Reactive path from the root. |
| [State signals](#custom-validator-context-state) | `touched`, `dirty`, `disabled`, `readonly`, `hidden`, `required`, `submitting`, and their complements. |

The context and its signals are stable. Any signal read while the validator executes becomes a
reactive dependency.

## Context reference

| Member | Type | Purpose |
| --- | --- | --- |
| [`value`](#custom-validator-context-value) | `Signal<TValue>` | Current committed value |
| [`field`](#custom-validator-context-field) | callable node | Real node being validated |
| [`api`](#custom-validator-context-api) | `ValidatorApi<TValue>` | Common node state and operations |
| [`form`](#custom-validator-context-form) | root-node signal | Root aggregate or `null` |
| [`parent`](#custom-validator-context-parent) | parent-node signal | Direct parent or `null` |
| [`path`](#custom-validator-context-path) | path signal | Location from the root |
| [`submitting`](#custom-validator-context-state) | `Signal<boolean>` | Submission state |
| [`touched` / `untouched`](#custom-validator-context-state) | `Signal<boolean>` | Touched state and its complement |
| [`dirty` / `pristine`](#custom-validator-context-state) | `Signal<boolean>` | Modification state and its complement |
| [`disabled` / `enabled`](#custom-validator-context-state) | `Signal<boolean>` | Participation state and its complement |
| [`disabledReasons`](#custom-validator-context-state) | `Signal<readonly DisabledReason[]>` | Active disabling causes |
| [`readonly` / `writable`](#custom-validator-context-state) | `Signal<boolean>` | Editing state and its complement |
| [`hidden` / `visible`](#custom-validator-context-state) | `Signal<boolean>` | Visibility state and its complement |
| [`required`](#custom-validator-context-state) | `Signal<boolean>` | Whether current rules require a value |

<div className="api-member-reference">

### Value and node

#### value {#custom-validator-context-value}

**Signature:** `value: Signal<TValue>`

Call `value()` to read the committed value. The read creates a dependency, so validation runs
again when the value changes.

```ts
validator<string>(({ value }) => value().trim() ? null : { kind: 'blank' });
```

#### field {#custom-validator-context-field}

**Signature:** `field: TField`

The real callable node. The property retains the name `field` when the owner is a form, group, or
array. Prefer `value()` unless node identity or a concrete node member is required.

```ts
validator<string>(({ field }) => field() ? null : { kind: 'blank' });
```

#### api {#custom-validator-context-api}

**Signature:** `api: TApi`

The common value, validation, navigation, state, and operations API. Reading one of its signals is
reactively tracked. Validators should normally remain pure rather than mutate through this API.
See [Node API](./node-api.md).

```ts
validator<string>(({ api }) => api.dirty() && !api.value() ? { kind: 'blank' } : null);
```

### Tree navigation

#### form {#custom-validator-context-form}

**Signature:** `form: Signal<PublicNode<Node> | null>`

The root aggregate owning this node, or `null` for a standalone node.

```ts
validator<string>(({ form }) => form() === null ? { kind: 'mustBelongToForm' } : null);
```

#### parent {#custom-validator-context-parent}

**Signature:** `parent: Signal<PublicNode<Node> | null>`

The direct parent, or `null` when the validated node is a root.

```ts
validator<string>(({ parent }) => parent() ? null : { kind: 'mustHaveParent' });
```

#### path {#custom-validator-context-path}

**Signature:** `path: Signal<readonly string[]>`

Property names and array indexes locating the node from its root. Array indexes are strings. A
validator that reads the path can rerun when an array item moves.

```ts
validator<string>(({ path }) => path().length > 3 ? { kind: 'tooDeep' } : null);
```

### State

#### state signals {#custom-validator-context-state}

| Signal | Meaning | Example read |
| --- | --- | --- |
| `submitting()` | The node or root form is submitting | `validator<unknown>(({ submitting }) => { submitting(); return null; })` |
| `touched()` | Interaction marked the node touched | `validator<unknown>(({ touched }) => { touched(); return null; })` |
| `untouched()` | The node remains untouched | `validator<unknown>(({ untouched }) => { untouched(); return null; })` |
| `dirty()` | Modification was recorded | `validator<unknown>(({ dirty }) => { dirty(); return null; })` |
| `pristine()` | No modification was recorded | `validator<unknown>(({ pristine }) => { pristine(); return null; })` |
| `disabled()` | The node is excluded | `validator<unknown>(({ disabled }) => { disabled(); return null; })` |
| `enabled()` | The node participates normally | `validator<unknown>(({ enabled }) => { enabled(); return null; })` |
| `disabledReasons()` | Active disabling causes | `validator<unknown>(({ disabledReasons }) => { disabledReasons(); return null; })` |
| `readonly()` | Consumers should prevent editing | `validator<unknown>(({ readonly }) => { readonly(); return null; })` |
| `writable()` | Consumers may permit editing | `validator<unknown>(({ writable }) => { writable(); return null; })` |
| `hidden()` | Consumers should omit the node | `validator<unknown>(({ hidden }) => { hidden(); return null; })` |
| `visible()` | Consumers should display the node | `validator<unknown>(({ visible }) => { visible(); return null; })` |
| `required()` | Current rules require a value | `validator<unknown>(({ required }) => { required(); return null; })` |

Any state signal read by the validator becomes a dependency.

</div>

## Validation results

A synchronous validator may return:

| Result | Meaning |
| --- | --- |
| `null`, `undefined`, or `void` | Success |
| `{ kind, ...data }` | One validation error |
| `[{ kind, ... }, ...]` | Several errors, preserving their order |
| Another synchronous validator | Conditional composition |
| An array of synchronous validators | Conditional composition of several rules |

After nullish entries are removed, a returned array cannot mix validators and errors. Async
validators cannot be returned through this composition mechanism.

An empty error array is also successful. Every error requires a discriminating `kind`; it may add
a human-readable `message` and arbitrary structured data.

## Conditional composition

A synchronous validator can return another synchronous validator, or an array containing only
validators and nullish entries:

```ts
const requireAdult = signal(false);

const adultWhenRequired = validator<number | null>(() => {
  return requireAdult() ? min(18) : null;
});

const myForm = form({
  age: field<number>(null, [adultWhenRequired]),
});
```

The outer callback tracks `requireAdult()`. When it changes, Gem Forms resolves the selected rule
against the same context.

:::warning Keep returned arrays homogeneous

After nullish entries are removed, a returned array must contain either errors or validators—not
both. A mixed array throws because its intent is ambiguous.

:::

Put `asyncValidator()` directly in the node's validator source; returning it from synchronous
composition throws. Circular composition is rejected, and composition deeper than 100 levels
throws instead of recursing indefinitely.

## Validator sources

Node options, positional validator arguments, and `setValidators()` accept one validator or a
readonly array. Nullish array entries are ignored:

```ts
myForm.age.setValidators([
  required,
  minimumAgeEnabled() ? min(18) : null,
]);
```

That boolean condition is evaluated when `setValidators()` runs. For a condition that follows a
signal over time, return validators from a reactive validator instead:

```ts
myForm.age.setValidators([
  validator<number | null>(() => {
    return minimumAgeEnabled() ? [required, min(18)] : null;
  }),
]);
```

`validators()` exposes the normalized readonly array. Replacing validators revalidates the current
value without changing dirty or touched state.

## Error ownership

Validators normally return errors without `targetNode`. Before exposure, the node assigns itself as
the target. `errors()` reads only errors owned by the current node; `allErrors()` additionally
traverses descendants.

```ts
const error = myForm.age.errors()[0];

error.kind;                       // 'adult'
error.targetNode === myForm.age; // true
```

For a cross-field rule, an aggregate validator can assign the error to the descendant that should
display it:

```ts
const confirmation = field('');
const passwordsMatch = validator<{ password: string | null; confirmation: string | null }>(
  ({ value }) => value().password === value().confirmation
    ? null
    : {
      kind: 'passwordMismatch',
      message: 'Passwords must match.',
      targetNode: confirmation,
    },
);

const myForm = form({
  password: field(''),
  confirmation,
}, {
  validators: passwordsMatch,
});
```

Omit `targetNode` when the error belongs to the node being validated. `formNode` is reserved for
errors created by a concrete rendered control binding.

Use `getError(kind)` for the first own error of a kind. Applications and reusable packages can
augment `ValidationErrorMap` so custom kinds expose strongly typed data. See
[Errors and validation status](../guides/errors-and-status.md#typed-lookup).

## Typed custom errors

Custom properties are `unknown` by default. Applications and packages can augment the registry:

```ts
declare module '@gem/ng-forms' {
  interface ValidationErrorMap {
    minimumAge: ValidationError & {
      readonly kind: 'minimumAge';
      readonly minimumAge: number;
      readonly actual: number;
    };
  }
}

const error = myForm.age.getError('minimumAge');

error?.minimumAge; // number | undefined
```

## Execution behavior

- Validators execute synchronously and reactively, in declaration order.
- Replacing validators immediately revalidates the committed value.
- Validation does not mark a node dirty or touched.
- Disabled, readonly, or hidden nodes skip validation and resume it when interactive again.
- Synchronous errors prevent async validators on that node from starting until they are resolved.

## Relevant public types

| Type | Purpose |
| --- | --- |
| `ValidationError` | Base `{ kind, message? }` error shape. |
| `ValidationResult` | Synchronous success, one error, or an error array. |
| `ValidatorContext<TValue>` | Complete synchronous callback context. |
| `Validator<TValue>` | Basic synchronous validation function. |
| `ComposableValidator<TValue>` | Validator that can return other validators conditionally. |
| `ValidatorSource<TValue>` | One validator or a readonly validator array with nullish entries. |
| `ValidationErrorMap` | Extensible registry used by typed `getError()`. |

See [Validation](../guides/validation.md), [Built-in validators](./built-in-validators.md), and
[`asyncValidator()`](./async-validator.md).
