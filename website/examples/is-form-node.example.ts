import { signal } from '@angular/core';
import { field, form, isFormNode } from '@ngblocks/form-nodes';

const profile = form({ name: field('Marco') });

isFormNode(profile); // true
isFormNode(profile.name); // true
isFormNode(signal('Marco')); // false
isFormNode({ name: 'Marco' }); // false

const candidate: unknown = profile.name;
if (isFormNode(candidate)) {
  candidate(); // 'Marco'
  if (candidate() !== 'Marco') {
    throw new Error('The narrowed node must retain its committed value.');
  }
}

if (!isFormNode(candidate) || !isFormNode(profile) || isFormNode(signal('Marco')) || isFormNode({ name: 'Marco' })) {
  throw new Error('Only Form Nodes nodes should pass the type guard.');
}
