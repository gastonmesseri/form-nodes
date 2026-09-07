import { Component, input, model, signal, type ApplicationConfig } from '@angular/core';

import { field, form, FormNode, provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [provideFormNodesConfig({ syncControlInputs: false })],
};

@Component({
  selector: 'app-text-control',
  template: `
    <input #text [value]="value()" [disabled]="disabled()" [readOnly]="readonly()"
      (input)="value.set(text.value)">
  `,
})
export class TextControl {
  value = model('');

  disabled = input(false);

  readonly = input(false);
}

@Component({
  imports: [FormNode, TextControl],
  template: `
    <app-text-control [formNode]="profile.name" [disabled]="saving()" [readonly]="locked()" />
  `,
})
export class ProfileComponent {
  profile = form({ name: field('Mark') });

  saving = signal(false);

  locked = signal(false);
}
