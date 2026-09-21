import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-page',
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="form.username" />
    <input [formNode]="form.email" />
  `,
})
export class ProfilePage {
  form = form({
    username: field(''),
    email: field(''),
  });
}
