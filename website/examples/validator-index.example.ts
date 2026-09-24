import { array, field, form } from '@ngblocks/form-nodes';

const contacts = form({
  rows: array({
    details: {
      email: field('', ({ index }) => index === 0 ? { kind: 'firstRow' } : null),
    },
  }, { initialValue: [{ details: { email: 'ada@example.com' } }, { details: { email: 'lia@example.com' } }] }),
});

const adaEmail = contacts.rows[0]!.details.email;
const liaEmail = contacts.rows[1]!.details.email;
if (!adaEmail.hasError('firstRow') || !liaEmail.valid()) {
  throw new Error('The first row must be validated with index zero.');
}

contacts.rows.move(0, 1);
if (!adaEmail.valid() || !liaEmail.hasError('firstRow')) {
  throw new Error('Validation must follow the current row index after a move.');
}
