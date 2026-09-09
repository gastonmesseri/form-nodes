import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { MAX_DATE_METADATA, MIN_DATE_METADATA } from '../constraint-metadata';
import { defaultDateBetweenMessage } from '../utils/default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import { normalizeDateConstraintSource, type DateConstraintSource } from '../utils/date-constraint';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

type ResolvedDateBounds = {
  minimum: Date;
  maximum: Date;
};

const resolveDateSource = (source: Date | (() => Date | undefined)): Date | undefined => {
  return typeof source === 'function' ? source() : source;
};

/**
 * Requires a valid, non-empty date to be within an inclusive date range.
 *
 * `null` and invalid current dates pass so this validator can be composed with `required`. Both
 * limits accept a `Date`, an ISO calendar-date string (`YYYY-MM-DD`), a relative shortcut
 * (`'today'`), or a reactively tracked function returning one of
 * those representations. Strings and shortcuts use UTC midnight by default; set `parseAs` to
 * `'local'` to use local midnight. An absent or invalid limit disables the range temporarily.
 * A failure produces `{ kind: 'dateBetween', minDate, maxDate, actual, message }`.
 *
 * The validator also contributes both dates to the node's `min()` and `max()` metadata.
 *
 * @reactive Tracks signals read by both limits and the message source while they are active.
 *
 * @example
 * ```ts
 * field<Date>(null, [dateBetween('2026-01-01', '2026-12-31')]);
 * field<Date>(null, [dateBetween('2026-01-01', '2026-12-31', 'Choose a date in 2026')]);
 * field<Date>(null, [dateBetween(
 *   () => bookingWindow().start,
 *   () => bookingWindow().end,
 *   { parseAs: 'local', message: 'Choose a date within the booking window' },
 * )]);
 * field<Date>(null, [dateBetween(
 *   moment('2026-01-01').toDate(),
 *   moment('2026-12-31').toDate(),
 * )]);
 * field<Date>(null, [dateBetween('today', '2026-12-31')]);
 * field<Date>(null, [dateBetween(() => 'today', () => bookingWindowEnd())]);
 * ```
 *
 * @param minimum Static inclusive minimum date or ISO calendar-date string, or a reactive function returning one.
 * @param maximum Static inclusive maximum date or ISO calendar-date string, or a reactive function returning one.
 * @param options Optional static message string, or an object containing a message and string parsing mode. `parseAs` defaults to `'utc'`.
 */
export const dateBetween = (
  minimum: Date | 'today' | (string & {}) | (() => Date | 'today' | (string & {}) | undefined),
  maximum: Date | 'today' | (string & {}) | (() => Date | 'today' | (string & {}) | undefined),
  options?: string | ({
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /** Custom error or errors returned instead of the built-in error. */
    error?: ValidationResult | ((context: ValidatorContext<Date | null>) => ValidationResult);
  }) & {
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. Parameterless conditions have unchecked returns for class self-references; return a boolean. Context-taking conditions retain boolean checking. */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<Date | null>) => boolean)>;
    /** Interprets calendar-date strings at UTC or local midnight. Defaults to `'utc'`. */
    parseAs?: 'utc' | 'local';
  },
): Validator<Date | null> => {
  const parseAs = typeof options === 'object' ? options.parseAs ?? 'utc' : 'utc';
  const message = resolveValidatorMessageOption(options);
  const normalizedMinimum = normalizeDateConstraintSource(minimum as DateConstraintSource, parseAs);
  const normalizedMaximum = normalizeDateConstraintSource(maximum as DateConstraintSource, parseAs);
  const resolveBounds = (): ResolvedDateBounds | undefined => {
    const resolvedMinimum = resolveDateSource(normalizedMinimum);
    const resolvedMaximum = resolveDateSource(normalizedMaximum);
    if (
      resolvedMinimum === undefined
      || resolvedMaximum === undefined
      || Number.isNaN(resolvedMinimum.getTime())
      || Number.isNaN(resolvedMaximum.getTime())
    ) return undefined;
    return { minimum: resolvedMinimum, maximum: resolvedMaximum };
  };
  const validator: Validator<Date | null> = ({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue.getTime())) return null;
    const bounds = resolveBounds();
    if (bounds === undefined) return null;
    if (currentValue >= bounds.minimum && currentValue <= bounds.maximum) return null;
    const parameters = { minDate: bounds.minimum, maxDate: bounds.maximum, actual: currentValue };
    return {
      kind: 'dateBetween',
      ...parameters,
      message: resolveValidatorMessage('dateBetween', parameters, message, () => defaultDateBetweenMessage(bounds.minimum, bounds.maximum)),
    };
  };
  markValidatorMetadata(validator, MIN_DATE_METADATA, () => resolveBounds()?.minimum);
  return applyValidatorWhen(
    markValidatorMetadata(validator, MAX_DATE_METADATA, () => resolveBounds()?.maximum),
    options,
  );
};
