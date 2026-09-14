import { field, form, minLength, required } from '@ngblocks/form-nodes';

const profile = form({
  username: field('', [minLength(3)]),
  nickname: field<string>(null, [minLength(3)]),
  displayName: field('', [required, minLength(3)]),
});

profile.username(); // ''
profile.username.hasError('minLength'); // true
profile.nickname.valid(); // true: null has no length to check
profile.displayName.errors().map(error => error.kind); // ['required', 'minLength']

if (!profile.username.hasError('minLength') || !profile.nickname.valid()
  || profile.displayName.errors().map(error => error.kind).join(',') !== 'required,minLength') {
  throw new Error('Empty text must fail its minimum length, while null stays optional.');
}

profile.username.set('Ada');
profile.displayName.set('Ada');
profile.valid(); // true
if (!profile.valid()) throw new Error('Strings meeting the minimum must be valid.');

profile.nickname.set('');
profile.nickname.valid(); // false: clearing to an empty string differs from null
if (profile.nickname.valid()) throw new Error('An empty nickname must fail its minimum length.');
