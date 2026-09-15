import { field, form, validator } from '@ngblocks/form-nodes';

const requireAttachment = validator<string | null>(({ root }) => {
  return root().$api.nodeType() === 'field' ? { kind: 'standalone' } : null;
});
const name = field('Mark', requireAttachment);
if (!name.hasError('standalone')) throw new Error('A standalone field is its own root.');

const profile = form({ name });
if (profile.invalid()) throw new Error('Root navigation must react to attachment.');
profile.name(); // 'Mark'

profile.name.setValidators(({ root, node }) => {
  if (root() !== node().root()) throw new Error('The root shortcut must match node navigation.');
  return null;
});
if (profile.invalid()) throw new Error('Inline validators share the same root shortcut.');
