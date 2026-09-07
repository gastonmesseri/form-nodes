import { Component, input, output } from '@angular/core';
import { field, form, FormNode } from '@ngblocks/form-nodes';

// text-input.component.ts
@Component({
  selector: 'app-paired-text',
  template: `
    <input #text [value]="value()" [disabled]="disabled()"
      (input)="valueChange.emit(text.value)" (blur)="touch.emit()">
  `,
})
export class PairedText {
  value = input('');

  valueChange = output<string>();

  disabled = input(false);

  touch = output<void>();
}

// profile.component.ts
@Component({
  imports: [FormNode, PairedText],
  template: `<app-paired-text [formNode]="profile.name" />`,
})
export class ProfileComponent {
  profile = form({
    // Experimental value transport, without any optional state input writes.
    name: field('Ada', { bindInputOutputPairs: true }),
  });
}
