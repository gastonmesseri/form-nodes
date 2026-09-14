import { signal } from '@angular/core';
import { field, form, minLength } from '@ngblocks/form-nodes';

const minimum = signal<number | undefined>(1);
const profile = form({
  nickname: field('', [minLength(minimum)]),
});

profile.nickname.valid(); // false
if (profile.valid()) throw new Error('Empty text must fail a positive minimum.');

minimum.set(0);
profile.nickname.valid(); // true
if (!profile.valid()) throw new Error('A zero minimum must allow empty text.');

minimum.set(3);
profile.nickname.getError('minLength')?.actual; // 0
if (!profile.nickname.hasError('minLength')) throw new Error('A changed minimum must revalidate empty text.');

minimum.set(undefined);
profile.nickname.valid(); // true: the constraint is disabled
if (!profile.valid() || profile.nickname.minLength() !== null) {
  throw new Error('An undefined minimum must disable validation and constraint metadata.');
}
