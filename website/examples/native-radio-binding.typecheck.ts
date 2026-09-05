import { Component } from '@angular/core';

import { field, form, FormNode } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-delivery-options',
  imports: [FormNode],
  template: `
    <fieldset>
      <legend>Delivery method</legend>

      <label>
        <input type="radio" value="standard" [formNode]="checkout.delivery" />
        Standard delivery
      </label>

      <label>
        <input type="radio" value="express" [formNode]="checkout.delivery" />
        Express delivery
      </label>
    </fieldset>

    <p>Selected delivery: {{ checkout.delivery() }}</p>
  `,
})
export class DeliveryOptions {
  checkout = form({
    delivery: field('standard'),
  });
}
