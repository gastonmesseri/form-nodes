import { field, form } from '@ngblocks/form-nodes';
import { Component, Injector, inject, signal } from '@angular/core';

@Component({ template: '' })
export class ProfilePage {
  injector = inject(Injector);
  latestName = signal<string | null>('Ada');
  profile = form({ name: field('Ada') });

  constructor() {
    // This subscription ends automatically when the component is destroyed.
    this.profile.name.onValueChange(value => this.latestName.set(value));
  }

  observeLater() {
    // An explicit owner also works when registration happens outside injection context.
    this.profile.onValueChange(value => this.latestName.set(value.name), {
      injector: this.injector,
    });
  }
}
