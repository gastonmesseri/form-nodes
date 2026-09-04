import type { ComposableValidator } from './validation.type';

/**
 * Gives a reusable synchronous validator a fully typed authoring context.
 *
 * Use this helper when declaring a validator separately from `field()`, `form()`, or `array()`,
 * where contextual inference from the consuming node is unavailable. The returned function is the
 * original function: `validator()` adds no wrapper, dependency-injection requirement, or runtime
 * behavior.
 *
 * `TValue` is the exact value observed by the validator. Because `field()` is nullable by default,
 * its standalone validators normally use a type such as `number | null`. Omit `null` only for a
 * field created with `field.strict()`. Form and array nodes use their non-null aggregate models.
 *
 * @reactive The returned validator tracks every signal read while the validation pipeline executes it.
 *
 * @example
 * ```ts
 * export const isAdult = validator<number | null>(({ value }) => {
 *   const age = value();
 *   return age !== null && age < 18
 *     ? { kind: 'adult', minimumAge: 18, actual: age }
 *     : null;
 * });
 *
 * const age = field<number>(null, [adult]);
 * ```
 *
 * @example
 * ```ts
 * export const positive = validator<number>(({ value }) => {
 *   return value() > 0 ? null : { kind: 'positive' };
 * });
 *
 * const quantity = field.strict(1, [positive]);
 * ```
 *
 * @example
 * ```ts
 * type Profile = { name: string | null; age: number | null };
 *
 * export const completeProfile = validator<Profile>(({ value }) => {
 *   return value().name === null ? { kind: 'incompleteProfile' } : null;
 * });
 * ```
 *
 * @template TValue Exact field, form, or array value observed by the validator.
 * @param validate Synchronous validation function to type and reuse.
 * @returns The same validation function, without a runtime wrapper.
 */
export const validator = <TValue>(validate: ComposableValidator<TValue>): ComposableValidator<TValue> => {
  return validate;
};
