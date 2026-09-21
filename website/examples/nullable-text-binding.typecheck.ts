import { Component } from '@angular/core';
import { field, form, required, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-contact-editor',
  template: `
    <label>
      Name
      <input [formNode]="form.name" />
    </label>
    <button type="button" (click)="form.reset({ name: null })">Reset name</button>
  `,
  imports: [FormNodeDirective],
})
export class ContactEditor {
  form = form({
    name: field<string>(null, [required]),
  });
}
