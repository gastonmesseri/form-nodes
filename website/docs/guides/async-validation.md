---
title: Async validation
---

# Async validation

Wrap asynchronous validators explicitly with `asyncValidator()`. This lets the node own pending state, debounce, cancellation, and stale-result handling without executing arbitrary validators to classify them.

```ts
import { asyncValidator, field, required } from '@gem/ng-forms';

const myForm = form({
  username: field('', [
    required,
    asyncValidator(async ({ value, abortSignal }) => {
      const available = await checkUsername(value(), abortSignal);

      return available
        ? null
        : { kind: 'usernameTaken', message: 'This username is already in use.' };
    }, { debounce: 300 }),
  ]),
});
```

The callback may return a promise, an Observable-like value, a validation result, or a collection of those results.

## Pending and cancellation

While current asynchronous work is running, `pending()` is true. With no completed error, `validationStatus()` is `unknown` and both `valid()` and `invalid()` are false. A completed error makes the status `invalid` even while other validators remain pending.

Each execution receives its own `AbortSignal`. A newer execution aborts the previous signal, unsubscribes from a previous observable, and ignores stale results even when the underlying work cannot be cancelled.

The validator's `debounce` delays validation work. This is independent from a field's control-value debounce.

## Conditions and failures

Use `when` to skip work based on the current context:

```ts
const availability = asyncValidator(
  async ({ value, abortSignal }) => {
    const available = await checkUsername(value(), abortSignal);
    return available ? null : { kind: 'usernameTaken' };
  },
  {
    when: ({ value }) => value().length >= 3,
    onError: () => ({ kind: 'availabilityUnavailable' }),
  },
);
```

`onError` converts a rejected promise or observable error into a validation result. Without it, the failure is surfaced according to the validator pipeline rather than treated as a successful validation.

## Reactive dependencies

Signals read by the callback, `when`, or options participate in dependency tracking. Changing a dependency schedules a new execution even when the field value is unchanged.

For parameterized validation, separate reactive parameter discovery from untracked asynchronous work:

```ts
const tenantId = signal('public');

const usernameAvailable = asyncValidator({
  params: () => ({ tenantId: tenantId() }),
  debounce: 300,
  validate: async ({ value, params, abortSignal }) => {
    const available = await api.checkUsername(params.tenantId, value(), abortSignal);
    return available ? null : { kind: 'usernameTaken' };
  },
});
```

## Lifecycle

Async validation works inside and outside Angular injection contexts. When a node is created with an explicit or current injector, that injector's `DestroyRef` owns its watcher. Outside dependency injection, the library uses weak ownership so unreachable form trees can be garbage-collected.
