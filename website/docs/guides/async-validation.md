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

`onError` converts a rejected promise or observable error into a validation result. Without it, a
rejected operation contributes no validation error. Its pending state ends and
the rejection is not confused with a domain-validation failure. Use `onError` when service failure
must block the form or produce a visible message.

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

With explicit `params`, the library compares the returned result with the previous one before
starting another validation. A newly allocated object does not cause another request when all its
first-level values remain equal. Changing a first-level value does; nested objects compare by
reference rather than recursively. This makes object-literal params convenient while avoiding
duplicate work for unrelated signal changes.

The `validate` callback runs untracked, so put every dependency in `params` rather than reading
signals only after asynchronous work begins. The
[`asyncValidator()` reference](../reference/async-validator.md#explicit-parameters) includes a
concrete example of which changes do and do not restart validation.

Without `params`, signals read before the callback's first asynchronous boundary are discovered as
dependencies automatically. Prefer `params` for reusable validators because it makes the service
inputs and restart conditions explicit.

## Execution order

- The node becomes pending synchronously; the first callback begins in the next microtask.
- Synchronous validation runs first. Async validators do not run while synchronous errors exist.
- A dependency change cancels stale work and restarts the validator's complete debounce.
- Synchronous changes to several tracked dependencies are coalesced into one run with their latest
  values.
- Promise results are ignored after cancellation even when the service ignores `abortSignal`.
- Observable-like results use the first emitted validation result and unsubscribe afterward.
- Multiple validators run independently, while exposed errors remain in declaration order.

When some async validators have completed with errors and others remain pending, `invalid()` is
already true and `pending()` remains true. Pending work produces `'unknown'` only while no completed
error makes the node invalid.

## Lifecycle

Async validation works inside and outside Angular injection contexts. When a node is created with an explicit or current injector, that injector's `DestroyRef` owns its watcher. Outside dependency injection, the library uses weak ownership so unreachable form trees can be garbage-collected.

Disabling, hiding, or marking a node readonly cancels its active async work. Returning it to an
interactive state starts validation again against the current committed value.

See [Advanced behavior and edge cases](../advanced/behavior-details.md#asynchronous-scheduling-and-dependencies)
for exact dependency, scheduling, ownership, and stale-result semantics. The
[`asyncValidator()` reference](../reference/async-validator.md) lists every signature, option, and
context member.
