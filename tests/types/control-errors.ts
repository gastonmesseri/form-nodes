import type { Provider } from '@angular/core';

import { field, useFormNodeState, provideFormNodeStateErrors, type ControlError, type ControlState, type FormNodeStateOptions } from '../../src/public-api';

const callbacks: FormNodeStateOptions[] = [
  {},
  { errors: () => ({ kind: 'invalidDate', message: 'Enter a valid date.', input: 'bad' }) },
  { errors: () => 'Enter a valid date.' },
  { errors: () => null },
  { errors: () => undefined },
  { errors: () => {} },
  { errors: () => [] },
  { errors: () => ['Invalid', { kind: 'invalidDate' }] as const },
];
const error: ControlError = { kind: 'invalidDate' };
const providers: Provider[] = provideFormNodeStateErrors();
function constructControl() {
  const state: ControlState<Date | null> = useFormNodeState<Date | null>({ errors: () => error });
  return state;
}
const invalidOptions: FormNodeStateOptions = {
  // @ts-expect-error Errors must have a kind, be messages, or represent success.
  errors: () => ({ message: 'Missing kind' }),
};
const invalidAsync: FormNodeStateOptions = {
  // @ts-expect-error This callback contributes synchronous reactive errors, not async validators.
  errors: async () => 'Invalid',
};
const invalidTarget: ControlError = {
  kind: 'invalidDate',
  // @ts-expect-error Control errors belong to their host binding.
  targetNode: field(''),
};
void [callbacks, providers, constructControl, invalidOptions, invalidAsync, invalidTarget];
