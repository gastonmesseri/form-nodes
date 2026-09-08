import { equalTo, field, form } from '@ngblocks/form-nodes';

class SignupForm {
  myForm = form({
    password: field('secret'),
    confirmation: field('', [() => equalTo(this.myForm.password())]),
  });
}

const { myForm } = new SignupForm();
myForm.confirmation.hasError('equalTo'); // true
if (!myForm.confirmation.hasError('equalTo')) throw new Error('Passwords must match.');

myForm.confirmation.set('secret');
myForm.valid(); // true
if (!myForm.valid()) throw new Error('Matching passwords must be valid.');

myForm.password.set('new-secret');
myForm.confirmation.hasError('equalTo'); // true
if (!myForm.confirmation.hasError('equalTo')) throw new Error('Password changes must revalidate confirmation.');
