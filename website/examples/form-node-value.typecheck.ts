import { array, field, form, type FormNodeValue } from '@gem/ng-forms';

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
//   name: string | null;
//   country: string;
//   address: { city: string | null };
//   contacts: { email: string | null }[];
// }

type NameValue = FormNodeValue<typeof profile.name>; // string | null
type AddressValue = FormNodeValue<typeof profile.address>; // { city: string | null }
type ContactsValue = FormNodeValue<typeof profile.contacts>; // { email: string | null }[]

const name: NameValue = null;
const address: AddressValue = { city: 'Bern' };
const contacts: ContactsValue = [{ email: 'marco@example.com' }];

const draft: ProfileValue = {
  name,
  country: 'Switzerland',
  address,
  contacts,
};

profile.set(draft);
