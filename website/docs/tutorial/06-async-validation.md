---
title: 6. Validate asynchronously
---

# 6. Validate asynchronously

Add a username and check its availability with `asyncValidator()`:

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
          : {
              kind: 'usernameTaken',
              message: 'This username is already in use.',
            };
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

Add `asyncValidator` to the package import.

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

Continue with [Step 7: Submit the form](./07-submission.md).
