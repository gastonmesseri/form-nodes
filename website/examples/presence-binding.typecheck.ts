import { Component } from '@angular/core';
import { field, form, required, requiredTrue, FormNodeErrors, FormNodeDirective } from '../../src/public-api';

@Component({
  selector: 'app-checkout',
  imports: [FormNodeDirective, FormNodeErrors],
  template: `
    <form [formNode]="form">
      <fieldset>
        <legend>Do you need an invoice?</legend>
        <button type="button" [attr.aria-pressed]="form.wantsInvoice() === true"
          (click)="onAnswer(true)">Yes</button>
        <button type="button" [attr.aria-pressed]="form.wantsInvoice() === false"
          (click)="onAnswer(false)">No</button>
        <form-node-errors [node]="form.wantsInvoice" />
      </fieldset>
      <label>
        <input type="checkbox" [formNode]="form.acceptedTerms" />
        I accept the terms
      </label>
      <form-node-errors [node]="form.acceptedTerms" />
      <button type="submit">Continue</button>
    </form>
  `,
})
export class CheckoutComponent {
  form = form({
    wantsInvoice: field<boolean>(null, [required]),
    acceptedTerms: field(false, [requiredTrue]),
  }, {
    onSubmit: async value => {
      await fetch('/api/checkout', { method: 'POST', body: JSON.stringify(value) });
    },
  });

  onAnswer(value: boolean) {
    this.form.wantsInvoice.set(value);
    this.form.wantsInvoice.markAsTouched();
  }
}
