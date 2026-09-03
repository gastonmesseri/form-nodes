import { signal } from '@angular/core';

import { configureGlobalValidatorMessages, field, form, required } from 'form-nodes';

const locale = signal<'en' | 'es'>('en');
const locked = signal(false);
const restoreMessages = configureGlobalValidatorMessages({
  required: 'Global required message.',
});

try {
  const profileForm = form({
    displayName: field('', [required]),
  }, {
    disabled: () => locked() ? 'The profile is locked.' : false,
    validatorMessages: () => ({
      required: locale() === 'es'
        ? 'Este campo es obligatorio.'
        : 'This field is required.',
    }),
  });

  if (profileForm.displayName.getError('required')?.message !== 'This field is required.') {
    throw new Error('The form-tree catalog should override the global catalog.');
  }

  locale.set('es');

  if (profileForm.displayName.getError('required')?.message !== 'Este campo es obligatorio.') {
    throw new Error('The selected validator message should react to locale changes.');
  }

  locked.set(true);

  if (!profileForm.displayName.disabled()) {
    throw new Error('Configured disabled state should propagate to descendants.');
  }
  if (profileForm.displayName.disabledReasons()[0]?.message !== 'The profile is locked.') {
    throw new Error('The inherited disabled reason should remain observable.');
  }

  locked.set(false);

  if (profileForm.disabled() || profileForm.displayName.disabled()) {
    throw new Error('The subtree should become enabled when its configured cause clears.');
  }
} finally {
  restoreMessages();
}
