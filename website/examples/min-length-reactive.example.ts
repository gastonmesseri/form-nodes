import { signal } from '@angular/core';
import { field, form, minLength } from '@ngblocks/form-nodes';

const minimum = signal<number | undefined>(3);
const profile = form({
  nickname: field('Al', [minLength(minimum)]),
});

profile.nickname.valid(); // false
if (profile.valid()) throw new Error('Text shorter than the minimum must fail.');

minimum.set(0);
profile.nickname.valid(); // true
if (!profile.valid()) throw new Error('A zero minimum must allow empty text.');

minimum.set(3);
profile.nickname.getError('minLength')?.actual; // 2
if (!profile.nickname.hasError('minLength')) throw new Error('A changed minimum must revalidate populated text.');

minimum.set(undefined);
profile.nickname.valid(); // true: the constraint is disabled
if (!profile.valid() || profile.nickname.minLength() !== null) {
  throw new Error('An undefined minimum must disable validation and constraint metadata.');
}
