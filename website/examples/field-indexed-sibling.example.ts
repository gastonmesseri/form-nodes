import { array, field, form } from '@ngblocks/form-nodes';

class UserDirectory {
  form = form({
    users: array({
      name: field(''),
      email: field('', ({ node, value }) => {
        const row = this.form.users[node().index()!];
        return value() && !row?.name() ? { kind: 'nameRequiredBeforeEmail' } : null;
      }),
    }, { initialLength: 2 }),
  });
}

const directory = new UserDirectory();
const first = directory.form.users[0]!;
const second = directory.form.users[1]!;
first.email.set('ada@example.com');
second.email.set('lin@example.com');
if (!first.email.hasError('nameRequiredBeforeEmail') || !second.email.hasError('nameRequiredBeforeEmail')) {
  throw new Error('Every row must validate against its own name.');
}

first.name.set('Ada');
if (!first.email.valid() || !second.email.invalid()) {
  throw new Error('Changing one name must affect only its row.');
}

directory.form.users.move(0, 1);
first.name.set('');
if (first.email.index() !== 1 || !first.email.hasError('nameRequiredBeforeEmail')) {
  throw new Error('The rule must follow the moved row.');
}
