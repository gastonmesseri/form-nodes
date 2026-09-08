import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <textarea [formNode]="myForm.description" (input)="onUserInput()"></textarea>
  `,
})
export class DescriptionEditor {
  myForm = form({
    description: field(''),
  });

  lastUserValue: string | null = '';

  onUserInput() {
    this.lastUserValue = this.myForm.description();
  }
}
