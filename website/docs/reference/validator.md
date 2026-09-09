---
title: validator()
---

import CodeBlock from '@theme/CodeBlock';
import reusableValidatorNodeSource from '!!raw-loader!../../examples/reusable-validator-node.typecheck.ts';

# validator() {#validator}

Attach a synchronous validator directly to a field, form, or array. The consuming node contextually
infers its value type:

```ts
import { field, form, required, validator } from '@ngblocks/form-nodes';

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

## 🧭 API map {#api-map}

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

## ✅ Inline validators {#inline-validators}

Use an inline callback when a rule belongs to one node and its value type can be inferred from that
node. Use `validator()` when the rule is declared separately and therefore has no consuming node
from which TypeScript can infer its value.

## ✅ validator() {#validator-1}

Use `validator<TValue>()` when declaring a reusable validator separately from its consuming node:

```ts
import { field, form, required, validator } from '@ngblocks/form-nodes';

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

### ◆ Signature {#signature}

```ts
validator<TValue, TField extends AnyNode = AnyNode>(
  validate: NoInfer<(() => any) | ComposableValidator<TValue, ValidatorOwner<TField>>>,
): ComposableValidator<TValue, TField>;
```

`TValue` is the exact committed value type of the field, form, group, or array. The return value is
the original `validate` function by identity. `TField` is inferred from the consuming primitive
when the helper is inline. `ValidatorOwner` gives a standalone helper the common node union
when no concrete owner is supplied. Omit helper type arguments to infer both types inline.

