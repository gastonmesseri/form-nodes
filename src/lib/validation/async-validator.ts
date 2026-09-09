import type { AnyNode } from '../types/node.type';
import { markAsAsyncValidator, type AsyncValidatorOptions, type ParameterizedAsyncValidatorOptions } from './utils/async-validator-marker';
import type { DeferredCondition, DeferredValidator, AsyncValidationResult, AsyncValidator, AsyncValidatorApi, AsyncValidatorBaseContext, AsyncValidatorContext, ParameterizedAsyncValidatorContext, ValidationResult, ValidatorOwner, ValidatorReadonlyApi } from './validation.type';

export type ParameterizedAsyncValidatorConfig<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode> = ParameterizedAsyncValidatorOptions<TValue, TParams, TApi, ValidatorOwner<TField>> & {
  /**
   * Validates one stable params snapshot. Signals read here are not tracked automatically.
   *
   * @example Return a Promise directly.
   * ```ts
   * asyncValidator({
   *   params: ({ value }) => ({ username: value() }),
   *   validate: ({ params }) => {
   *     return api.isUsernameAvailable(params.username).then(available =>
   *       available ? null : { kind: 'usernameTaken' },
   *     );
   *   },
   * });
   * ```
   */
  validate: (context: ParameterizedAsyncValidatorContext<TValue, TParams, TApi, ValidatorOwner<TField>>) => AsyncValidationResult;
};

/**
 * Creates a Promise- or Observable-based validator with an explicit reactive params snapshot.
 *
 * Use this signature when the request depends on a small, explicit set of values. `params` is
 * tracked reactively and compared shallowly; `validate` receives one stable snapshot.
 *
 * @example Validate a username within the currently selected city.
 * ```ts
 * const location = signal({ city: 'Zurich' });
 *
 * const username = field('', {
 *   validators: asyncValidator({
 *     params: ({ value }) => ({
 *       username: value(),
 *       city: location().city,
 *     }),
 *     validate: async ({ params, abortSignal }) => {
 *       const available = await api.isUsernameAvailable(params, abortSignal);
 *       return available
 *         ? null
 *         : { kind: 'usernameTaken', message: 'This username is already in use.' };
 *     },
 *   }),
 * });
 * ```
 *
 * @reactive Tracks signals read by `params` and `when`. Only shallow params changes trigger a new execution.
 */
