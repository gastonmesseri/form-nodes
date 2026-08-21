import type { Validator } from './validation.type';

/**
 * Stores the unambiguous runtime implementation of overloaded validators.
 *
 * Some validators can be used both directly and as factories. For example,
 * `required` is valid as `[required]`, while `required({ message })` creates a
 * configured validator. Calling the public overloaded function from
 * `runValidators` would be ambiguous when the field value itself matches the
 * factory options shape, such as `{ message: 'A field value' }`.
 *
 * The registry lets the validator runner execute the direct validation logic
 * without inspecting the value or exposing an internal marker on the public
 * validator type. Validators without a registered implementation are executed
 * normally.
 */
const validatorImplementations = new WeakMap<Validator<any>, Validator<any>>();

export const registerValidatorImplementation = <TValue>(
  validator: Validator<TValue>,
  implementation: Validator<TValue>,
): void => {
  validatorImplementations.set(validator, implementation);
};

export const getValidatorImplementation = <TValue>(
  validator: Validator<TValue>,
): Validator<TValue> => validatorImplementations.get(validator) ?? validator;
