import { Component } from '@angular/core';
import { FormNodeDirective, email, field, form, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-account-editor',
  imports: [FormNodeDirective],
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
    onSubmit: async value => {
      await Promise.resolve(value);
    },
  });
}
