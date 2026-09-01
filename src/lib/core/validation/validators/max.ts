import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { MAX_METADATA } from '../constraint-metadata';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

/**
 * Requires a non-empty number to be less than or equal to a maximum.
 *
 * `null` and `NaN` pass so this validator can be composed with `required`. The maximum may be
 * static or returned by a reactively tracked function. Returning `undefined` or `NaN` disables
 * the constraint temporarily. A failure produces
 * `{ kind: 'max', max, actual, message }`.
 *
 * @reactive Tracks signals read by the maximum source and revalidates when they change.
 *
 * @example
 * ```ts
 * field(130, [max(120)]);
 * field(130, [max(() => maximumAge(), { message: 'Enter a realistic age' })]);
 * ```
 *
 * @param maximum Static maximum or a reactive function returning it.
 * @param options Optional custom validation message.
 */
export const max = (
  maximum: number | (() => number | undefined),
  options?: ValidatorOptions,
): Validator<number | null> => {
  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined || Number.isNaN(resolvedMaximum)) return null;
    return currentValue > resolvedMaximum
      ? { kind: 'max', max: resolvedMaximum, actual: currentValue, message: options?.message ?? defaultValidatorMessages.max(resolvedMaximum) }
      : null;
  }, MAX_METADATA, maximum);
};
