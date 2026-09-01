import type { Validator } from '../validation.type';
import { MAX_METADATA, MIN_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultBetweenMessage } from './default-validator-messages';

type ResolvedBounds = {
  minimum: number;
  maximum: number;
};

const resolveBound = (source: number | (() => number | undefined)): number | undefined => {
  return typeof source === 'function' ? source() : source;
};

/**
 * Requires a non-empty number to be within an inclusive range.
 *
 * `null` and `NaN` pass so this validator can be composed with `required`. Both limits may be
 * static or returned by reactively tracked functions. Returning `undefined` or `NaN` from either
 * source disables the range temporarily. A failure produces
 * `{ kind: 'between', min, max, actual, message }`.
 *
 * The validator also contributes both limits to the node's `min()` and `max()` metadata.
 *
 * @reactive Tracks signals read by both limits and the message source while they are active.
 *
 * @example
 * ```ts
 * field(17, [between(18, 65)]);
 * field(70, [between(() => minimumAge(), () => maximumAge(), {
 *   message: 'Enter an age within the supported range',
 * })]);
 * ```
 *
 * @param minimum Static inclusive minimum or a reactive function returning it.
 * @param maximum Static inclusive maximum or a reactive function returning it.
 * @param options Optional static or reactive custom validation message.
 */
export const between = (
  minimum: number | (() => number | undefined),
  maximum: number | (() => number | undefined),
  options?: {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
  },
): Validator<number | null> => {
  const resolveBounds = (): ResolvedBounds | undefined => {
    const resolvedMinimum = resolveBound(minimum);
    const resolvedMaximum = resolveBound(maximum);
    if (
      resolvedMinimum === undefined
      || resolvedMaximum === undefined
      || Number.isNaN(resolvedMinimum)
      || Number.isNaN(resolvedMaximum)
    ) return undefined;
    return { minimum: resolvedMinimum, maximum: resolvedMaximum };
  };
  const validator: Validator<number | null> = ({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const bounds = resolveBounds();
    if (bounds === undefined) return null;
    if (currentValue >= bounds.minimum && currentValue <= bounds.maximum) return null;
    const parameters = { min: bounds.minimum, max: bounds.maximum, actual: currentValue };
    return {
      kind: 'between',
      ...parameters,
      message: resolveValidatorMessage('between', parameters, options?.message, () => defaultBetweenMessage(bounds.minimum, bounds.maximum)),
    };
  };
  markValidatorMetadata(validator, MIN_METADATA, () => resolveBounds()?.minimum);
  return markValidatorMetadata(validator, MAX_METADATA, () => resolveBounds()?.maximum);
};
