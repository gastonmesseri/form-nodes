import { email, field, form, minLength, required } from '@gem/ng-forms';

const myForm = form({
  name: field('Unknown', [required, minLength(2)]),
  email: field('', [required, email]),
});

if (myForm.valid()) {
  throw new Error('The empty required email should make the form invalid.');
}

myForm.email.set('ada@example.com');

if (!myForm.valid()) {
  throw new Error('The completed form should be valid.');
}

const value = myForm();
if (value.name !== 'Unknown' || value.email !== 'ada@example.com') {
  throw new Error('The form value did not reflect its child values.');
}
