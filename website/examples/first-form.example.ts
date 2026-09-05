import { email, field, form, minLength, required } from '@ngblocks/form-nodes';

const myForm = form({
  name: field('', [required, minLength(2)]),
  email: field('', [required, email]),
});

if (myForm.valid()) {
  throw new Error('The empty required fields should make the form invalid.');
}

myForm.name.set('Ada');
myForm.email.set('ada@example.com');

if (!myForm.valid()) {
  throw new Error('The completed form should be valid.');
}

const value = myForm();
if (value.name !== 'Ada' || value.email !== 'ada@example.com') {
  throw new Error('The form value did not reflect its child values.');
}
