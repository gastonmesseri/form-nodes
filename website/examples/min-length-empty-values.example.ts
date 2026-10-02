import { field, form, minLength } from '@ngblocks/form-nodes';

const profile = form({
  name: field('', [minLength(3)]),
  tags: field<string[]>([], [minLength(3)]),
});

profile.name.valid(); // true: '' is allowed by default
profile.tags.valid(); // false: [] has fewer than three items
profile.tags.getError('minLength')?.actual; // 0
if (!profile.name.valid() || profile.tags.valid() || profile.tags.getError('minLength')?.actual !== 0) {
  throw new Error('Empty text must pass while an empty array fails the same minimum.');
}

profile.name.set('a');
profile.name.valid(); // false: populated text must have at least three characters
if (profile.name.valid()) throw new Error('Nonempty text must meet the minimum.');

profile.name.set('Ada');
profile.tags.set(['angular', 'forms', 'signals']);
profile.valid(); // true: both populated values meet the minimum
if (!profile.valid()) throw new Error('Text and arrays meeting the minimum must pass.');
