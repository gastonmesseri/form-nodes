import { Component } from '@angular/core';
import { field, FormNodeDirective, group } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="address.city" />
    <input [formNode]="address.country" />
  `,
})
export class AddressComponent {
  address = group({
    city: field(''),
    country: field(''),
  });

  focusFirstControl() {
    this.address.focus({ preventScroll: true });
  }
}
