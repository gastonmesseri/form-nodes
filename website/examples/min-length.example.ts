import { field, form, minLength, required } from '@ngblocks/form-nodes';

const profile = form({
  username: field('', [minLength(3)]),
  nickname: field<string>(null, [minLength(3)]),
  displayName: field('', [required, minLength(3)]),
});

profile.username(); // ''
profile.username.valid(); // true
profile.nickname.valid(); // true: null has no length to check
profile.displayName.errors().map(error => error.kind); // ['required']

if (!profile.username.valid() || !profile.nickname.valid()
  || profile.displayName.errors().map(error => error.kind).join(',') !== 'required') {
  throw new Error('Empty text and null must pass minimum length; required must reject empty text.');
}

profile.username.set('Ada');
profile.displayName.set('Ada');
profile.valid(); // true
if (!profile.valid()) throw new Error('Strings meeting the minimum must be valid.');

profile.nickname.set('');
profile.nickname.valid(); // true: empty text remains optional
if (!profile.nickname.valid()) throw new Error('An empty nickname must remain valid.');

profile.nickname.setValidators([minLength(3, { allowEmptyString: false })]);
profile.nickname.getError('minLength')?.actual; // 0
if (!profile.nickname.hasError('minLength')) throw new Error('Explicit empty-string validation must measure zero.');
