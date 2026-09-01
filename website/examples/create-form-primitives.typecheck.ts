import { createFormPrimitives, type Field } from '@gem/ng-forms';

const { form, field, array } = createFormPrimitives({ nullable: false });

const profile = form({
  username: field(''),
  nickname: field.nullable(''),
  reference: field.notnull('REF-1'),
  address: {
    city: '',
  },
  tags: array(field(''), {
    initialValue: ['angular'],
  }),
}, {});

const username: Field<string> = profile.username;
const nickname: Field<string | null> = profile.nickname;
const reference: Field<string> = profile.reference;

profile();
// Expected output: { username: '', nickname: '', reference: 'REF-1', address: { city: '' }, tags: ['angular'] }

void [username, nickname, reference];
