import { Component, input, model } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

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
  imports: [FormNodeDirective, TextControl],
  template: `
    <app-selected-text [formNode]="form.name" />
    <app-selected-text [formNode]="form.nickname" />
    <app-selected-text [formNode]="form.notes" />
  `,
})
export class ProfileComponent {
  form = form({
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
