import { Component } from '@angular/core';
import { form, field, required, FormNode } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `
    <input [formNode]="myForm.username" />
    <p>Hello {{ myForm.username() }}</p>

    <input [formNode]="myForm.email" />
    <p>Your email is {{ myForm.email() }}</p>
  `,
})
export class ProfileEditor {
  myForm = form({
    username: field(''),
    email: field('', [required]),
  });
}
