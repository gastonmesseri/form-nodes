import { Component } from '@angular/core';

import { field, FormNode, group } from 'form-nodes';

@Component({
  imports: [FormNode],
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
