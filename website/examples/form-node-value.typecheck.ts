import { array, field, form, type FormNodeValue } from '@ngblocks/form-nodes';

const profile = form({
  name: field('Marco'),
  country: field.strict<string>('Switzerland'),
  address: { city: field('Zurich') },
  contacts: array({
    email: field(''),
  }, {
    initialValue: [{ email: 'marco@example.com' }],
  }),
});

type ProfileValue = FormNodeValue<typeof profile>;
// {
//   name: string;
//   country: string;
//   address: { city: string };
//   contacts: { email: string }[];
// }

type NameValue = FormNodeValue<typeof profile.name>; // string
type AddressValue = FormNodeValue<typeof profile.address>; // { city: string }
type ContactsValue = FormNodeValue<typeof profile.contacts>; // { email: string }[]

const name: NameValue = 'Ada';
const address: AddressValue = { city: 'Bern' };
const contacts: ContactsValue = [{ email: 'marco@example.com' }];

const draft: ProfileValue = {
  name,
  country: 'Switzerland',
  address,
  contacts,
};

profile.set(draft);
