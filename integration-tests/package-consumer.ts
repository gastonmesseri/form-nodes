import { Component } from '@angular/core';

import { FormNodeDirective, array, field, form, required } from '@gem/ng-forms';

@Component({
  selector: 'package-consumer',
  standalone: true,
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="profile.name">
    @for (address of profile.addresses; track address) {
      <input [formNode]="address.city">
    }
  `,
})
export class PackageConsumer {
  readonly profile = form({
    name: field('Marco', [required]),
    addresses: array({ city: field('Zurich') }, [{ city: 'Madrid' }]),
  });

  readonly name: string | null = this.profile.name();
  readonly city: string | null = this.profile.addresses[0]!.city();
}
