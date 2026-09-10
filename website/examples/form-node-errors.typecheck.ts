import { Component, signal } from '@angular/core';
import { email, field, form, required, FormNodeErrors, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-contact-form',
  imports: [FormNodeErrors, FormNodeDirective],
  template: `
    <form [formNode]="contact">
      <label for="contact-email">Email</label>
      <input
        id="contact-email"
        type="email"
        autocomplete="email"
        aria-describedby="contact-email-errors"
        [formNode]="contact.email"
      />
      <form-node-errors id="contact-email-errors" [node]="contact.email" />

      <button type="submit">Continue</button>
      <button type="reset">Hide errors</button>
      <button type="button" (click)="contact.resetToInitial()">Start over</button>
    </form>

    @if (submittedEmail(); as address) {
      <p>Submitted email: {{ address }}</p>
    }
  `,
})
export class ContactForm {
  submittedEmail = signal<string | null>(null);

  contact = form({
    email: field('', [required('Enter your email address.'), email('Enter a valid email address.')]),
  }, {
    onSubmit: (value) => {
      this.submittedEmail.set(value.email);
    },
  });
}
