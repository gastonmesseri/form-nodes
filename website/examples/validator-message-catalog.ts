import type { ValidatorMessages } from '@gem/ng-forms';

export const validatorMessages: ValidatorMessages = {
  required: 'This value is required.',
  email: 'Enter a valid email address.',
  min: ({ min }) => `Enter a value of at least ${min}.`,
};
