import { array, field, form, lengthBetween } from '@ngblocks/form-nodes';

const profile = form({
  username: field('', [lengthBetween(3, 5)]),
  members: array({
    name: field('Ada'),
  }, {
    initialValue: 1,
    validators: [lengthBetween(1, 2)],
  }),
});

profile.username(); // ''
profile.username.getError('minLength')?.actual; // 0
if (!profile.username.hasError('minLength')) throw new Error('Empty text must fail a positive minimum.');

profile.username.set('Ada');
profile.valid(); // true
if (!profile.valid()) throw new Error('Inclusive lower bounds must be accepted.');

profile.username.set('Grace');
profile.members.push();
profile.valid(); // true
if (!profile.valid()) throw new Error('Inclusive upper bounds must be accepted.');

profile.members.push();
profile.members.getError('maxLength')?.actual; // 3
if (!profile.members.hasError('maxLength') || profile.valid()) {
  throw new Error('An oversized array must invalidate its parent form.');
}
