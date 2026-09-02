import { signal } from '@angular/core';

import type { Node } from '../types/node.type';
import type { AsyncValidatorState, FieldContext, ValidatorApi, ValidatorContext } from './validation.type';

const readonlyApiKeys = [
  'parent',
  'path',
  'value',
  'touched',
  'untouched',
  'dirty',
  'pristine',
  'disabled',
  'disabledReasons',
  'enabled',
  'readonly',
  'writable',
  'hidden',
  'visible',
  'required',
] as const;

/** Adds the stable readonly node facade used by validator callbacks. */
export const createValidatorContext = <TValue>(
  context: FieldContext<TValue>,
  field: Node & { $api: AsyncValidatorState },
): ValidatorContext<TValue> => {
  const validatorContext = context as ValidatorContext<TValue>;
  if (Object.hasOwn(validatorContext, 'api')) return validatorContext;
  const api = field.$api as unknown as ValidatorApi<TValue>;
  readonlyApiKeys.forEach((key) => {
    if (key === 'value') return;
    Object.defineProperty(validatorContext, key, { enumerable: true, value: api[key] });
  });
  const node = signal(field).asReadonly();
  Object.defineProperties(validatorContext, {
    api: { enumerable: true, value: api },
    field: { enumerable: true, value: node },
    node: { enumerable: true, value: node },
  });
  return validatorContext;
};
