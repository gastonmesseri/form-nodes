import type { Node } from '../types/node.type';
import type { AsyncValidatorState, FieldContext, ValidatorApi, ValidatorContext } from './validation.type';

const readonlyApiKeys = [
  'form',
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
export const createValidatorContext = <TValue, TField extends Node>(
  context: FieldContext<TValue>,
  field: TField & { $api: AsyncValidatorState },
): ValidatorContext<TValue, ValidatorApi<TValue>, TField> => {
  const validatorContext = context as ValidatorContext<TValue, ValidatorApi<TValue>, TField>;
  if (Object.hasOwn(validatorContext, 'api')) return validatorContext;
  const api = field.$api as unknown as ValidatorApi<TValue>;
  readonlyApiKeys.forEach((key) => {
    if (key === 'value') return;
    Object.defineProperty(validatorContext, key, { enumerable: true, value: api[key] });
  });
  Object.defineProperties(validatorContext, {
    api: { enumerable: true, value: api },
    field: { enumerable: true, value: field },
  });
  return validatorContext;
};
