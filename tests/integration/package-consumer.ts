import { Component, viewChild } from '@angular/core';

import { FormNode, array, field, form, group, required } from '@gem/ng-forms';

@Component({
  selector: 'package-consumer',
  standalone: true,
  imports: [FormNode],
  template: `
    <form [formNode]="profile">
      <input #nameBinding="formNode" [formNode]="profile.name">
      <input [formNode]="dynamicAge">
      @for (address of profile.addresses; track address) {
        <input [formNode]="address.city">
      }
    </form>
  `,
})
export class PackageConsumer {
  readonly profile = form({
    name: field('Marco', [required]),
    preferences: group({ theme: field('dark') }),
    addresses: array({ city: field('Zurich') }, [{ city: 'Madrid' }]),
  });

  readonly name: string | null = this.profile.name();
  readonly city: string | null = this.profile.addresses[0]!.city();
  readonly theme: string | null = this.profile.preferences.theme();
  readonly dynamicAge = this.profile.add('age', 36);
  readonly dynamic = this.profile.add({ nickname: '', location: { city: 'Zurich' } });
  readonly dynamicAgeValue: number | null = this.dynamicAge();
  readonly dynamicNickname: string | null = this.dynamic.nickname();
  readonly dynamicCity: string | null = this.dynamic.location.city();
  readonly nameBinding = viewChild.required<FormNode<typeof this.profile.name>>('nameBinding');

  focusName() {
    this.nameBinding().focus();
    this.nameBinding().errors();
  }
}
