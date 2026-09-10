import { field, form, validator, type ValidationResult } from '@ngblocks/form-nodes';

const booking = form({
  endDate: field<string>(null),
  startDate: field<string>(null, ({ value }) => {
    const endDate = booking.endDate();
    return endDate && !value()
      ? { kind: 123, message: 'Enter a start date.' }
      : null;
  }),
  reference: field('', ({ value }): ValidationResult => {
    return value() ? null : { kind: 'missingReference', message: 'Enter a reference.' };
  }),
});

booking.endDate.set('2026-09-10');
booking.startDate.getError('123')?.kind; // '123'
if (booking.startDate.getError('123')?.message !== 'Enter a start date.') {
  throw new Error('Self-referencing validators must expose normalized numeric errors.');
}
booking.startDate.set('2026-09-09');
if (booking.startDate.invalid()) throw new Error('Sibling validation must recover after editing.');
booking.reference.set('BOOK-1');
if (booking.invalid()) throw new Error('All fields should now be valid.');

// The checked helper preserves the context of validators returned by another validator.
booking.reference.setValidators(validator(({ value }) => {
  return value() ? null : [({ value: current }) => current() ? null : { kind: 'missingReference' }];
}));
booking.reference.set('');
if (!booking.reference.hasError('missingReference')) {
  throw new Error('Checked composition must preserve its runtime behavior.');
}
booking.resetToInitial();
if (booking.startDate.invalid()) throw new Error('Reset must restore the sibling condition.');
