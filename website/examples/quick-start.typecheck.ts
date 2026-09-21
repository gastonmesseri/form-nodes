import { Component } from '@angular/core';
import { form, field, required, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="form.username" />
    <p>Hello {{ form.username() }}</p>

    <input [formNode]="form.email" />
    <p>Your email is {{ form.email() }}</p>
  `,
})
export class ProfileEditor {
  form = form({
    username: field(''),
    email: field('', [required]),
  });
}
