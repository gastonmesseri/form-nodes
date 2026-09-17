import { isFieldContext } from '../utils/field-context-marker';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { defaultUniqueItemsMessage } from '../utils/default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption, type ValidatorOptions } from '../utils/validator-options';
import type { DeferredCondition, BuiltInValidationErrorMap, FieldContext, ValidationResult, Validator, ValidatorContext } from '../validation.type';

type UniqueItemsOptions<TItem = unknown> = ValidatorOptions<readonly TItem[] | null | undefined>;

type UniqueItemsKeySelector<TItem> = keyof TItem | ((item: TItem, index: number) => unknown);

const resolveKey = (item: unknown, index: number, keySelector?: PropertyKey | ((item: any, index: number) => unknown)): unknown => {
  if (keySelector === undefined) return item;
  if (typeof keySelector === 'function') return keySelector(item, index);
  return (item as Record<PropertyKey, unknown>)[keySelector];
};

const validateUniqueItems = <TItem>(
  context: FieldContext<readonly TItem[] | null | undefined>,
  keySelector?: UniqueItemsKeySelector<TItem>,
  message?: string | (() => string | undefined),
): BuiltInValidationErrorMap['uniqueItems'] | null => {
  const firstIndexByKey = new Map<unknown, number>();
  const duplicateIndexes = new Set<number>();
  const items = context.value() ?? [];

  items.forEach((item, index) => {
    const key = resolveKey(item, index, keySelector);
    const firstIndex = firstIndexByKey.get(key);
    if (firstIndex === undefined) {
      firstIndexByKey.set(key, index);
      return;
    }
    duplicateIndexes.add(firstIndex);
    duplicateIndexes.add(index);
  });

  if (duplicateIndexes.size === 0) return null;
  const indexes = [...duplicateIndexes].sort((left, right) => left - right);
  return {
    kind: 'uniqueItems',
    duplicateIndexes: indexes,
    message: resolveValidatorMessage('uniqueItems', { duplicateIndexes: indexes }, message, defaultUniqueItemsMessage),
  };
};

/**
 * Requires every array item to be unique using SameValueZero equality.
 *
 * Without a key selector, values are compared like `Set`, so `NaN` equals `NaN`, `0` equals `-0`, and
 * objects use reference identity. The error belongs to the array and exposes only the indexes of
 * every item participating in a duplicate group; duplicated values are intentionally omitted. A
 * failure produces `{ kind: 'uniqueItems', duplicateIndexes, message }`. `null` and `undefined`
 * pass as empty arrays.
 *
 * ```ts
 * const profile = form({
 *   value: field(
 *     ['Ada', 'Ada'],
 *     [
 *       uniqueItems({
 *         message: 'Use unique values.',
 *       }),
 *     ],
 *   ),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @param options Optional static or reactive custom validation message.
 */
