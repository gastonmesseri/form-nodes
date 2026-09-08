import { field, form, group } from '@ngblocks/form-nodes';

const profile = form({
  answers: group({}),
});
const name = profile.answers.add('name', field('Marco'));
const age = profile.answers.add('age', field(18));

// The default callback is typed as DynamicNode but does not visit added children.
profile.answers.forEachChild(child => child.set(''));
if (name() !== 'Marco' || age() !== 18) {
  throw new Error('Default iteration must exclude dynamically added children.');
}

// Empty declarations expose dynamic children; iteration opts in explicitly.
const children = Object.values(profile.answers.children); // DynamicNode[]
profile.answers.forEachChild(child => {
  // child: DynamicNode, without undefined
  child.markAsTouched();
}, { includeDynamic: true });

name(); // 'Marco'
age(); // 18
profile.answers.get('missing'); // undefined

if (children.length !== 2 || children[0] !== name || children[1] !== age
  || !name.touched() || !age.touched() || profile.answers.get('missing') !== undefined) {
  throw new Error('An empty declaration must support dynamic child enumeration and lookup.');
}

const record = form({});
record.add('active', field(true));
if (Object.values(record.children).length !== 1 || record.get('active')?.() !== true) {
  throw new Error('Empty forms must support the same dynamic record pattern.');
}
