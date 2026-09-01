---
title: 6. Validate asynchronously
---

# 6. Validate asynchronously

Start with an ordinary asynchronous function that returns either an error or `null`:

```ts
myForm = form({
  username: field('', [
    asyncValidator(async ({ value }) => {
      const available = await api.isUsernameAvailable(value() ?? '');

      return available
        ? null
        : { kind: 'usernameTaken', message: 'This username is already in use.' };
    }),
  ]),
});
```

Add `asyncValidator` to the package import. The node exposes `pending()` while the promise is
unresolved and updates its normal error and validity signals when the result arrives.

An `async` function is only one way to produce that promise. The validator may return a `Promise`
directly instead:

```ts
myForm = form({
  username: field('', [
    asyncValidator(({ value }) => {
      return api.isUsernameAvailable(value() ?? '')
        .then(available => {
          if (!available) return { kind: 'usernameTaken', message: 'This username is already in use.' };
        });
    }),
  ]),
});
```

Both forms have the same validation and pending-state behavior; choose the style that keeps the
asynchronous operation easiest to read.

## Add production request behavior

The same validator can add conditions, debounce, cancellation, and network-error handling when the
real use case needs them:

```ts
myForm = form({
  account: {
    username: field('', [
      required,
      minLength(3),
      asyncValidator(async ({ value, abortSignal }) => {
        const response = await fetch(
          `/api/usernames/${encodeURIComponent(value() ?? '')}`,
          { signal: abortSignal },
        );
        const result = await response.json() as { available: boolean };

        return result.available
          ? null
          : { kind: 'usernameTaken', message: 'This username is already in use.' };
      }, {
        debounce: 300,
        when: ({ value }) => (value()?.length ?? 0) >= 3,
        onError: () => ({
          kind: 'usernameCheckUnavailable',
          message: 'Username availability could not be checked.',
        }),
      }),
    ]),
  },

  // Existing profile, address, and contacts branches...
});
```

The validator:

- Waits 300 ms before starting network work.
- Runs only for usernames with at least three characters.
- Receives an `AbortSignal` for the current execution.
- Aborts or ignores stale work when dependencies change.
- Converts network failure into a validation error with `onError`.

Render pending and error state like any other signal:

```html
<input [formNode]="myForm.account.username" />

@if (myForm.account.username.pending()) {
  <p>Checking availability…</p>
}

@if (myForm.account.username.getError('usernameTaken'); as error) {
  <p class="error">{{ error.message }}</p>
}
```

Async-validator debounce is independent from field control-value debounce. The former delays validation work; the latter delays committing UI values.

## Related guides and reference

- [Async validation](../guides/async-validation.md) details triggers, reactive dependencies,
  cancellation, errors, cleanup ownership, and work outside injection context.
- [Value flow and debounce](../guides/value-flow-and-debounce.md) distinguishes validator debounce
  from control-value debounce and documents flush/reset behavior.
- [Errors and status](../guides/errors-and-status.md) explains pending aggregation and asynchronous
  error ownership.
- [Validate against a remote API](../cookbook/remote-validation.md) provides a focused reusable
  recipe.

Continue with [Step 7: Submit the form](./07-submission.md).
