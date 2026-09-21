import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-delivery-options',
  imports: [FormNodeDirective],
  template: `
    <fieldset>
      <legend>Delivery method</legend>

      <label>
        <input type="radio" value="standard" [formNode]="form.delivery" />
        Standard delivery
      </label>

      <label>
        <input type="radio" value="express" [formNode]="form.delivery" />
        Express delivery
      </label>
    </fieldset>

    <p>Selected delivery: {{ form.delivery() }}</p>
  `,
})
export class DeliveryOptions {
  form = form({
    delivery: field('standard'),
  });
}
