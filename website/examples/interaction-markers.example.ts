import { field, form, array } from '@ngblocks/form-nodes';

const profile = form({
  name: field('Ada'),
  contacts: array({
    email: field('ada@example.com'),
  }, {
    initialValue: 1,
  }),
});

profile.markAsTouched();
profile.markAsUntouched();
profile.touched(); // true
profile.name.touched(); // true
if (!profile.touched() || !profile.name.touched()) {
  throw new Error('Clearing a parent marker must preserve touched descendants.');
}

profile.contacts.markAsUntouched();
profile.contacts.touched(); // true
if (!profile.contacts.touched()) {
  throw new Error('A touched item must keep its array touched.');
}

profile.reset();
profile.touched(); // false
profile.contacts.touched(); // false
if (profile.touched() || profile.contacts.touched() || profile.name.touched()) {
  throw new Error('Reset must clear interaction markers throughout the subtree.');
}

profile.markAsTouched({ skipDescendants: true });
profile.markAsUntouched();
profile.touched(); // false
if (profile.touched()) throw new Error('An own-only marker must be cleared independently.');
