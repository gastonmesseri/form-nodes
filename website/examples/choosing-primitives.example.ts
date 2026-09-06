import { array, field, form } from 'form-nodes';

type Coordinates = {
  latitude: number;
  longitude: number;
};

const myForm = form({
  location: field<Coordinates>(),
  address: {
    city: field(''),
    country: field(''),
  },
  contacts: array({
    type: field<'email' | 'phone'>('email'),
    value: field(''),
  }, {
    initialValue: 1,
  }),
});

myForm.location.set({ latitude: 47.3769, longitude: 8.5417 });
myForm.address.patch({ city: 'Zurich' });
myForm.contacts.push({ type: 'phone', value: '+41 00 000 00 00' });

if (myForm.contacts.length() !== 2 || myForm.address.city() !== 'Zurich') {
  throw new Error('The primitive operations produced an unexpected value.');
}