Parameterless callbacks can reference their class form, including returning another synchronous
validator, without a return annotation. Their accepted return type is intentionally unchecked;
callbacks receiving a context still check their results. A fallback overload retains inference
from explicitly annotated standalone callback contexts. See
[Self-referencing validators](../guides/validation.md#self-referencing-validators).

### ◆ Value type and inference {#value-type-and-inference}

Separately declared helpers preserve `TValue` on the generic node returned by `ctx.field()` and
`ctx.node()`. Calling that node or reading its `value()` signal returns the same type as
`ctx.value()`; the equivalent `api.value()` and `$api.value()` paths also preserve it.
For `validator<string | null>()`, all these reads have type `string | null`. The primitive kind
and child names remain unspecified until a concrete owner is supplied or inferred inline.

<CodeBlock language="ts" title="reusable-validator-node.typecheck.ts">{reusableValidatorNodeSource}</CodeBlock>


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

The type must include `null` for nullable fields. Inline callbacks and inline helpers infer the validated node as well as its value.
See [Inline node inference](../concepts/tree-and-api.md#inline-node-inference).

## ✅ Validator context {#validator-context}

| Member | Description |
| --- | --- |
| [`value()`](#custom-validator-context-value) | Current committed node value with its inferred type. |
| [`node`](#custom-validator-context-node) | Readonly signal of the inferred validated node; identical to `field`. |
| [`field`](#custom-validator-context-field) | Readonly signal returning the validated field, form, group, or array. |
| [`parent()`](#custom-validator-context-parent) | Direct parent node, or `null` at the root. |
| [`path()`](#custom-validator-context-path) | Reactive path from the root. |
| [Node state](#custom-validator-context-state) | Read interaction and availability signals through `ctx.node()` or `ctx.field()`. |

The context and its signals are stable. Any signal read while the validator executes becomes a
reactive dependency.

## 📖 Context reference {#context-reference}

| Member | Type | Purpose |
| --- | --- | --- |
| [`value`](#custom-validator-context-value) | `Signal<TValue>` | Current committed value |
| [`node`](#custom-validator-context-node) | `Signal<TField>` | Real node being validated |
| [`field`](#custom-validator-context-field) | `Signal<TField>` | Real node being validated |
| [`parent`](#custom-validator-context-parent) | parent-node signal | Direct parent or `null` |
| [`path`](#custom-validator-context-path) | path signal | Location from the root |

<div className="api-member-reference">

### ◆ Value and node {#value-and-node}

#### – value {#custom-validator-context-value}

**Signature:** `value: Signal<TValue>`

Call `value()` to read the committed value. The read creates a dependency, so validation runs
again when the value changes.

```ts
validator<string>(({ value }) => value().trim() ? null : { kind: 'blank' });
```

#### – node {#custom-validator-context-node}

**Signature:** `node: Signal<TField>`

The readonly signal of the validated node, identical to `field`. Prefer this name when the owner
can be a form, group, or array. Both aliases retain the same inferred node type.
See [Inline node inference](../concepts/tree-and-api.md#inline-node-inference).

#### – field {#custom-validator-context-field}

**Signature:** `field: Signal<TField>`

A stable readonly signal returning the validated node; never `null`. This is the exact same signal
as `node`. Inline primitive validators infer the concrete field, form, group, or array, including
aggregate children and array items. A separately declared validator defaults to the common node
API union; primitive-specific operations then require narrowing. Explicit `TField` context types
are preserved as `Signal<TField>`.

`context.field()` returns the node. Read its committed value with `context.value()`, which
preserves the inferred value type. Use `context.field().value()` when accessing it through the node. Reading only `field()` tracks node identity, which
stays stable across value changes and attachment or detachment. Read a returned node's value or
state signal when validation should depend on that state.
See [Navigation inside validators](../concepts/tree-and-api.md#navigation-inside-validators).

```ts
validator<string>(({ field }) => field().value() ? null : { kind: 'blank' });
```

#### – node().$api {#custom-validator-context-api}

Access the node API through `ctx.node().$api` or `ctx.field().$api`. Its type follows the validated
node, so inline validators retain the concrete primitive API. There is no direct `ctx.$api` property.
For ordinary state reads, use the node directly, such as `ctx.node().dirty()`.
See [API access](../concepts/tree-and-api.md#api-for-collisions-and-generic-code) for aliases and child-name collisions.

### ◆ Tree navigation {#tree-navigation}

#### – node().form() {#custom-validator-context-form}

Use `context.node().form()` (or `context.field().form()`) for the nearest explicit form workflow.
It returns `null` when no form owns the node. There is no flat `context.form` property.

#### – node().root() {#custom-validator-context-root}

Use `context.node().root()` (or `context.field().root()`) for the complete structural root.
It never returns `null`. There is no flat `context.root` property.

#### – parent {#custom-validator-context-parent}

**Default type:** Signal of a form, group, or array API, or `null`.

The direct parent, or `null` when the validated node is a root. A parent is always a form, group,
or array. Common node members are available directly; primitive-specific operations need narrowing.

```ts
validator<string>(({ parent }) => parent() ? null : { kind: 'mustHaveParent' });
```

#### – path {#custom-validator-context-path}

**Signature:** `path: Signal<readonly string[]>`

Property names and array indexes locating the node from its root. Array indexes are strings. A
validator that reads the path can rerun when an array item moves.

```ts
validator<string>(({ path }) => path().length > 3 ? { kind: 'tooDeep' } : null);
```

### ◆ State {#state}

#### – state signals {#custom-validator-context-state}

Read state through `ctx.node()` or its alias `ctx.field()`. These signals are not direct context
properties. The same access works in inline validators and reusable helpers.

| Signal | Meaning | Example read |
| --- | --- | --- |
| `ctx.node().submitting()` | The node or an ancestor form is submitting | `ctx.node().submitting()` |
| `ctx.node().touched()` | Interaction marked the node touched | `ctx.node().touched()` |
| `ctx.node().untouched()` | The node remains untouched | `ctx.node().untouched()` |
| `ctx.node().dirty()` | Modification was recorded | `ctx.node().dirty()` |
| `ctx.node().pristine()` | No modification was recorded | `ctx.node().pristine()` |
| `ctx.node().disabled()` | The node is excluded | `ctx.node().disabled()` |
| `ctx.node().enabled()` | The node participates normally | `ctx.node().enabled()` |
| `ctx.node().disabledReasons()` | Active disabling causes | `ctx.node().disabledReasons()` |
| `ctx.node().readonly()` | Consumers should prevent editing | `ctx.node().readonly()` |
| `ctx.node().writable()` | Consumers may permit editing | `ctx.node().writable()` |
| `ctx.node().hidden()` | Consumers should omit the node | `ctx.node().hidden()` |
| `ctx.node().visible()` | Consumers should display the node | `ctx.node().visible()` |
| `ctx.node().required()` | Current rules require a value | `ctx.node().required()` |

Any state signal read by the validator becomes a dependency.

</div>

## ✅ Validation results {#validation-results}

Runtime normalization keeps objects whose `kind` is a readable string, including `''`. It ignores
malformed objects, non-string primitives, nested error arrays, and accidentally returned nodes, emitting a
warning only in Angular development mode. `null` and `undefined` are ignored silently. Arrays
retain valid errors in order. Strings become `{ kind: 'custom', message }`, including empty strings.
`getError('custom')` returns the first matching error; use an explicit kind to distinguish rules.
See [Returning messages](../guides/validation.md#returning-messages). Ignored results
contribute no errors and do not block the form. See
[Malformed validator results](../guides/validation.md#malformed-validator-results).

A synchronous validator may return:

| Result | Meaning |
| --- | --- |
| `null`, `undefined`, or `void` | Success |
| `string` | One error with `kind: 'custom'` and the returned message, including `''` |
| `{ kind, ...data }` | One validation error |
| An array of strings and/or error objects | Several errors, preserving their order |
| Another synchronous validator | Conditional composition |
| An array of synchronous validators | Conditional composition of several rules |

After nullish and malformed entries are removed, a returned array cannot mix validators and valid errors. Async
validators cannot be returned through this composition mechanism.

An empty error array is also successful. Every error requires a discriminating `kind`; it may add
a human-readable `message` and arbitrary structured data.

## 💡 Conditional composition {#conditional-composition}

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

The outer callback tracks `requireAdult()`. When it changes, Form Nodes resolves the selected rule
against the same context.

:::warning Keep returned arrays homogeneous

After nullish entries are removed, a returned array must contain either errors or validators—not
both. A mixed array throws because its intent is ambiguous.

:::

Put `asyncValidator()` directly in the node's validator source; returning it from synchronous
composition throws. Circular composition is rejected, and composition deeper than 100 levels
throws instead of recursing indefinitely.

## ✅ Validator sources {#validator-sources}

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

## 🚨 Error ownership {#error-ownership}

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

## 🚨 Typed custom errors {#typed-custom-errors}

Custom properties are `unknown` by default. Applications and packages can augment the registry:

```ts
declare module '@ngblocks/form-nodes' {
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

## 📖 Execution behavior {#execution-behavior}

- Validators execute synchronously and reactively, in declaration order.
- Replacing validators immediately revalidates the committed value.
- Validation does not mark a node dirty or touched.
- Disabled, readonly, or hidden nodes skip validation and resume it when interactive again.
- Synchronous errors prevent async validators on that node from starting until they are resolved.

## 📐 Relevant public types {#relevant-public-types}

| Type | Purpose |
| --- | --- |
| `ValidationError` | Base `{ kind, message? }` error shape. |
| `ValidationResult` | Synchronous success, a message or error object, or an array of both. |
| `ValidatorContext<TValue>` | Complete synchronous callback context. |
| `Validator<TValue>` | Basic synchronous validation function. |
| `ComposableValidator<TValue>` | Validator that can return other validators conditionally. |
| `ValidatorSource<TValue, TField>` | One validator or a readonly validator array with nullish entries. |
| `ValidationErrorMap` | Extensible registry used by typed `getError()`. |

See [Validation](../guides/validation.md), [Built-in validators](./built-in-validators.md), and
[`asyncValidator()`](./async-validator.md).

For custom helper signatures and explicit return-type alternatives, see
[troubleshooting circular type inference](../guides/validation.md#circular-type-inference).
