import { field, form, minDate, minWords, required } from '@ngblocks/form-nodes';

const profile = form({
  appointment: field<Date>(undefined, [minDate('2026-01-01')]),
  summary: field<string>(undefined, [minWords(3)]),
});

profile.valid(); // true
profile.summary(); // undefined

if (!profile.valid() || profile.summary() !== undefined || profile.appointment() !== undefined) {
  throw new Error('Optional validators must preserve absent values and report no errors.');
}

profile.summary.set('Too short');
profile.summary.hasError('minWords'); // true

if (!profile.summary.hasError('minWords') || !profile.invalid()) {
  throw new Error('A present value must satisfy its word-count constraint.');
}

profile.summary.reset(undefined);
profile.valid(); // true

if (!profile.valid() || profile.summary() !== undefined) {
  throw new Error('Resetting an optional value to undefined must clear its constraint error.');
}

profile.summary.setValidators([required, minWords(3)]);
profile.summary.hasError('required'); // true
profile.summary.hasError('minWords'); // false

if (!profile.summary.hasError('required') || profile.summary.hasError('minWords')) {
  throw new Error('Presence validation must report the missing value independently of word count.');
}
