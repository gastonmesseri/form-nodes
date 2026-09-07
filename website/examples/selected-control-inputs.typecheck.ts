import { Component, input, model } from '@angular/core';
import { field, form, FormNode } from '@ngblocks/form-nodes';

// text-control.component.ts
@Component({
  selector: 'app-selected-text',
  template: `
    <input #text [value]="value()" [disabled]="disabled()" [class.edited]="dirty()"
      (input)="value.set(text.value)">
  `,
})
export class TextControl {
  value = model('');

  disabled = input(false);

  dirty = input(false);
}

// profile.component.ts
@Component({
  imports: [FormNode, TextControl],
  template: `
    <app-selected-text [formNode]="profile.name" />
    <app-selected-text [formNode]="profile.nickname" />
    <app-selected-text [formNode]="profile.notes" />
  `,
})
export class ProfileComponent {
  profile = form({
    // Lists always synchronize exactly the selected inputs.
    name: field('', { syncInputs: ['disabled', 'dirty'] }),
    // Explicit mode with a selection: equivalent to ['disabled'].
    nickname: field('', { syncInputs: { mode: 'always', inputs: ['disabled'] } }),
    // Only disabled is initially declared; dirty remains component-owned.
    notes: field('', {
      disabled: false,
      syncInputs: { mode: 'only-declared', inputs: ['disabled', 'dirty'] },
    }),
  });
}
