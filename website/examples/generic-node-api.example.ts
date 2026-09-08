import { field, form, type AnyNode, type DynamicNode } from '@ngblocks/form-nodes';

const response = form({
  api: field('v2'),
  reset: field('draft'),
});

response.api(); // 'v2'
response.reset(); // 'draft'

function touchNode(node: AnyNode) {
  node.$api.markAsTouched();
}

touchNode(response);
if (!response.$api.touched() || response.api() !== 'v2' || response.reset() !== 'draft') {
  throw new Error('Generic operations must preserve colliding children and target the node API.');
}

// This declaration is known not to shadow the direct common API.
const profile: DynamicNode = form({ username: field('Marco') });
profile.markAsTouched();
profile.touched(); // true

if (!profile.touched()) {
  throw new Error('A compatible DynamicNode must expose direct common operations.');
}
