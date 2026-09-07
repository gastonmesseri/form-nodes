import { Component, input, model, signal } from '@angular/core';
import { field, form, required, minLength, FormNode } from '@ngblocks/form-nodes';

// text-control.component.ts
@Component({
  selector: 'app-text-control',
  template: `
    <input #text [value]="value()" [disabled]="disabled()" [required]="required()"
      [attr.minlength]="minLength()" (input)="value.set(text.value)">
  `,
})
export class TextControl {
  value = model('');

  disabled = input(false);

  required = input(false);

  minLength = input<number | undefined>(undefined);
}

// profile.component.ts
@Component({
  imports: [FormNode, TextControl],
  template: `<app-text-control [formNode]="profile.name" />`,
})
export class ProfileComponent {
  saving = signal(false);

  profile = form({
    name: field('', [required, minLength(3)], {
      // Experimental: only declared state and initial validator constraints.
      syncInputs: true,
      disabled: () => this.saving(),
    }),
  });
}
