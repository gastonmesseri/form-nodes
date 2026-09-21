import { Component, input, output } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNodeDirective],
  template: `
    <label>Username <input [formNode]="form.username" /></label>
    <label>Email <input type="email" [formNode]="form.email" /></label>
  `,
})
export class ProfileEditor {
  username = input.required<string>();

  email = input.required<string>();

  form = form({
    username: field(''),
    email: field(''),
  });

  profileChange = output<{ username: string; email: string }>();

  ngOnInit() {
    this.form.patch({
      username: this.username(),
      email: this.email(),
    });

    this.form.onValueChange(value => {
      this.profileChange.emit(value);
    });
  }
}
