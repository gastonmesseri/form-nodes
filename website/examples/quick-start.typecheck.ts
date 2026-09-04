import { Component } from '@angular/core';

import { field, FormNode, form } from 'form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `
    <input [formNode]="myForm.username" />
    <p>Hello {{ myForm.username() }}</p>
  `,
})
export class ProfileEditor {
  myForm = form({
    username: field(''),
  });
}
