import { signal } from '@angular/core';
import { field, form, required, configureGlobalFormNodes } from '@ngblocks/form-nodes';

const message = signal('Please enter your name.');
const profile = form({ name: field('', [required]) });
const restore = configureGlobalFormNodes({
  validatorMessages: { required: () => message() },
});
const restoreBindings = configureGlobalFormNodes({ syncInputs: false });

try {
  if (profile.name.getError('required')?.message !== 'Please enter your name.') {
    throw new Error('A partial binding configuration must preserve global messages.');
  }
  message.set('A name is required.');
  if (profile.name.getError('required')?.message !== 'A name is required.') {
    throw new Error('Global message callbacks must remain reactive.');
  }
  const restoreReset = configureGlobalFormNodes({ validatorMessages: null });
  try {
    if (profile.name.getError('required')?.message !== 'This field is required.') {
      throw new Error('A global message reset must allow the built-in fallback.');
    }
    restore();
  } finally {
    restoreReset();
  }
  if (profile.name.getError('required')?.message !== 'This field is required.') {
    throw new Error('Restoring a later override must skip an already cleaned-up catalog.');
  }
} finally {
  restoreBindings();
  restore();
}
