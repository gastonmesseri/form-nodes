import { field, form } from '@ngblocks/form-nodes';

const profile = form({
  contact: {
    name: field('Marco'),
    age: field(30),
  },
});

const children = Object.values(profile.contact.children);
// Inferred element type: the union of contact.name and contact.age node types.
const values: (string | number | null)[] = children.map(child => child());

if (values.length !== 2 || values[0] !== 'Marco' || values[1] !== 30) {
  throw new Error('Declared children must retain their value union during enumeration.');
}

const active = profile.contact.add('active', field(true));
active(); // true

// Runtime enumeration includes active, even though the static union excludes its type.
if (Object.values(profile.contact.children).length !== 3 || profile.contact.get('active') !== active) {
  throw new Error('Dynamic children must remain present in the runtime map.');
}

// Opt in to DynamicNode callbacks when iterating over added children.
const currentValues: unknown[] = [];
profile.contact.forEachChild(child => currentValues.push(child()), { includeDynamic: true });
if (currentValues[2] !== true) {
  throw new Error('Dynamic iteration must include added children.');
}
