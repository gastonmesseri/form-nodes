import { Component, signal } from '@angular/core';
import { email, field, form, required, FormNodeErrors, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-contact-form',
  imports: [FormNodeErrors, FormNodeDirective],
  template: `
    <form [formNode]="form">
      <label for="contact-email">Email</label>
      <input id="contact-email" type="email" autocomplete="email" [formNode]="form.email" />
      <form-node-errors [node]="form.email" />

      <button type="submit">Continue</button>
      <button type="reset">Hide errors</button>
      <button type="button" (click)="form.resetToInitial()">Start over</button>
    </form>

    @if (submittedEmail(); as address) {
      <p>Submitted email: {{ address }}</p>
    }
  `,
})
export class ContactForm {
  submittedEmail = signal<string | null>(null);

  form = form({
    email: field('', [required('Enter your email address.'), email('Enter a valid email address.')]),
  }, {
    onSubmit: (value) => {
      this.submittedEmail.set(value.email);
    },
  });
}
