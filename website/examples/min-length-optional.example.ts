import { field, form, minLength } from '@ngblocks/form-nodes';

const profile = form({
  nickname: field('', [
    minLength(3, { when: ({ value }) => value() !== '' }),
  ]),
});

profile.nickname.valid(); // true: an empty nickname is explicitly allowed
if (!profile.valid()) throw new Error('An optional empty nickname must be valid.');

profile.nickname.set('Al');
profile.nickname.hasError('minLength'); // true
if (!profile.nickname.hasError('minLength')) throw new Error('A populated nickname must meet the minimum.');

profile.nickname.set('Alex');
profile.nickname.valid(); // true
if (!profile.valid()) throw new Error('A sufficiently long nickname must be valid.');

profile.nickname.set('');
profile.nickname.minLength(); // null: the inactive rule also removes its constraint metadata
if (!profile.valid() || profile.nickname.minLength() !== null) {
  throw new Error('Clearing an optional nickname must deactivate its length rule.');
}
