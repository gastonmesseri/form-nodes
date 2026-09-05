import { array } from '@ngblocks/form-nodes';

const people = array({
  name: '',
  age: 0,
}, {
  initialValue: [
    { name: 'Marco', age: 36 },
    { name: 'Lia', age: 32 },
  ],
});

people[0]?.name(); // 'Marco'
people[0]?.age(); // 36
people[0]?.nodeType() === 'group'; // true
people[0]?.name.nodeType() === 'field'; // true

if (people[0]?.name() !== 'Marco' || people[1]?.age() !== 32) {
  throw new Error('Array object-template shorthands should preserve item values.');
}

if (people[0]?.nodeType() !== 'group' || people[0]?.name.nodeType() !== 'field') {
  throw new Error('Array object-template shorthands should normalize to groups containing fields.');
}
