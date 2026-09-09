import { field, form, required } from '@ngblocks/form-nodes';

const profile = form({
  name: field('Marco'),
  address: { city: field('Zurich') },
  email: field('', [required]),
});

profile.reset({ name: 'Server name', address: { city: 'Madrid' }, email: 'ada@example.com' });
profile.name.setControlValue('Edited name');
profile.markAsTouched();
profile.resetToInitial();

profile(); // { name: 'Marco', address: { city: 'Zurich' }, email: '' }
if (profile.name() !== 'Marco' || profile.address.city() !== 'Zurich' || profile.email() !== '') {
  throw new Error('Restoration should use declaration values, not the last loaded values.');
}
if (!profile.pristine() || !profile.untouched() || !profile.invalid()) {
  throw new Error('Restoration should clear interaction state while preserving required validation.');
}

profile.name.set('Keep this sibling');
profile.address.city.set('Bern');
profile.address.resetToInitial();
profile.address.city(); // 'Zurich'
if (profile.name() !== 'Keep this sibling' || profile.address.city() !== 'Zurich') {
  throw new Error('Restoring a branch should leave sibling values unchanged.');
}
