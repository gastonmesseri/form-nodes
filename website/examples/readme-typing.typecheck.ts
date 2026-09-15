import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-page',
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="profile.username" />
    <input [formNode]="profile.email" />
  `,
})
export class ProfilePage {
  profile = form({
    username: field(''),
    email: field(''),
  });
}