export function asyncValidator<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode>(config: {
  /**
   * Reactively derives the explicit dependency snapshot passed to `validate`. Signals read here
   * are tracked. Object and array results are compared shallowly, so validation reruns only when a
   * first-level parameter changes.
   *
   * @example Track only the selected city as the request's `where` parameter.
   * ```ts
   * const location = signal({ city: 'Zurich', country: 'Switzerland' });
   *
   * asyncValidator({
   *   params: () => ({
   *     where: location().city,
   *   }),
   *   validate: ({ params }) => checkAvailability(params.where),
   * });
   * ```
   *
   * Reading `location().city` tracks the `location` signal. Whenever `location` emits, `params`
   * is evaluated again. If only `country` changed, the shallow result is still
   * `{ where: 'Zurich' }`, so validation does not rerun. Changing `city` changes `where` and starts
   * a new validation execution.
   *
   * @reactive Tracks signals read by this function and compares the returned snapshot shallowly.
   */
  params: (context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => TParams;
  /**
   * Validates one stable params snapshot. Signals read here are not tracked automatically.
   *
   * @example Return a Promise directly.
   * ```ts
   * asyncValidator({
   *   params: ({ value }) => ({ username: value() }),
   *   validate: ({ params }) => {
   *     return api.isUsernameAvailable(params.username).then(available =>
   *       available ? null : { kind: 'usernameTaken' },
   *     );
   *   },
   * });
   * ```
   */
  validate: (context: ParameterizedAsyncValidatorContext<TValue, TParams, TApi, ValidatorOwner<TField>>) => AsyncValidationResult;
  /**
   * Delay in milliseconds before each execution. A newer params snapshot cancels the pending delay.
   *
   * @example
   * ```ts
   * asyncValidator({
   *   params: () => ({ username: 'marco' }),
   *   validate: () => Promise.resolve(null),
   *   debounce: 300,
   * });
   * ```
   */
  debounce?: number;
  /**
   * Reactive condition controlling whether validation is active. Signals read here are tracked.
   *
   * @example
   * ```ts
   * asyncValidator({
   *   params: ({ value }) => ({ username: value() }),
   *   validate: () => Promise.resolve(null),
   *   when: () => usernameChecksEnabled(),
   * });
   * ```
   *
   * @reactive Tracks signals read by this condition and reruns or cancels validation when it changes.
   * Parameterless conditions have unchecked returns for class self-references; return a boolean. Context-taking conditions retain boolean checking.
   */
  when?: NoInfer<DeferredCondition | ((context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => boolean)>;
  /**
   * Converts a rejected Promise, thrown error, or failed Observable into a validation result.
   *
   * @example
   * ```ts
   * asyncValidator({
   *   params: () => ({ username: 'marco' }),
   *   validate: ({ params }) => checkUsername(params.username).then(() => null),
   *   onError: () => ({
   *     kind: 'usernameCheckUnavailable',
   *     message: 'The username could not be checked. Try again later.',
   *   }),
   * });
   * ```
   */
  onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => ValidationResult;
}): AsyncValidator<TValue, TField>;
/**
 * Creates a Promise- or Observable-based validator whose callback dependencies are tracked automatically.
 *
 * Pass the asynchronous callback directly for the simplest form:
 *
 * @example Validate a username with a Promise.
 * ```ts
 * const username = field('', {
 *   validators: asyncValidator(async ({ value, abortSignal }) => {
 *     const available = await api.isUsernameAvailable(value(), abortSignal);
 *     return available
 *       ? null
 *       : { kind: 'usernameTaken', message: 'This username is already in use.' };
 *   }),
 * });
 * ```
 *
 * Pass a second object when the direct callback needs debounce, a condition, or error mapping:
 *
 * @example Add simple execution options.
 * ```ts
 * const username = field('', {
 *   validators: asyncValidator( async ({ value, abortSignal }) => {
 *     const available = await api.isUsernameAvailable(value(), abortSignal);
 *     return available ? null : { kind: 'usernameTaken' };
 *   }, {
 *     debounce: 300,
 *     when: ({ value }) => (value()?.length ?? 0) >= 3,
 *     onError: () => ({ kind: 'usernameCheckUnavailable' }),
 *   }),
 * });
 * ```
 *
 * Parameterless callbacks accept unchecked returns to support class form self-references.
 * They must still return a Promise-like or Observable-like validation result at runtime.
 * Callbacks receiving a context retain checked asynchronous results.
 *
 * @reactive Tracks signals read by the validator and `when`; changes cancel stale work and trigger a new execution.
 */
export function asyncValidator<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode>(
  validator: NoInfer<DeferredValidator | ((context: AsyncValidatorContext<TValue, TApi, ValidatorOwner<TField>>) => AsyncValidationResult)>,
  options?: {
    /**
     * Delay in milliseconds before each execution. A newer trigger cancels the pending delay.
     *
     * @example
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
     * @example
     * ```ts
     * asyncValidator(
     *   () => Promise.resolve(null),
     *   { when: () => usernameChecksEnabled() },
     * );
     * ```
     *
     * @reactive Tracks signals read by this condition and reruns or cancels validation when it changes.
     * Parameterless conditions have unchecked returns for class self-references; return a boolean. Context-taking conditions retain boolean checking.
     */
    when?: NoInfer<DeferredCondition | ((context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => boolean)>;
    /**
     * Converts a rejected Promise, thrown error, or failed Observable into a validation result.
     *
     * @example
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
    onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => ValidationResult;
  },
): AsyncValidator<TValue, TField>;
/** Infers the value from an explicitly typed callback when no consuming node provides a context. */
export function asyncValidator<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode>(
  validator: (context: AsyncValidatorContext<TValue, TApi, ValidatorOwner<TField>>) => AsyncValidationResult,
  options?: {
    /**
     * Delay in milliseconds before each execution. A newer trigger cancels the pending delay.
     *
     * @example
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
     * @example
     * ```ts
     * asyncValidator(
     *   () => Promise.resolve(null),
     *   { when: () => usernameChecksEnabled() },
     * );
     * ```
     *
     * @reactive Tracks signals read by this condition and reruns or cancels validation when it changes.
     * Parameterless conditions have unchecked returns for class self-references; return a boolean. Context-taking conditions retain boolean checking.
     */
    when?: NoInfer<DeferredCondition | ((context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => boolean)>;
    /**
     * Converts a rejected Promise, thrown error, or failed Observable into a validation result.
     *
     * @example
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
    onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi, ValidatorOwner<TField>>) => ValidationResult;
  },
): AsyncValidator<TValue, TField>;
export function asyncValidator<TValue, TParams>(
  validatorOrConfig:
    | ((context: AsyncValidatorContext<TValue>) => AsyncValidationResult)
    | ParameterizedAsyncValidatorConfig<TValue, TParams>,
  options: AsyncValidatorOptions<TValue> | ParameterizedAsyncValidatorOptions<TValue, TParams> = {},
): AsyncValidator<TValue> {
  if (typeof validatorOrConfig === 'function') {
    return markAsAsyncValidator(validatorOrConfig as unknown as AsyncValidator<TValue>, options);
  }
  return markAsAsyncValidator(validatorOrConfig.validate as unknown as AsyncValidator<TValue>, validatorOrConfig);
}

export type { AsyncValidatorOptions, ParameterizedAsyncValidatorOptions } from './utils/async-validator-marker';