export function uniqueItems(options?: ({
  /**
   * Overrides the message of a failing built-in validation error. A reactive function
   * is evaluated only while the rule fails; returning `undefined` continues through the
   * node, provider, global, and built-in message fallbacks. Cannot be combined with `error`.
   *
   * **Default:** `undefined`; use the configured fallback message.
   *
   * **Accepted values:**
   *
   * - **Strings**: Use the supplied text, including an empty string.
   * - **Functions**: Track signals read while resolving the message.
   *
   * ```ts
   * const profile = form({
   *   value: field(
   *     ['Ada', 'Ada'],
   *     [
   *       uniqueItems({
   *         message: 'Check this value.',
   *       }),
   *     ],
   *   ),
   * });
   * ```
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const text = signal('Check this value.');
   * const profile = form({
   *   value: field(
   *     ['Ada', 'Ada'],
   *     [
   *       uniqueItems({
   *         message: () => text(),
   *       }),
   *     ],
   *   ),
   * });
   * ```
   */
  message?: string | (() => string | undefined);
  error?: never;
} | {
  message?: never;
  /**
   * Replaces the built-in failure with a custom error or error array. A callback
   * receives the current validation context and runs only when the built-in rule fails.
   * A callback may return nullish/empty results to suppress the failure. A static nullish
   * value preserves the built-in result. Cannot be combined with `message`.
   *
   * **Default:** `undefined`; retain the built-in error.
   *
   * See {@link ValidationResult} for supported error shapes.
   *
   * ```ts
   * const profile = form({
   *   value: field(
   *     ['Ada', 'Ada'],
   *     [
   *       uniqueItems({
   *         error: { kind: 'custom' },
   *       }),
   *     ],
   *   ),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field(
   *     ['Ada', 'Ada'],
   *     [
   *       uniqueItems({
   *         error: () => ({ kind: 'custom' }),
   *       }),
   *     ],
   *   ),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field(
   *     ['Ada', 'Ada'],
   *     [
   *       uniqueItems({
   *         error: [
   *           { kind: 'custom' },
   *         ],
   *       }),
   *     ],
   *   ),
   * });
   * ```
   */
  error?: ValidationResult | ((context: ValidatorContext<readonly unknown[] | null | undefined>) => ValidationResult);
}) & {
  /**
   * Enables the validator and its constraint metadata only while the condition is true.
   * Signal reads are tracked. A false result skips the rule, message, and error callbacks.
   * Parameterless callbacks support class self-references with unchecked returns; return
   * a boolean. Context-taking callbacks retain boolean checking.
   *
   * **Default:** `undefined`; the validator remains active.
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(true);
   * const profile = form({
   *   value: field(
   *     ['Ada', 'Ada'],
   *     [uniqueItems({ when: () => active() })],
   *   ),
   * });
   * ```
   */
  when?: NoInfer<DeferredCondition | ((context: ValidatorContext<readonly unknown[] | null | undefined>) => boolean)>;
}): Validator<readonly unknown[] | null | undefined>;
/**
 * Validates array item identity when passed directly in a validators array.
 *
 * This is equivalent to `uniqueItems()` and uses the default message. Use the factory form when a
 * key selector or custom message is required.
 *
 * ```ts
 * const profile = form({
 *   value: field(
 *     ['Ada', 'Ada'],
 *     [uniqueItems],
 *   ),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function uniqueItems(context: FieldContext<readonly unknown[] | null | undefined>): ValidationResult;
/**
 * Requires values selected from array items to be unique using SameValueZero equality.
 *
 * A property name is a concise key selector for object values. A key-selector function can compute any
 * comparable key and is evaluated reactively for every item. The error remains on the array and
 * reports all participating indexes in ascending order.
 *
 * ```ts
 * const profile = form({
 *   people: array({
 *     id: field(0),
 *   }, {
 *     initialValue: [
 *       { id: 1 },
 *       { id: 1 },
 *     ],
 *     validators: uniqueItems('id'),
 *   }),
 * });
 * profile.people.invalid(); // true
 * ```
 *
 * ```ts
 * array({
 *   id: field(0),
 * }, {
 *   validators: uniqueItems(row => row.id),
 * });
 * ```
 *
 * @reactive Tracks signals read by a key-selector function and the custom message while they are active.
 * @param keySelector Property name or function selecting the comparable key for each item.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export function uniqueItems<TItem = unknown>(
  keySelector: keyof TItem | ((item: TItem, index: number) => unknown),
  options?: string | ({
    /**
     * Overrides the message of a failing built-in validation error. A reactive function
     * is evaluated only while the rule fails; returning `undefined` continues through the
     * node, provider, global, and built-in message fallbacks. Cannot be combined with `error`.
     *
     * **Default:** `undefined`; use the configured fallback message.
     *
     * **Accepted values:**
     *
     * - **Strings**: Use the supplied text, including an empty string.
     * - **Functions**: Track signals read while resolving the message.
     *
     * ```ts
     * const profile = form({
     *   value: field(
     *     ['Ada', 'Ada'],
     *     [
     *       uniqueItems({
     *         message: 'Check this value.',
     *       }),
     *     ],
     *   ),
     * });
     * ```
     *
     * ```ts
     * import { signal } from '@angular/core';
     *
     * const text = signal('Check this value.');
     * const profile = form({
     *   value: field(
     *     ['Ada', 'Ada'],
     *     [
     *       uniqueItems({
     *         message: () => text(),
     *       }),
     *     ],
     *   ),
     * });
     * ```
     */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /**
     * Replaces the built-in failure with a custom error or error array. A callback
     * receives the current validation context and runs only when the built-in rule fails.
     * A callback may return nullish/empty results to suppress the failure. A static nullish
     * value preserves the built-in result. Cannot be combined with `message`.
     *
     * **Default:** `undefined`; retain the built-in error.
     *
     * See {@link ValidationResult} for supported error shapes.
     *
     * ```ts
     * const profile = form({
     *   value: field(
     *     ['Ada', 'Ada'],
     *     [
     *       uniqueItems({
     *         error: { kind: 'custom' },
     *       }),
     *     ],
     *   ),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(
     *     ['Ada', 'Ada'],
     *     [
     *       uniqueItems({
     *         error: () => ({ kind: 'custom' }),
     *       }),
     *     ],
     *   ),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(
     *     ['Ada', 'Ada'],
     *     [
     *       uniqueItems({
     *         error: [
     *           { kind: 'custom' },
     *         ],
     *       }),
     *     ],
     *   ),
     * });
     * ```
     */
    error?: ValidationResult | ((context: ValidatorContext<readonly TItem[] | null | undefined>) => ValidationResult);
  }) & {
    /**
     * Enables the validator and its constraint metadata only while the condition is true.
     * Signal reads are tracked. A false result skips the rule, message, and error callbacks.
     * Parameterless callbacks support class self-references with unchecked returns; return
     * a boolean. Context-taking callbacks retain boolean checking.
     *
     * **Default:** `undefined`; the validator remains active.
     *
     * ```ts
     * import { signal } from '@angular/core';
     *
     * const active = signal(true);
     * const profile = form({
     *   value: field(
     *     ['Ada', 'Ada'],
     *     [uniqueItems({ when: () => active() })],
     *   ),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<readonly TItem[] | null | undefined>) => boolean)>;
  },
): Validator<readonly TItem[] | null | undefined>;
export function uniqueItems<TItem>(
  contextOrKeySelectorOrOptions?: FieldContext<readonly TItem[] | null | undefined> | UniqueItemsKeySelector<TItem> | UniqueItemsOptions<TItem>,
  selectedOptions?: string | UniqueItemsOptions<TItem>,
): Validator<readonly TItem[] | null | undefined> | ValidationResult {
  if (isFieldContext(contextOrKeySelectorOrOptions)) return validateUniqueItems(contextOrKeySelectorOrOptions);
  const hasKeySelector = typeof contextOrKeySelectorOrOptions === 'function'
    || typeof contextOrKeySelectorOrOptions === 'string'
    || typeof contextOrKeySelectorOrOptions === 'number'
    || typeof contextOrKeySelectorOrOptions === 'symbol';
  const keySelector = hasKeySelector ? contextOrKeySelectorOrOptions as UniqueItemsKeySelector<TItem> : undefined;
  const options = hasKeySelector ? selectedOptions : contextOrKeySelectorOrOptions as UniqueItemsOptions<TItem> | undefined;
  return applyValidatorWhen(
    context => validateUniqueItems(context, keySelector, resolveValidatorMessageOption(options)),
    options,
  );
}
