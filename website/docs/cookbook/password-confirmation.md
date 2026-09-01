---
title: Confirm a password
---

# Confirm a password

Use `equalTo()` with a reactive source pointing to the password field. Keeping the model and
bindings in one component makes the complete interaction visible:

```ts
import { Component } from '@angular/core';

import { equalTo, field, form, FormNode } from '@gem/ng-forms';

@Component({
  selector: 'app-password-editor',
  imports: [FormNode],
  template: `
    <input type="password" [formNode]="myForm.password" />
    <input type="password" [formNode]="myForm.confirmation" />

    @if (myForm.confirmation.touched()) {
      @if (myForm.confirmation.getError('equalTo'); as error) {
        <p class="error">{{ error.message }}</p>
      }
    }
  `,
})
export class PasswordEditor {
  password = field('');

  myForm = form({
    password: this.password,
    confirmation: field('', [
      equalTo(() => this.password(), {
        message: 'Passwords must match.',
      }),
    ]),
  });
}
```

The separate `password` reference avoids circular TypeScript inference while still becoming the exact child stored at `myForm.password`.

`equalTo()` uses `Object.is()` and tracks the expected-value source. Changing the password therefore revalidates confirmation automatically. Its error omits both compared values so passwords do not leak into error summaries, logs, or translation callbacks.

Add `required` to both fields when empty matching passwords must not be accepted.

See [Built-in validators: equalTo](../reference/built-in-validators.md#equalto).
