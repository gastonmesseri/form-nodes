import { Component } from '@angular/core';
import { array, field, FormNode } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNode],
  template: `
    @for (username of usernames; track username) {
      <input [formNode]="username" />
    }
  `,
})
export class UsernamesComponent {
  usernames = array(field(''), {
    initialValue: ['ada', 'grace'],
  });

  focusFirstUsername() {
    this.usernames.focus({ preventScroll: true });
  }
}
