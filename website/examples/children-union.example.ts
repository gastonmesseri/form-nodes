import { field, form } from '@ngblocks/form-nodes';

const profile = form({
  contact: {
    name: field('Marco'),
    age: field(30),
  },
});

profile.contact.children.name(); // 'Marco'
profile.contact.children.nonExisting?.value(); // undefined

// Default iteration preserves the declared name-or-age node union.
const declaredValues: (string | number | null)[] = [];
profile.contact.forEachChild(child => declaredValues.push(child()));
if (declaredValues.length !== 2 || declaredValues[0] !== 'Marco' || declaredValues[1] !== 30) {
  throw new Error('Declared-child iteration must retain its concrete value union.');
}

const active = profile.contact.add('active', field(true));
profile.contact.children.active?.value(); // true

// Runtime enumeration includes added children; its element type includes DynamicNode.
const children = Object.values(profile.contact.children);
if (children.length !== 3 || profile.contact.children.active !== active) {
  throw new Error('The runtime child map must expose added nodes.');
}

profile.contact.remove('active');
profile.contact.children.active?.value(); // undefined
if (profile.contact.children.active !== undefined || Object.values(profile.contact.children).length !== 2) {
  throw new Error('Removed nodes must disappear from runtime lookups and enumeration.');
}
