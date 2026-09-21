import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <textarea [formNode]="form.description" (input)="onUserInput()"></textarea>
  `,
})
export class DescriptionEditor {
  form = form({
    description: field(''),
  });

  lastUserValue: string | null = '';

  onUserInput() {
    this.lastUserValue = this.form.description();
  }
}
