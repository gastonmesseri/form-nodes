import { field, form } from '@ngblocks/form-nodes';

const profile = form({
  name: field('Ada', {
    equal: (previous, next) => previous?.toLowerCase() === next?.toLowerCase(),
    debounce: 'blur',
  }),
});

profile.name.value(); // 'Ada': equivalent to profile.name()
profile.name.value.control.set('ADA');
profile.name.value.control(); // 'ADA': input is available immediately
profile.name.value.committed(); // 'Ada': debounce has not finished
if (profile.name.value.control() !== 'ADA' || profile.name.value.committed() !== 'Ada') {
  throw new Error('Pending input must remain separate from committed data.');
}

profile.name.flush();
profile.name.value(); // 'Ada': equal retains the exposed spelling
profile.name.value.committed(); // 'ADA': the latest committed spelling
profile.value.committed(); // { name: 'ADA' }: bypasses child equality too
if (profile.name.value() !== 'Ada' || profile.value.committed().name !== 'ADA') {
  throw new Error('Committed reads must include writes hidden by custom equality.');
}

profile.name.value.control.set('discarded draft');
profile.name.value.committed.set('Grace');
profile.name.value.control(); // 'Grace': the pending draft was cancelled
profile.name.value.committed(); // 'Grace'
if (profile.name.debouncing() || profile.name.value.control() !== 'Grace' || !profile.name.dirty()) {
  throw new Error('Committed writes must cancel pending input and preserve interaction state.');
}

profile.resetToInitial();
profile.name.value.committed(); // 'Ada'
if (profile.name.value.committed() !== 'Ada' || profile.dirty()) {
  throw new Error('Restoring initial values must reset all value views and interaction state.');
}
