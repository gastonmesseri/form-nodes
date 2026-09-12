import { Component } from '@angular/core';
import { field, form, required, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-contact-editor',
  template: `
    <label>
      Name
      <input [formNode]="contact.name" />
    </label>
    <button type="button" (click)="contact.reset({ name: null })">Reset name</button>
  `,
  imports: [FormNodeDirective],
})
export class ContactEditor {
  contact = form({
    name: field<string>(null, [required]),
  });
}
