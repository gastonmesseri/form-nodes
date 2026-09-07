import { field, form } from '@ngblocks/form-nodes';

const profile = form({
  contact: {
    name: field('Marco'),
    email: field('marco@example.com'),
  },
  active: field(true),
});

const keys: string[] = [];
profile.contact.forEachChild((child, key) => {
  keys.push(key);
  child.markAsTouched();
});

profile.contact.name.touched(); // true
profile.contact.email.touched(); // true
profile.active.touched(); // false

if (keys.join(',') !== 'name,email' || !profile.contact.name.touched()
  || !profile.contact.email.touched() || profile.active.touched()) {
  throw new Error('forEachChild must visit only the immediate children of the selected group.');
}

const rootKeys: string[] = [];
profile.forEachChild((_child, key) => rootKeys.push(key));

if (rootKeys.join(',') !== 'contact,active') {
  throw new Error('Form iteration must visit the group node without traversing its descendants.');
}

const score = profile.contact.add('score', field(5));
const declaredKeys: string[] = [];
profile.contact.forEachChild((_child, key) => declaredKeys.push(key));

if (declaredKeys.join(',') !== 'name,email') {
  throw new Error('Default iteration must exclude dynamically added children.');
}

const allKeys: string[] = [];
profile.contact.forEachChild((child, key) => {
  // child: DynamicNode, including both declared and dynamically added nodes
  allKeys.push(key);
  child.markAsTouched();
}, { includeDynamic: true });

score.touched(); // true

if (allKeys.join(',') !== 'name,email,score' || !score.touched()) {
  throw new Error('Opted-in iteration must include dynamically added children.');
}
