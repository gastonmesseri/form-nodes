import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <label>Username <input [formNode]="form.username" /></label>
    <p>Current username: {{ form.username() }}</p>
  `,
})
export class ProfilePage {
  form = form({
    username: field('Ada'),
  });
}
