import type { AnyNode } from '../../types/node.type';
import type { DeferredCondition, AsyncValidator, AsyncValidatorApi, AsyncValidatorBaseContext, ValidationResult, ValidatorNode, ValidatorReadonlyApi } from '../validation.type';

/**
 * Scheduling, activation, and failure-handling options for `asyncValidator()`.
 *
 * ```ts
 * field('', {
 *   validators: asyncValidator(
 *     async ({ value }) => {
 *       const name = value();
 *       await Promise.resolve();
 *       return name === 'reserved'
 *         ? { kind: 'unavailable' }
 *         : null;
 *     },
 *   ),
 * });
 * ```
 */
export type AsyncValidatorOptions<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = {
  /**
   * Delays asynchronous execution or publication by this many milliseconds. A new trigger
   * cancels the previous delay. Parameterized validators wait before calling `validate`.
   * A direct validator's first call discovers dependencies immediately; its result is held
   * until the initial delay ends. Later direct executions wait before calling the validator.
   * This does not delay committed node values; use the node's `debounce` option for that.
   *
   * **Default:** `0`; no asynchronous validation delay.
   *
   * ```ts
   * field('', {
   *   validators: asyncValidator(
   *     async () => null,
   *     { debounce: 300 },
   *   ),
   * });
   * ```
   */
  debounce?: number;
  /**
   * Enables asynchronous validation while the condition is true. A false result
   * cancels active work and clears this validator's contribution. Signal reads are tracked.
   * Parameterless callbacks support self-references with unchecked returns; return a boolean.
   * Context-taking callbacks retain boolean checking.
   *
   * **Default:** `undefined`; enabled when the normal validation prerequisites are met.
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const enabled = signal(true);
   * field('', {
   *   validators: asyncValidator(
   *     async () => null,
   *     { when: () => enabled() },
   *   ),
   * });
   * ```
   *
   * @reactive Tracks condition reads and restarts or cancels work when they change.
   */
  when?: DeferredCondition | ((context: AsyncValidatorBaseContext<TValue, TApi, TField>) => boolean);
  /**
   * Maps a rejected Promise, thrown execution error, or failed Observable to validation
   * errors. The original error and current base context are supplied. Cancelled or
   * obsolete executions do not publish mapped results. Return null/undefined to omit errors.
   *
   * **Default:** `undefined`; an execution failure contributes no validation error.
   *
   * ```ts
   * field('', {
   *   validators: asyncValidator(
   *     async () => {
   *       throw new Error('Unavailable');
   *     },
   *     {
   *       onError: () => ({ kind: 'offline' }),
   *     },
   *   ),
   * });
   * ```
   */
  onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi, TField>) => ValidationResult;
};

/**
 * Options for an async validator whose tracked dependencies are exposed as a typed snapshot.
 *
 * ```ts
 * field('', {
 *   validators: asyncValidator({
 *     params: ({ value }) => value(),
 *     validate: async ({ params }) => {
 *       return params === 'reserved'
 *         ? { kind: 'unavailable' }
 *         : null;
 *     },
 *   }),
 * });
 * ```
 */
export type ParameterizedAsyncValidatorOptions<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = AsyncValidatorOptions<TValue, TApi, TField> & {
  /**
   * Derives the dependency snapshot passed to `validate`. Signals read here are tracked.
   * Objects and arrays are compared shallowly, so an unchanged first-level snapshot
   * does not restart validation even if a source signal emits. Scalars use value equality.
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const city = signal('Zurich');
   * field('', {
   *   validators: asyncValidator({
   *     params: () => city(),
   *     validate: async ({ params }) => {
   *       return params === 'reserved'
   *         ? { kind: 'unavailable' }
   *         : null;
   *     },
   *   }),
   * });
   * ```
   *
   * @reactive Tracks reads and compares the returned snapshot shallowly.
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

/** Defers user conditions and synchronous guards until the declaring class can finish initializing. */
export const needsDeferredValidationStart = (validators: readonly Function[]): boolean => {
  return validators.some(validator => !isAsyncValidator(validator) || asyncValidators.get(validator)!.when !== undefined);
};
