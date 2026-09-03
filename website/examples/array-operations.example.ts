import { array, field, form } from 'form-nodes';

const myForm = form({
  people: array({
    id: field(''),
    name: field(''),
    age: field(18),
  }, {
    initialValue: [
      { id: 'ada', name: 'Ada', age: 36 },
      { id: 'grace', name: 'Grace', age: 44 },
    ],
    trackBy: 'id',
  }),
});

const adaNode = myForm.people[0];
const graceNode = myForm.people[1];

myForm.people.set([
  { id: 'grace', name: 'Grace Hopper', age: 45 },
  { id: 'ada', name: 'Ada Lovelace', age: 37 },
]);

if (myForm.people[0] !== graceNode || myForm.people[1] !== adaNode) {
  throw new Error('trackBy should preserve nodes across reordering.');
}

myForm.people.patch([{ age: 46 }]);
myForm.people.swap(0, 1);
myForm.people.push({ id: 'linus', name: 'Linus', age: 32 });

if (myForm.people.length() !== 3 || myForm.people[1]?.age() !== 46) {
  throw new Error('The array operations produced an unexpected result.');
}
