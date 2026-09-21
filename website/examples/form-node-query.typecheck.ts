import { Component, viewChild } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <input #emailBinding="formNode" [formNode]="form.email" />
  `,
})
export class EmailEditor {
  form = form({
    email: field(''),
  });

  emailBinding = viewChild.required<FormNodeDirective<typeof this.form.email>>('emailBinding');
}
