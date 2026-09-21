import { Component } from '@angular/core';
import { asyncValidator, equalTo, field, form, validator } from '@ngblocks/form-nodes';

@Component({ selector: 'app-signup', template: '' })
export class SignupComponent {
  form = form({
    password: field(''),
    confirmation: field('', [validator(() => equalTo(this.form.password()))]),
    username: field('', [asyncValidator(async () => {
      return this.form.username() === 'admin' ? { kind: 'reserved' } : null;
    })]),
  });
}
