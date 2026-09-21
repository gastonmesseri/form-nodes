import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="form.username" />
    <input [formNode]="form.email" />
  `,
})
export class ProfileComponent {
  form = form({
    username: field(''),
    email: field(''),
  });

  focusFirstControl() {
    this.form.focus({ preventScroll: true });
  }
}
