import { Component } from '@angular/core';

import { field, FormNode } from 'form-nodes';

@Component({
  imports: [FormNode],
  template: `<input [formNode]="username" />`,
})
export class UsernameComponent {
  username = field('');

  focusUsername() {
    this.username.focus({ preventScroll: true });
  }
}
