---
title: validator()
---

# validator()

Attach a synchronous validator directly to a field, form, or array. The consuming node contextually
infers its value type:

```ts
const myForm = form({
  age: field<number>(null, [({ value }) => {
    const age = value();

    return age !== null && age < 18
      ? { kind: 'adult', minimumAge: 18, actual: age }
      : null;
  }]),
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
import { field, form, validator } from '@gem/ng-forms';

export const adult = validator<number | null>(({ value }) => {
  const age = value();

  return age !== null && age < 18
    ? { kind: 'adult', minimumAge: 18, actual: age }
    : null;
});

const myForm = form({
  age: field<number>(null, [adult]),
});
```

The helper returns the original function. It adds typing, not a runtime wrapper, injection
requirement, eager execution, or different reactivity.

`TValue` must match the exact node value. Default fields normally include `null`; forms and arrays
use their non-null aggregate values. A validator declared as `validator<number>()` therefore fits a
field only when that field uses `{ nullable: false }`.

### Signature

```ts
validator<TValue>(
  validate: ComposableValidator<TValue>,
): ComposableValidator<TValue>;
```

`TValue` is the exact committed value type of the field, form, group, or array. The return value is
the original `validate` function by identity.

## Validator context

| Member | Description |
| --- | --- |
| `value()` | Current committed node value with its inferred type. |
| `field` | Real callable node being validated, including when it is a form or array. |
| `api` | Typed common API for validation, state, navigation, and node operations. |
| `form()` | Root aggregate that owns the node, or `null` for a standalone field. |
| `parent()` | Direct parent node, or `null` at the root. |
| `path()` | Reactive path from the root. |
| State signals | `touched`, `dirty`, `disabled`, `readonly`, `hidden`, `required`, `submitting`, and their complements. |

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
| [State signals](#custom-validator-context-state) | readonly signals | Interaction and availability state |

<div className="api-member-reference">

### Value and node

#### value {#custom-validator-context-value}

**Signature:** `value: Signal<TValue>`

Call `value()` to read the committed value. The read creates a dependency, so validation runs
again when the value changes.

#### field {#custom-validator-context-field}

**Signature:** `field: TField`

The real callable node. The property retains the name `field` when the owner is a form, group, or
array. Prefer `value()` unless node identity or a concrete node member is required.

#### api {#custom-validator-context-api}

**Signature:** `api: TApi`

The common value, validation, navigation, state, and operations API. Reading one of its signals is
reactively tracked. Validators should normally remain pure rather than mutate through this API.
See [Node API](./node-api.md).

### Tree navigation

#### form {#custom-validator-context-form}

**Signature:** `form: Signal<PublicNode<Node> | null>`

The root aggregate owning this node, or `null` for a standalone node.

#### parent {#custom-validator-context-parent}

**Signature:** `parent: Signal<PublicNode<Node> | null>`

The direct parent, or `null` when the validated node is a root.

#### path {#custom-validator-context-path}

**Signature:** `path: Signal<readonly string[]>`

Property names and array indexes locating the node from its root. Array indexes are strings. A
validator that reads the path can rerun when an array item moves.

### State

#### state signals {#custom-validator-context-state}

| Signal | Meaning |
| --- | --- |
| `submitting()` | The node or root form is submitting |
| `touched()` / `untouched()` | Whether interaction marked it touched |
| `dirty()` / `pristine()` | Whether modification was recorded |
| `disabled()` / `enabled()` | Whether it participates normally |
| `disabledReasons()` | Active disabling causes |
| `readonly()` / `writable()` | Whether consumers should permit editing |
| `hidden()` / `visible()` | Whether consumers should display it |
| `required()` | Whether current rules require a value |

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

const myForm = form({
  age: field<number>(null, [
    () => requireAdult() ? min(18) : null,
  ]),
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
  () => minimumAgeEnabled() ? [required, min(18)] : null,
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
const myForm = form({
  password: field(''),
  confirmation,
}, {
  validators: ({ value }) => value().password === value().confirmation
    ? null
    : {
      kind: 'passwordMismatch',
      message: 'Passwords must match.',
      targetNode: confirmation,
    },
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
