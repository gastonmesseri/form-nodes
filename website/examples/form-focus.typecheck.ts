import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="profile.username" />
    <input [formNode]="profile.email" />
  `,
})
export class ProfileComponent {
  profile = form({
    username: field(''),
    email: field(''),
  });

  focusFirstControl() {
    this.profile.focus({ preventScroll: true });
  }
}
