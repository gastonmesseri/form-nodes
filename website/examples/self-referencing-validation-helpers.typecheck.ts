import { Component } from '@angular/core';
import { asyncValidator, equalTo, field, form, validator } from '@ngblocks/form-nodes';

@Component({ selector: 'app-signup', template: '' })
export class SignupComponent {
  myForm = form({
    password: field(''),
    confirmation: field('', [validator(() => equalTo(this.myForm.password()))]),
    username: field('', [asyncValidator(async () => {
      return this.myForm.username() === 'admin' ? { kind: 'reserved' } : null;
    })]),
  });
}
