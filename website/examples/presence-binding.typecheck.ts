import { Component } from '@angular/core';
import { field, form, required, requiredTrue, FormNodeErrors, FormNodeDirective } from '../../src/public-api';

@Component({
  selector: 'app-checkout',
  imports: [FormNodeDirective, FormNodeErrors],
  template: `
    <form [formNode]="checkout">
      <fieldset>
        <legend>Do you need an invoice?</legend>
        <button type="button" [attr.aria-pressed]="checkout.wantsInvoice() === true"
          (click)="answer(true)">Yes</button>
        <button type="button" [attr.aria-pressed]="checkout.wantsInvoice() === false"
          (click)="answer(false)">No</button>
        <form-node-errors [node]="checkout.wantsInvoice" />
      </fieldset>
      <label>
        <input type="checkbox" [formNode]="checkout.acceptedTerms" />
        I accept the terms
      </label>
      <form-node-errors [node]="checkout.acceptedTerms" />
      <button type="submit">Continue</button>
    </form>
  `,
})
export class CheckoutComponent {
  checkout = form({
    wantsInvoice: field<boolean>(null, [required]),
    acceptedTerms: field(false, [requiredTrue]),
  }, {
    onSubmit: async value => {
      await fetch('/api/checkout', { method: 'POST', body: JSON.stringify(value) });
    },
  });

  answer(value: boolean) {
    this.checkout.wantsInvoice.set(value);
    this.checkout.wantsInvoice.markAsTouched();
  }
}
