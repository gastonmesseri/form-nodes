---
title: asyncValidator()
---

# `asyncValidator()`

`asyncValidator()` marks a Promise- or Observable-based validator so a node can manage its
debounce, reactive dependencies, cancellation, pending state, and stale results explicitly.

```ts
import { asyncValidator, field, form } from '@gem/ng-forms';

const myForm = form({
  username: field('', [
    asyncValidator(({ value, abortSignal }) => {
      return checkUsername(value(), abortSignal).then(available =>
        available ? null : { kind: 'usernameTaken' },
      );
    }),
  ]),
});
```

Async validators must be direct entries in a node's validator source. Do not return one from a
synchronous conditional validator.

## API map

| I want to… | Details |
| --- | --- |
| Choose callback or explicit-parameter syntax | [Signatures](#signatures) |
| Read node state or cancellation | [Callback context](#callback-context) |
| Configure debounce, conditions, or failures | [Options](#options) |
| Return a Promise, Observable-like value, or validation result | [Return value](#return-value) |
| Control exactly which dependency changes rerun work | [Explicit parameters](#explicit-parameters) |
| Understand pending state, ordering, cancellation, and stale work | [Status, ordering, and cancellation](#status-ordering-and-cancellation) |

## Signatures

```ts
asyncValidator(validate, options?);
asyncValidator({ params, validate, debounce?, when?, onError? });
```

The callback form discovers reactive dependencies automatically. The configuration form makes
dependencies explicit through a typed `params` snapshot.

## Callback context

| Member | Description |
| --- | --- |
| `value()` | Current committed value of the validated node. |
| `field` | Real callable node being validated. The name is retained for compatibility even when the owner is a form or array. |
| `api` | Common typed node API, including validation, interaction, navigation, and value operations. |
| `form()` | Root aggregate that owns the node, or `null` for a standalone field. |
| `parent()` | Direct parent node, or `null` at the root. |
| `path()` | Reactive path from the root. |
| State signals | `touched`, `dirty`, `disabled`, `readonly`, `hidden`, `required`, `submitting`, and their documented complements. |
| `abortSignal` | Signal belonging only to the current execution. It aborts when that execution becomes stale. |

Parameterized validators additionally receive `params`, the stable snapshot returned for that
execution.

## Options

| Option | Accepted value | Description |
| --- | --- | --- |
| `debounce` | Number of milliseconds | Delays starting or publishing validation. This is separate from control-value debounce. |
| `when` | `(context) => boolean` | Reactively enables the validator. A false result cancels and clears its current async state. |
| `onError` | `(error, context) => ValidationResult` | Maps a rejected Promise or Observable error into a domain-validation result. |
| `params` | `(context) => TParams` | Explicitly derives the tracked snapshot passed to `validate`. Available in the configuration signature. |

Unlike field control debounce, async-validator `debounce` accepts milliseconds only; `'blur'` and
custom debounce functions are not async-validation options.

## Return value

The validation callback returns a Promise-like or Observable-like operation resolving or emitting:

- `null`, `undefined`, or `void` for success;
- one validation error; or
- a readonly array of validation errors.

Observable-like values use their first emission. RxJS Observables satisfy the structural contract,
but the library does not require RxJS as a dependency.

## Explicit parameters

```ts
const tenantId = signal('public');

const usernameAvailable = asyncValidator({
  params: ({ value }) => ({
    username: value(),
    tenantId: tenantId(),
  }),
  debounce: 300,
  validate: ({ params, abortSignal }) => {
    return api.checkUsername(params, abortSignal).then(available =>
      available ? null : { kind: 'usernameTaken' },
    );
  },
});
```

Signals read by `params` are dependencies, but a dependency emitting does not automatically mean a
new request. The library first compares the newly returned params with the previous params.

For plain objects and arrays, it compares their first-level properties or entries with `Object.is()`:

- returning a new object with the same first-level values does **not** rerun validation;
- changing, adding, or removing a first-level value does rerun validation;
- nested objects are not compared recursively—their references are compared;
- primitive params use `Object.is()` directly.

```ts
const account = signal({ tenantId: 'public', theme: 'light' });

const usernameAvailable = asyncValidator({
  params: ({ value }) => ({
    username: value(),
    tenantId: account().tenantId,
  }),
  validate: ({ params, abortSignal }) => {
    return api.checkUsername(params, abortSignal).then(available =>
      available ? null : { kind: 'usernameTaken' },
    );
  },
});

account.set({ tenantId: 'public', theme: 'dark' });
// No new validation: `username` and `tenantId` are unchanged.

account.set({ tenantId: 'private', theme: 'dark' });
// Validation runs again because `tenantId` changed.
```

This lets `params` return a readable object literal without causing duplicate requests merely
because that object is newly allocated. Include only values that should restart validation.

`validate` runs untracked in this form; signals read only inside it do not become dependencies.

## Status, ordering, and cancellation

- `pending()` is true during validator debounce and execution.
- Pending without an existing error produces `validationStatus() === 'unknown'`.
- A completed error makes the node invalid even while another async validator remains pending.
- Multiple results remain ordered by validator declaration, not completion time.
- A value or dependency change cancels stale work and restarts the complete debounce.
- Disabled, readonly, or hidden state cancels work; validation restarts when interaction returns.
- Synchronous errors prevent async validators from running until synchronous validation succeeds.
- Rejections contribute no validation error unless `onError` maps them to one.

See [Async validation](../guides/async-validation.md) for task-oriented examples and
[Advanced behavior](../advanced/behavior-details.md#asynchronous-scheduling-and-dependencies) for
exact scheduling and lifecycle semantics.
