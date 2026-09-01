import { Component, viewChild } from '@angular/core';

import { FormNode, FormRoot, array, field, form, required } from '@gem/ng-forms';

@Component({
  selector: 'package-consumer',
  standalone: true,
  imports: [FormNode, FormRoot],
  template: `
    <form [formNode]="profile">
      <input #nameBinding="formNode" [formNode]="profile.name">
      @for (address of profile.addresses; track address) {
        <input [formNode]="address.city">
      }
    </form>
  `,
})
export class PackageConsumer {
  readonly profile = form({
    name: field('Marco', [required]),
    addresses: array({ city: field('Zurich') }, [{ city: 'Madrid' }]),
  });

  readonly name: string | null = this.profile.name();
  readonly city: string | null = this.profile.addresses[0]!.city();
  readonly nameBinding = viewChild.required<FormNode<typeof this.profile.name>>('nameBinding');

  focusName() {
    this.nameBinding().focus();
    this.nameBinding().errors();
  }
}
