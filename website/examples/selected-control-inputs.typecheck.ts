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
    // Explicit input selection: equivalent to ['disabled'].
    nickname: field('', { syncInputs: { inputs: ['disabled'] } }),
    // Select disabled only on model controls; dirty remains component-owned.
    notes: field('', {
      disabled: false,
      syncInputs: { inputs: ['disabled'], target: 'signal-controls' },
    }),
  });
}
