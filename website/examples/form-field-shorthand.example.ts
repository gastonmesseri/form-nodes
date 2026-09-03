import { form } from '@gem/ng-forms';

const birthday = new Date('1990-06-15T00:00:00.000Z');

const myForm = form({
  name: '',
  age: null,
  siblings: 2,
  birthday,
  sister: undefined,
  address: {
    city: 'Zurich',
  },
}, {});

myForm.name.set('Marco');
myForm.address.city.set('Bern');

if (
  myForm.name() !== 'Marco'
  || myForm.age() !== null
  || myForm.siblings() !== 2
  || myForm.birthday()?.toISOString() !== '1990-06-15T00:00:00.000Z'
  || myForm.sister() !== null
  || myForm.address.city() !== 'Bern'
) {
  throw new Error('Concise field definitions produced an unexpected form value.');
}
