---
title: asyncValidator()
---

# asyncValidator()

`asyncValidator()` marks a Promise- or Observable-based validator so its owning node can manage
reactive dependencies, debounce, cancellation, pending state, errors, and stale results.

```ts
import { asyncValidator, field, form } from '@gem/ng-forms';

const usernameAvailable = asyncValidator(({ value, abortSignal }) => {
  return checkUsername(value(), abortSignal).then(available =>
    available ? null : { kind: 'usernameTaken' },
  );
});

const myForm = form({
  username: field('', [usernameAvailable]),
});
```

Async validators must be direct entries in a node's validator source. Do not return one from a
synchronous conditional validator.

## API map

| I want to… | Start with | Details |
| --- | --- | --- |
| Let Gem Forms discover dependencies | `asyncValidator(validate, options?)` | [Callback signature](#callback-signature) |
| Name dependencies explicitly | `asyncValidator({ params, validate, ... })` | [Parameterized signature](#parameterized-signature) |
| Delay, condition, or recover validation | `debounce`, `when`, `onError` | [Option reference](#option-reference) |
| Read value, tree, state, or cancellation | Callback context | [Context reference](#context-reference) |
| Return a Promise, Observable-like value, or validation result | `AsyncValidationResult` | [Return value](#return-value) |
| Understand pending, ordering, and stale work | Node validation state | [Execution lifecycle](#execution-lifecycle) |

## Signatures

```ts
asyncValidator(validate, options?);
asyncValidator({ params, validate, debounce?, when?, onError? });
```

Both signatures produce an `AsyncValidator<TValue>` accepted by a field, form, group, or array
validator source. They differ only in how reactive dependencies are selected.

| Signature | Tracked dependencies | Best for |
| --- | --- | --- |
| Callback | Signals read by `validate` and `when` | A concise validator with obvious dependencies |
| Parameterized | Signals read by `params` and `when`; `validate` is untracked | A stable, explicit request snapshot |

### Callback signature

```ts
asyncValidator<TValue, TApi = AsyncValidatorApi<TValue>>(
  validate: (context: AsyncValidatorContext<TValue, TApi>) => AsyncValidationResult,
  options?: AsyncValidatorOptions<TValue, TApi>,
): AsyncValidator<TValue>;
```

Signals read while `validate` runs become dependencies. A later change cancels the previous
execution and schedules validation again.

```ts
const tenantId = signal('public');

const usernameAvailable = asyncValidator(({ value, abortSignal }) => {
  return api.checkUsername({
    username: value(),
    tenantId: tenantId(),
  }, abortSignal).then(available =>
    available ? null : { kind: 'usernameTaken' },
  );
});
```

### Parameterized signature

```ts
asyncValidator<TValue, TParams, TApi = AsyncValidatorApi<TValue>>({
  params,
  validate,
  debounce?,
  when?,
  onError?,
}): AsyncValidator<TValue>;
```

`params` selects tracked inputs and `validate` receives the stable result. Signals read only
inside `validate` do not become dependencies.

```ts
const usernameAvailable = asyncValidator({
  params: ({ value }) => ({
    username: value(),
    tenantId: tenantId(),
  }),
  validate: ({ params, abortSignal }) => {
    return api.checkUsername(params, abortSignal).then(available =>
      available ? null : { kind: 'usernameTaken' },
    );
  },
});
```

## Options

| Option | Accepted value | Available in | Purpose |
| --- | --- | --- | --- |
| [`debounce`](#async-validator-debounce-option) | number | Both | Delays each execution |
| [`when`](#async-validator-when-option) | reactive boolean callback | Both | Enables validation conditionally |
| [`onError`](#async-validator-onerror-option) | error-mapping callback | Both | Converts operation failures |
| [`params`](#async-validator-params-option) | reactive snapshot callback | Parameterized | Selects and names dependencies |
| [`validate`](#async-validator-validate-option) | async callback | Parameterized | Validates one params snapshot |

<div className="api-member-reference">

## Option reference

### Shared options

#### debounce {#async-validator-debounce-option}

**Signature:** `debounce?: number`

Delays execution by this many milliseconds. A new trigger cancels and restarts the complete delay.
The node reports `pending() === true` during both debounce and execution.

```ts
asyncValidator(
  ({ value, abortSignal }) => checkUsername(value(), abortSignal),
  { debounce: 300 },
);
```

The value must be a number of milliseconds. This option delays validation after a committed value
or another tracked dependency changes.

#### when {#async-validator-when-option}

**Signature:** `when?: (context: AsyncValidatorBaseContext<TValue, TApi>) => boolean`

Reactively controls whether the validator is active. A false result cancels pending work and clears
this validator's current result. When it becomes true, validation is scheduled again.

```ts
asyncValidator(({ value, abortSignal }) => checkUsername(value(), abortSignal), {
  when: ({ value }) => (value()?.length ?? 0) >= 3,
});
```

The parameterized signature does not evaluate `params` while `when` is false.

#### onError {#async-validator-onerror-option}

**Signature:** `onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi>) => ValidationResult`

Maps a rejected Promise, thrown error, or Observable error to an ordinary validation result.

```ts
asyncValidator(({ value }) => checkUsername(value()), {
  onError: () => ({
    kind: 'usernameCheckUnavailable',
    message: 'The username could not be checked. Try again later.',
  }),
});
```

Without `onError`, an operation failure contributes no validation error. Stale or destroyed
executions do not publish a mapped result.

### Explicit parameters {#explicit-parameters}

#### params {#async-validator-params-option}

**Signature:** `params: (context: AsyncValidatorBaseContext<TValue, TApi>) => TParams`

Reactively derives the snapshot passed to `validate`. Successive results are compared before work
restarts.

```ts
const location = signal({ city: 'Zurich', country: 'Switzerland' });

asyncValidator({
  params: ({ value }) => ({
    storeName: value(),
    city: location().city,
  }),
  validate: ({ params, abortSignal }) => api.checkStore(params, abortSignal),
});
```

Primitives use `Object.is()`. Objects and arrays are compared one level deep:

- a new object with equal first-level values does not restart validation;
- changing, adding, or removing a first-level value restarts it;
- nested objects and arrays are compared by reference, not recursively.

Include only values that should restart the request.

The signals read by `params` determine when Gem Forms reevaluates the snapshot. Angular signals
track the signal read, not an individual property of an object stored in that signal. The shallow
comparison then determines whether validation actually restarts:

```ts
const account = signal({ tenantId: 'public', theme: 'light' });

const usernameAvailable = asyncValidator({
  params: ({ value }) => ({
    username: value(),
    tenantId: account().tenantId,
  }),
  validate: ({ params, abortSignal }) => {
    return api.checkUsername(params, abortSignal);
  },
});

account.set({ tenantId: 'public', theme: 'dark' });
// `params` is reevaluated, but validation does not restart.

account.set({ tenantId: 'private', theme: 'dark' });
// `tenantId` changed, so stale work is cancelled and validation restarts.
```

Returning a fresh object is therefore safe: allocation alone does not trigger another request.

#### validate {#async-validator-validate-option}

**Signature:** `validate: (context: ParameterizedAsyncValidatorContext<TValue, TParams, TApi>) => AsyncValidationResult`

Validates one stable `params` snapshot. It runs untracked, so put every reactive request input in
`params`.

```ts
asyncValidator({
  params: ({ value }) => ({ username: value() }),
  validate: ({ params, abortSignal }) => {
    return api.isUsernameAvailable(params.username, abortSignal).then(available =>
      available ? null : { kind: 'usernameTaken' },
    );
  },
});
```

</div>

## Context reference

Every callback receives state for the node being validated. `abortSignal` is added to validation
executions, and `params` only to parameterized `validate`.

| Member | Type | Available in |
| --- | --- | --- |
| [`value`](#async-validator-context-value) | `Signal<TValue>` | All callbacks |
| [`field`](#async-validator-context-field) | callable node | All callbacks |
| [`api`](#async-validator-context-api) | `TApi` | All callbacks |
| [`form`](#async-validator-context-form) | root-node signal | All callbacks |
| [`parent`](#async-validator-context-parent) | parent-node signal | All callbacks |
| [`path`](#async-validator-context-path) | path signal | All callbacks |
| [State signals](#async-validator-context-state) | readonly signals | All callbacks |
| [`abortSignal`](#async-validator-context-abortsignal) | `AbortSignal` | `validate` |
| [`params`](#async-validator-context-params) | `TParams` | Parameterized `validate` |

<div className="api-member-reference">

### Node and navigation

#### value {#async-validator-context-value}

**Signature:** `value: Signal<TValue>`

The current committed value. Call it as `value()`. Reading it in the callback signature creates a
dependency; reading it in `params` contributes to the derived snapshot.

#### field {#async-validator-context-field}

**Signature:** `field: TField`

The real callable node. The name remains `field` even when the owner is a form, group, or array.
Use it when node identity or a node-specific member is required.

#### api {#async-validator-context-api}

**Signature:** `api: TApi`

The typed common node API, including value, validation, navigation, state, and operations. Its
default is `AsyncValidatorApi<TValue>`; generics can provide a more exact API type. See
[Node API](./node-api.md).

#### form {#async-validator-context-form}

**Signature:** `form: Signal<PublicNode<Node> | null>`

The root aggregate owning this node, or `null` for a standalone node.

#### parent {#async-validator-context-parent}

**Signature:** `parent: Signal<PublicNode<Node> | null>`

The direct parent, or `null` when the validated node is a root.

#### path {#async-validator-context-path}

**Signature:** `path: Signal<readonly string[]>`

Property names and array indexes locating the node from its root. Array indexes are strings.

### State

#### state signals {#async-validator-context-state}

| Signal | Meaning |
| --- | --- |
| `submitting()` | The node or its root form is submitting |
| `touched()` / `untouched()` | Whether interaction marked it touched |
| `dirty()` / `pristine()` | Whether modification was recorded |
| `disabled()` / `enabled()` | Whether it participates normally |
| `disabledReasons()` | Active disabling causes |
| `readonly()` / `writable()` | Whether consumers should permit editing |
| `hidden()` / `visible()` | Whether consumers should display it |
| `required()` | Whether current rules require a value |

Reading one in the callback form or in `params` makes it a dependency.

### Execution-only members

#### abortSignal {#async-validator-context-abortsignal}

**Signature:** `abortSignal: AbortSignal`

Belongs to one execution and aborts when it becomes stale, inactive, or destroyed. Pass it to
cancellable APIs:

```ts
asyncValidator(({ value, abortSignal }) => {
  return fetch(`/api/users/${encodeURIComponent(value())}`, { signal: abortSignal })
    .then(response => response.json())
    .then(result => result.available ? null : { kind: 'usernameTaken' });
});
```

Gem Forms discards stale results even when the underlying API ignores this signal.

#### params {#async-validator-context-params}

**Signature:** `params: TParams`

The stable snapshot for this parameterized execution. It is absent from the callback signature,
`when`, and `onError`.

</div>

## Return value

```ts
type AsyncValidationResult =
  | PromiseLike<ValidationResult>
  | ObservableLike<ValidationResult>;
```

| Resolved or emitted result | Effect |
| --- | --- |
| `null`, `undefined`, or `void` | Validation succeeds |
| `{ kind, message?, ... }` | Adds one error |
| `readonly ValidationError[]` | Adds several errors in returned order |

Observable-like values use their first emission and are then unsubscribed. RxJS Observables satisfy
the structural contract, but Gem Forms does not require RxJS.

`asyncValidator()` returns the marked validator function—not a node or a separate instance with
properties and methods. Add it directly to a `validators` source.

## Execution lifecycle

### Scheduling and status

- Synchronous validators run first and block async validators while they have errors.
- `pending()` is true during debounce and execution.
- Pending without an existing error produces `validationStatus() === 'unknown'`.
- A completed error makes the node invalid while another async validator may remain pending.
- Results remain ordered by validator declaration, not completion time.

### Dependencies and cancellation

- A dependency change cancels stale work and restarts the complete debounce.
- Simultaneous value, params, and `when` changes coalesce into one latest execution.
- A false `when` cancels work and clears this validator's result.
- Disabled, readonly, or hidden state cancels work; returning to interactive state restarts it.
- Destroying the lifecycle owner cancels delay and work.
- Stale Promise resolutions, Observable emissions, and mapped errors are ignored.

## Public types

| Type | Purpose |
| --- | --- |
| `AsyncValidator<TValue>` | Marked validator accepted by validator sources |
| `AsyncValidatorOptions<TValue, TApi>` | Callback-signature options |
| `ParameterizedAsyncValidatorConfig<TValue, TParams, TApi>` | Complete parameterized configuration |
| `ParameterizedAsyncValidatorOptions<TValue, TParams, TApi>` | Parameterized marker options |
| `AsyncValidatorBaseContext<TValue, TApi>` | Context shared by `params`, `when`, and `onError` |
| `AsyncValidatorContext<TValue, TApi>` | Callback context with `abortSignal` |
| `ParameterizedAsyncValidatorContext<TValue, TParams, TApi>` | Context with `abortSignal` and `params` |
| `AsyncValidationResult` | Promise-like or Observable-like validation operation |
| `ValidationResult` | Success, one error, or several errors |

See [Async validation](../guides/async-validation.md) for task-oriented examples and
[Advanced behavior](../advanced/behavior-details.md#asynchronous-scheduling-and-dependencies) for
additional scheduling and lifecycle semantics.
