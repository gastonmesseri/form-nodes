---
title: Remote validation
---

# Validate against a remote API

Wrap remote work in `asyncValidator()` so the node owns debounce, cancellation, pending state, and
stale-result protection. The component keeps the pending and error UI next to the validated model:

```ts
import { Component } from '@angular/core';
import { asyncValidator, field, form, FormNode, minLength, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-username-editor',
  imports: [FormNode],
  template: `
    <input [formNode]="myForm.username" />

    @if (myForm.username.pending()) {
      <p>Checking username…</p>
    }

    @if (myForm.username.getError('usernameTaken'); as error) {
      <p class="error">{{ error.message }}</p>
    }
  `,
})
export class UsernameEditor {
  myForm = form({
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
          message: 'Availability could not be checked.',
        }),
      }),
    ]),
  });
}
```

Every execution receives a new `AbortSignal`. A newer value aborts the previous request and cannot be overwritten by its late result. `onError` converts transport failure into a business-visible validation error; omit it when failures should propagate instead.

See [Async validation](../guides/async-validation.md).
