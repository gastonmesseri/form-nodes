import { array, field, form } from '@ngblocks/form-nodes';

const profile = form({
  users: array({
    username: field(''),
    role: field('reader'),
  }),
});

const draft = profile.users.templateValue();
draft.username = 'Ada';

if (profile.users.length() !== 0 || profile.users.templateValue().username !== '') {
  throw new Error('Preparing a draft must leave the collection and template unchanged.');
}

// Add the draft only when the user confirms it.
profile.users.push(draft);
profile.users.at(0)?.username(); // 'Ada'

if (profile.users.at(0)?.username() !== 'Ada' || profile.users.at(0)?.role() !== 'reader') {
  throw new Error('The added row must contain the draft and template defaults.');
}
