import type { Validator } from '../validation/validation.type';

const requiredValidators = new WeakSet<Function>();

export const markAsRequiredValidator = <TValue>(validator: Validator<TValue>): Validator<TValue> => {
  requiredValidators.add(validator);
  return validator;
};

export const isRequiredValidator = (validator: Function): boolean => requiredValidators.has(validator);
