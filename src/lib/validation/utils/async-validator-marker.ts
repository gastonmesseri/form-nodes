import type { AnyNode } from '../../types/node.type';
import type { AsyncValidator, AsyncValidatorApi, AsyncValidatorBaseContext, ValidationResult, ValidatorNode, ValidatorReadonlyApi } from '../validation.type';

/** Scheduling, activation, and failure-handling options for `asyncValidator()`. */
export type AsyncValidatorOptions<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = {
  /**
   * Delay in milliseconds before each execution. A newer trigger cancels the pending delay.
   *
   * @example Wait 300 milliseconds after the latest change.
   * ```ts
   * asyncValidator(
   *   () => Promise.resolve(null),
   *   { debounce: 300 },
   * );
   * ```
   */
  debounce?: number;
  /**
   * Reactive condition controlling whether validation is active. Signals read here are tracked.
   *
   * @example Check availability only after three characters are entered.
   * ```ts
   * asyncValidator(
   *   () => Promise.resolve(null),
   *   { when: () => usernameChecksEnabled() },
   * );
   * ```
   *
   * @reactive Tracks signals read by this condition and reruns or cancels validation when it changes.
   */
  when?: (context: AsyncValidatorBaseContext<TValue, TApi, TField>) => boolean;
  /**
   * Converts a rejected Promise, thrown error, or failed Observable into a validation result.
   *
   * @example Present a domain-friendly error when the remote check fails.
   * ```ts
   * asyncValidator(
   *   () => checkUsername().then(() => null),
   *   {
   *     onError: () => ({
   *       kind: 'usernameCheckUnavailable',
   *       message: 'The username could not be checked. Try again later.',
   *     }),
   *   },
   * );
   * ```
   */
  onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi, TField>) => ValidationResult;
};

/** Options for an async validator whose tracked dependencies are exposed as a typed snapshot. */
export type ParameterizedAsyncValidatorOptions<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = AsyncValidatorOptions<TValue, TApi, TField> & {
  /**
   * Reactively derives the explicit dependency snapshot passed to the validator. Signals read by
   * this function are tracked, while object and array results are compared shallowly.
   *
   * @example
   * ```ts
   * const location = signal({ city: 'Zurich', country: 'Switzerland' });
   *
   * const options: ParameterizedAsyncValidatorOptions<string, { where: string }> = {
   *   params: () => ({
   *     where: location().city,
   *   }),
   * };
   * ```
   *
   * A `location` emission reevaluates `params`, but validation restarts only when the resulting
   * first-level `where` value changes.
   *
   * @reactive Tracks signals read by this function and compares the returned snapshot shallowly.
   */
  params: (context: AsyncValidatorBaseContext<TValue, TApi, TField>) => TParams;
};

type StoredAsyncValidatorOptions<TValue> = AsyncValidatorOptions<TValue> & {
  readonly params?: (context: AsyncValidatorBaseContext<TValue>) => unknown;
};

const asyncValidators = new WeakMap<Function, StoredAsyncValidatorOptions<any>>();

export const markAsAsyncValidator = <TValue>(
  validator: AsyncValidator<TValue>,
  options: StoredAsyncValidatorOptions<TValue>,
): AsyncValidator<TValue> => {
  asyncValidators.set(validator, options);
  return validator;
};

export const isAsyncValidator = (validator: Function): boolean => asyncValidators.has(validator);

export const getAsyncValidatorOptions = <TValue>(validator: AsyncValidator<TValue>): StoredAsyncValidatorOptions<TValue> => {
  return asyncValidators.get(validator) ?? {};
};
