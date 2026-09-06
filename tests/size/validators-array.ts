import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { FormNode, array, field, form, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'size-app',
  standalone: true,
  imports: [FormNode],
  template: `
    <form [formNode]="profile">
      <input [formNode]="profile.name">
      @for (address of profile.addresses; track address) {
        <input [formNode]="address.city">
      }
      <p>{{ profile.valid() }}</p>
    </form>
  `,
})
export class SizeApp {
  profile = form({
    name: field('Marco', [required]),
    addresses: array({ city: field('', [required]) }, { initialValue: 2 }),
  });
}

bootstrapApplication(SizeApp).catch(console.error);
