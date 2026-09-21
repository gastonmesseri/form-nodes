import { array, field, form } from '@ngblocks/form-nodes';

const profile = form({
  users: array({ username: field('') }, {
    initialValue: [{ username: 'Ada' }, { username: 'Grace' }],
  }),
});

profile.users.at(-1)?.username(); // 'Grace'
profile.users.at(-2)?.username(); // 'Ada'
profile.users.at(-3); // undefined

if (profile.users.at(-1) !== profile.users[1]
  || profile.users.at(-2) !== profile.users[0]
  || profile.users.at(-3) !== undefined) {
  throw new Error('Negative indexes must select live nodes from the end of the collection.');
}

profile.users.at(-1)?.username.set('Lia');
profile().users[1]?.username; // 'Lia'
if (profile().users[1]?.username !== 'Lia') {
  throw new Error('Editing the last node must update the parent form value.');
}
