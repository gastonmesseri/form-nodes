import type { Validator, ValidatorContext } from '../validation.type';
import { MIN_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultMinMessage } from './default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from './validator-options';

/**
 * Requires a non-empty number to be greater than or equal to a minimum.
 *
 * `null` and `NaN` pass so this validator can be composed with `required`. The minimum may be
 * static or returned by a reactively tracked function. Returning `undefined` or `NaN` disables
 * the constraint temporarily. A failure produces
 * `{ kind: 'min', min, actual, message }`.
 *
 * @reactive Tracks signals read by the minimum and message sources while they are active.
 *
 * @example
 * ```ts
 * field(16, [min(18)]);
 * field(16, [min(18, 'You must be an adult')]);
 * field(16, [min(() => minimumAge(), { message: 'You must be an adult' })]);
 * ```
 *
 * @param minimum Static minimum or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const min = (
  minimum: number | (() => number | undefined),
  options?: string | {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. */
    when?: (context: ValidatorContext<number | null>) => boolean;
  },
): Validator<number | null> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<number | null> = markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum)) return null;
    return currentValue < resolvedMinimum
      ? { kind: 'min', min: resolvedMinimum, actual: currentValue, message: resolveValidatorMessage('min', { min: resolvedMinimum, actual: currentValue }, message, () => defaultMinMessage(resolvedMinimum)) }
      : null;
  }, MIN_METADATA, minimum);
  return applyValidatorWhen(validator, options);
};
