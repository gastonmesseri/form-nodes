import { Component } from '@angular/core';
import { field, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `<input [formNode]="username" />`,
})
export class UsernameComponent {
  username = field('');

  focusUsername() {
    this.username.focus({ preventScroll: true });
  }
}
