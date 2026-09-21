import { Component } from '@angular/core';
import { FormNodeDirective, email, field, form, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-account-editor',
  imports: [FormNodeDirective],
  template: `
    <form [formNode]="form">
      <label>
        Email
        <input type="email" [formNode]="form.email" />
      </label>

      @if (form.email.touched() && form.email.invalid()) {
        <p>{{ form.email.errors()[0]?.message }}</p>
      }

      <button type="reset">Reset interaction state</button>
      <button type="submit" [disabled]="form.submitting()">Save</button>
    </form>
  `,
})
export class AccountEditor {
  form = form({
    email: field('', [required, email]),
  }, {
    onSubmit: async value => {
      await Promise.resolve(value);
    },
  });
}
