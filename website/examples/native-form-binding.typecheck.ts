import { Component } from '@angular/core';

import { FormNode, email, field, form, required } from '@gem/ng-forms';

@Component({
  selector: 'app-account-editor',
  imports: [FormNode],
  template: `
    <form [formNode]="accountForm">
      <label>
        Email
        <input type="email" [formNode]="accountForm.email" />
      </label>

      @if (accountForm.email.touched() && accountForm.email.invalid()) {
        <p>{{ accountForm.email.errors()[0]?.message }}</p>
      }

      <button type="reset">Reset interaction state</button>
      <button type="submit" [disabled]="accountForm.submitting()">Save</button>
    </form>
  `,
})
export class AccountEditor {
  accountForm = form({
    email: field('', [required, email]),
  }, {
    submission: {
      action: async (_form, value) => {
        await Promise.resolve(value);
      },
    },
  });
}
