import type { ValidatorMessages } from '@ngblocks/form-nodes';

export const validatorMessages: ValidatorMessages = {
  required: 'This value is required.',
  email: 'Enter a valid email address.',
  min: ({ min }) => `Enter a value of at least ${min}.`,
};
