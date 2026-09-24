import { array, field, form } from '@ngblocks/form-nodes';

const profile = form({
  rows: array({
    details: { email: field('') },
  }, { initialLength: 2 }),
});

const email = profile.rows[0]!.details.email;
if (profile.index() !== null || email.index() !== 0) {
  throw new Error('The nested email must use its containing row index.');
}

profile.rows.move(0, 1);
if (email.index() !== 1 || email.keyInParent() !== 'email') {
  throw new Error('The index must follow the row, independently of the property key.');
}

profile.rows.removeAt(1);
if (email.index() !== null) throw new Error('A detached branch has no containing array.');
