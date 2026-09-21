import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <textarea
      [formNode]="form.description"
      (formNodeControlValueChange)="onControlValueChange($event)"
      (formNodeChange)="onValueChange($event)"
    ></textarea>
    <p>Draft length: {{ draftLength }}</p>
    <p>Confirmed description: {{ confirmedDescription }}</p>
  `,
})
export class DescriptionEditor {
  form = form({
    description: field.strict('', { debounce: 300 }),
  });

  draftLength = 0;

  confirmedDescription = '';

  onControlValueChange(value: string) {
    this.draftLength = value.length;
  }

  onValueChange(value: string) {
    this.confirmedDescription = value;
  }
}
