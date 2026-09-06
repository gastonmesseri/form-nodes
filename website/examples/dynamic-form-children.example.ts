import { field, form } from '@ngblocks/form-nodes';

const profile = form({ name: field('Marco') });

const age = profile.add('age', field(23));
const added = profile.add({
  nickname: field('Mark'),
  address: {
    city: field('Zurich'),
  },
});

if (age.nodeType() !== 'field' || added.address.nodeType() !== 'group' || added.address.city.nodeType() !== 'field') {
  throw new Error('Dynamic definitions should produce their expected node types.');
}

if (age.parent() !== profile || added.address.city.form() !== profile) {
  throw new Error('Dynamic children should join the form tree.');
}

if (profile.get('age') !== age || Reflect.get(profile.children, 'age') !== age) {
  throw new Error('Dynamic children should be available through explicit runtime-key lookup.');
}

profile.remove('nickname');

if (profile.get('nickname') !== undefined || Reflect.get(profile.children, 'nickname') !== undefined || added.nickname.parent() !== null) {
  throw new Error('Removed children should become detached standalone nodes.');
}

if (JSON.stringify(profile()) !== JSON.stringify({ name: 'Marco', age: 23, address: { city: 'Zurich' } })) {
  throw new Error('The form value should contain every current dynamic child.');
}
