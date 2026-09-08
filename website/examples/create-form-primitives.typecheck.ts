import { createFormPrimitives, type FieldNode } from '@ngblocks/form-nodes';

const { form, field, array } = createFormPrimitives({
  nullable: false,
  validatorMessages: {
    required: 'This value is required.',
  },
  inheritInjector: true,
  adoptBindingInjector: true,
});

const profile = form({
  username: field(''),
  nickname: field.nullable(''),
  reference: field.strict('REF-1'),
  address: {
    city: '',
  },
  tags: array(field(''), {
    initialValue: ['angular'],
  }),
}, {});

const username: FieldNode<string> = profile.username;
const nickname: FieldNode<string | null> = profile.nickname;
const reference: FieldNode<string> = profile.reference;

profile();
// Expected output: { username: '', nickname: '', reference: 'REF-1', address: { city: '' }, tags: ['angular'] }

void [username, nickname, reference];
