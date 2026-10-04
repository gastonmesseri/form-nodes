import { FormNodeDirective } from '@ngblocks/form-nodes';
import { Component, Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DescriptionStore {
  description = signal('');
}

@Component({
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="store.description" />
  `,
})
export class DescriptionEditor {
  store = inject(DescriptionStore);
}
