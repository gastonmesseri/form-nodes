import { createFormPrimitives, type Field } from '@gem/ng-forms';

const { form, field, array } = createFormPrimitives({ nullable: false });

const profile = form({
  username: field(''),
  nickname: field('', { nullable: true }),
  address: {
    city: '',
  },
  tags: array(field(''), {
    initialValue: ['angular'],
  }),
}, {});

const username: Field<string> = profile.username;
const nickname: Field<string | null> = profile.nickname;

profile();
// Expected output: { username: '', nickname: '', address: { city: '' }, tags: ['angular'] }

void [username, nickname];
