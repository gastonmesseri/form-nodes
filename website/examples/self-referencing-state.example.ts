import { field, form, required } from '@ngblocks/form-nodes';

const profile = form({
  purpose: field('', [required]),
  itemIds: field<number[]>(null, {
    validators: [required],
    disabled: () => profile.purpose(),
  }),
  internalNotes: field('', {
    hidden: () => profile.purpose() === 'public',
    readonly: () => profile.purpose() === 'review',
  }),
});

profile.itemIds.disabled(); // false
if (profile.itemIds.disabled() || !profile.itemIds.hasError('required')) {
  throw new Error('Item IDs should start enabled and required.');
}

profile.purpose.set('public');
profile.itemIds.disabled(); // true
profile.internalNotes.hidden(); // true
if (!profile.itemIds.disabled() || !profile.internalNotes.hidden() || !profile.valid()) {
  throw new Error('State callbacks should follow the purpose field and suppress disabled validation.');
}

profile.purpose.set('review');
profile.internalNotes.hidden(); // false
profile.internalNotes.readonly(); // true
if (profile.internalNotes.hidden() || !profile.internalNotes.readonly()) {
  throw new Error('Changing purpose should update both hidden and readonly state.');
}

profile.purpose.set('');
profile.itemIds.disabled(); // false
if (profile.itemIds.disabled() || profile.internalNotes.readonly() || !profile.itemIds.hasError('required')) {
  throw new Error('Clearing purpose should restore interactive state and required validation.');
}
