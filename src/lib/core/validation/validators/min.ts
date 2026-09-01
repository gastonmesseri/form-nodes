import type { Validator } from '../validation.type';
import { MIN_METADATA } from '../constraint-metadata';
import type { ValidatorOptions } from './validator-options';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultValidatorMessages } from './default-validator-messages';

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
 * field(16, [min(() => minimumAge(), { message: 'You must be an adult' })]);
 * ```
 *
 * @param minimum Static minimum or a reactive function returning it.
 * @param options Optional static or reactive custom validation message.
 */
export const min = (
  minimum: number | (() => number | undefined),
  options?: ValidatorOptions,
): Validator<number | null> => {
  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum)) return null;
    return currentValue < resolvedMinimum
      ? { kind: 'min', min: resolvedMinimum, actual: currentValue, message: resolveValidatorMessage(options?.message, () => defaultValidatorMessages.min(resolvedMinimum)) }
      : null;
  }, MIN_METADATA, minimum);
};
