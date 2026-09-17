import type { AnyNode } from '../types/node.type';
import { markAsAsyncValidator, type AsyncValidatorOptions, type ParameterizedAsyncValidatorOptions } from './utils/async-validator-marker';
import type { DeferredCondition, DeferredValidator, AsyncValidationResult, AsyncValidator, AsyncValidatorApi, AsyncValidatorBaseContext, AsyncValidatorContext, ParameterizedAsyncValidatorContext, ValidationResult, ValidatorOwner, ValidatorReadonlyApi } from './validation.type';

export type ParameterizedAsyncValidatorConfig<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode> = ParameterizedAsyncValidatorOptions<TValue, TParams, TApi, ValidatorOwner<TField>> & {
  /**
   * Validates one stable `params` snapshot. Signal reads inside this callback do not
   * register dependencies; declare them in `params`. Return a Promise-like or Observable-like
   * validation result. Use `abortSignal` to cancel external work; obsolete results are ignored.
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
  validate: (context: ParameterizedAsyncValidatorContext<TValue, TParams, TApi, ValidatorOwner<TField>>) => AsyncValidationResult;
};

/**
 * Creates asynchronous validation with explicitly tracked parameters. `params` is
 * reactive and compared shallowly; `validate` receives a stable parameter snapshot
 * and its own signal reads are not tracked. New parameters abort stale work.
 * Return a Promise-like or Observable-like validation result. No injector is required.
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
 *
 * @reactive Tracks `params` and `when`; changed first-level parameters restart validation.
 */
export function asyncValidator<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode>(config: {
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
  params: (context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => TParams;
  /**
   * Validates one stable `params` snapshot. Signal reads inside this callback do not
   * register dependencies; declare them in `params`. Return a Promise-like or Observable-like
   * validation result. Use `abortSignal` to cancel external work; obsolete results are ignored.
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
  validate: (context: ParameterizedAsyncValidatorContext<TValue, TParams, TApi, ValidatorOwner<TField>>) => AsyncValidationResult;
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
   *   validators: asyncValidator({
   *     params: ({ value }) => value(),
   *     validate: async () => null,
   *     debounce: 300,
   *   }),
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
   *   validators: asyncValidator({
   *     params: ({ value }) => value(),
   *     validate: async () => null,
   *     when: () => enabled(),
   *   }),
   * });
   * ```
   *
   * @reactive Tracks condition reads and restarts or cancels work when they change.
   */
  when?: NoInfer<DeferredCondition | ((context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => boolean)>;
  /**
   * Maps a rejected Promise, thrown execution error, or failed Observable to validation
   * errors. The original error and current base context are supplied. Cancelled or
   * obsolete executions do not publish mapped results. Return null/undefined to omit errors.
   *
   * **Default:** `undefined`; an execution failure contributes no validation error.
   *
   * ```ts
   * field('', {
   *   validators: asyncValidator({
   *     params: ({ value }) => value(),
   *     validate: async () => {
   *       throw new Error('Unavailable');
   *     },
   *     onError: () => ({ kind: 'offline' }),
   *   }),
   * });
   * ```
   */
  onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => ValidationResult;
}): AsyncValidator<TValue, TField>;
/**
 * Creates asynchronous validation from a Promise-like or Observable-like callback.
 * Synchronous reads before the first await become dependencies; read needed values
 * before awaiting. New dependencies or values cancel stale runs. Async validation
 * requires an interactive node and no blocking synchronous errors.
 * Parameterless callbacks support self-referencing declarations with unchecked returns;
 * context-taking callbacks check their asynchronous result type. No injector is required.
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
 *
 * @reactive Tracks synchronous callback and `when` reads; superseded work is aborted.
 */
export function asyncValidator<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode>(
  validator: NoInfer<DeferredValidator | ((context: AsyncValidatorContext<TValue, TApi, ValidatorOwner<TField>>) => AsyncValidationResult)>,
  options?: {
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
    when?: NoInfer<DeferredCondition | ((context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => boolean)>;
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
    onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => ValidationResult;
  },
): AsyncValidator<TValue, TField>;
/**
 * Infers the value type from an explicitly annotated callback when no consuming node
 * provides contextual inference. The callback must return a Promise-like or Observable-like
 * validation result.
 *
 * ```ts
 * const rule = asyncValidator(
 *   async (
 *     ctx: AsyncValidatorContext<string>,
 *   ) => {
 *     return ctx.value() ? null : 'Required';
 *   },
 * );
 * field.strict('', [rule]);
 * ```
 *
 * @reactive Tracks synchronous callback reads made before the first await.
 */
export function asyncValidator<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode>(
  validator: (context: AsyncValidatorContext<TValue, TApi, ValidatorOwner<TField>>) => AsyncValidationResult,
  options?: {
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
    when?: NoInfer<DeferredCondition | ((context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => boolean)>;
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
    onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => ValidationResult;
  },
): AsyncValidator<TValue, TField>;
export function asyncValidator<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue>, TField extends AnyNode>(
  validatorOrConfig:
    | ((context: AsyncValidatorContext<TValue, TApi, ValidatorOwner<TField>>) => AsyncValidationResult)
    | ParameterizedAsyncValidatorConfig<TValue, TParams, TApi, TField>,
  options: AsyncValidatorOptions<TValue, TApi, ValidatorOwner<TField>> | ParameterizedAsyncValidatorOptions<TValue, TParams, TApi, ValidatorOwner<TField>> = {},
): AsyncValidator<TValue, TField> {
  if (typeof validatorOrConfig === 'function') {
    return markAsAsyncValidator(validatorOrConfig as unknown as AsyncValidator<TValue>, options as unknown as AsyncValidatorOptions<TValue>) as AsyncValidator<TValue, TField>;
  }
  return markAsAsyncValidator(validatorOrConfig.validate as unknown as AsyncValidator<TValue>, validatorOrConfig as unknown as ParameterizedAsyncValidatorOptions<TValue, TParams>) as AsyncValidator<TValue, TField>;
}

export type { AsyncValidatorOptions, ParameterizedAsyncValidatorOptions } from './utils/async-validator-marker';
