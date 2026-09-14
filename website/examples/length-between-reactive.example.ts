import { signal } from '@angular/core';
import { field, form, lengthBetween } from '@ngblocks/form-nodes';

const minimum = signal<number | undefined>(3);
const maximum = signal<number | undefined>(5);
const profile = form({
  username: field('Ada', [lengthBetween(minimum, maximum)]),
});

minimum.set(4);
profile.username.hasError('minLength'); // true
if (!profile.username.hasError('minLength')) throw new Error('A changed minimum must revalidate the value.');

minimum.set(undefined);
profile.valid(); // true
profile.username.minLength(); // null
profile.username.maxLength(); // 5
if (!profile.valid() || profile.username.minLength() !== null || profile.username.maxLength() !== 5) {
  throw new Error('An undefined minimum must disable only the lower bound.');
}

maximum.set(2);
profile.username.hasError('maxLength'); // true
if (!profile.username.hasError('maxLength')) throw new Error('The upper bound must remain active independently.');
