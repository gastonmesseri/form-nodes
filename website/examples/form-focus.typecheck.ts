import { Component } from '@angular/core';

import { field, form, FormNode } from 'form-nodes';

@Component({
  imports: [FormNode],
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
