import { array, field, form } from '@ngblocks/form-nodes';

const profile = form({
  username: field('Ada'),
  details: {
    note: field('Keep this note'),
    cities: array({
      city: field(''),
      country: field(''),
    }, {
      initialValue: [{ city: 'Madrid', country: 'Spain' }],
    }),
  },
});

profile.patch({ details: { cities: [
  { city: 'Rabat', country: 'Morocco' },
  { city: 'Valencia', country: 'Spain' },
] } });
profile.username(); // 'Ada'
profile.details.note(); // 'Keep this note'
profile.details.cities.length(); // 2
if (profile.username() !== 'Ada' || profile.details.note() !== 'Keep this note'
  || profile.details.cities.length() !== 2 || profile.details.cities[0]?.country() !== 'Morocco') {
  throw new Error('A parent patch must preserve omitted branches and reconcile complete array values.');
}

profile.details.cities.patch([{ city: 'Paris', country: 'France' }]);
profile.details.cities(); // [{ city: 'Paris', country: 'France' }]
if (profile.details.cities.length() !== 1 || profile.details.cities[0]?.country() !== 'France') {
  throw new Error('An array patch must remove trailing rows and assign complete item values.');
}

profile.details.cities.at(0)?.patch({ city: 'Lyon' });
profile.details.cities(); // [{ city: 'Lyon', country: 'France' }]
if (profile.details.cities[0]?.city() !== 'Lyon' || profile.details.cities[0]?.country() !== 'France') {
  throw new Error('A row patch must preserve omitted row properties.');
}

profile.patch({ details: { cities: [] } });
profile.details.cities(); // []
if (profile.details.cities.length() !== 0) throw new Error('An empty array patch must clear the collection.');

// Runtime fallback for data that bypasses the complete-item TypeScript contract.
const people = form({
  users: array({
    username: field(''),
    age: field<number | null>(null),
  }, {
    initialValue: [{ username: 'previous', age: 28 }],
  }),
});
const externalData = JSON.parse('[{"username":"tobi"},{"username":"andrew"}]');
people.patch({ users: externalData });
people.users(); // [{ username: 'tobi', age: null }, { username: 'andrew', age: null }]
if (people.users.length() !== 2 || people.users().some(user => user.age !== null)) {
  throw new Error('Omitted properties must use declaration defaults for both reused and new rows.');
}
