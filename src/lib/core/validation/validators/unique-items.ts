import { isFieldContext } from '../../utils/field-context-marker';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultUniqueItemsMessage } from './default-validator-messages';
import { resolveValidatorMessageOption } from './validator-options';
import type { BuiltInValidationErrorMap, FieldContext, ValidationResult, Validator } from '../validation.type';

type UniqueItemsOptions = {
  message?: string | (() => string | undefined);
};

type UniqueItemsSelector<TItem> = keyof TItem | ((item: TItem, index: number) => unknown);

const resolveKey = (item: unknown, index: number, selector?: PropertyKey | ((item: any, index: number) => unknown)): unknown => {
  if (selector === undefined) return item;
  if (typeof selector === 'function') return selector(item, index);
  return (item as Record<PropertyKey, unknown>)[selector];
};

const validateUniqueItems = <TItem>(
  context: FieldContext<readonly TItem[] | null | undefined>,
  selector?: UniqueItemsSelector<TItem>,
  message?: string | (() => string | undefined),
): BuiltInValidationErrorMap['uniqueItems'] | null => {
  const firstIndexByKey = new Map<unknown, number>();
  const duplicateIndexes = new Set<number>();
  const items = context.value() ?? [];

  items.forEach((item, index) => {
    const key = resolveKey(item, index, selector);
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
 * Without a selector, values are compared like `Set`, so `NaN` equals `NaN`, `0` equals `-0`, and
 * objects use reference identity. The error belongs to the array and exposes only the indexes of
 * every item participating in a duplicate group; duplicated values are intentionally omitted. A
 * failure produces `{ kind: 'uniqueItems', duplicateIndexes, message }`. `null` and `undefined`
 * pass as empty arrays.
 *
 * @example
 * ```ts
 * array(field(''), ['admin', 'admin'], [uniqueItems()]);
 * ```
 *
 * @param options Optional static or reactive custom validation message.
 */
export function uniqueItems(options?: {
  /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
  message?: string | (() => string | undefined);
}): Validator<readonly unknown[] | null | undefined>;
/**
 * Validates array item identity when passed directly in a validators array.
 *
 * This is equivalent to `uniqueItems()` and uses the default message. Use the factory form when a
 * selector or custom message is required.
 *
 * @example
 * ```ts
 * array(field(''), ['admin', 'admin'], [uniqueItems]);
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function uniqueItems(context: FieldContext<readonly unknown[] | null | undefined>): ValidationResult;
/**
 * Requires values selected from array items to be unique using SameValueZero equality.
 *
 * A property name is a concise selector for object values. A selector function can compute any
 * comparable key and is evaluated reactively for every item. The error remains on the array and
 * reports all participating indexes in ascending order.
 *
 * @reactive Tracks signals read by a selector function and the custom message while they are active.
 *
 * @example
 * ```ts
 * const contacts = array(
 *   { email: field(''), name: field('') },
 *   [{ email: 'same@example.com', name: 'First' }, { email: 'same@example.com', name: 'Second' }],
 *   [uniqueItems('email')],
 * );
 *
 * const products = array(productTemplate, initialProducts, [
 *   uniqueItems<Product>(product => `${tenantId()}:${product.sku}`, 'SKUs must be unique'),
 * ]);
 * ```
 *
 * @param selector Property name or function selecting the comparable key for each item.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export function uniqueItems<TItem>(
  selector: keyof TItem | ((item: TItem, index: number) => unknown),
  options?: string | {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
  },
): Validator<readonly TItem[] | null | undefined>;
export function uniqueItems<TItem>(
  contextOrSelectorOrOptions?: FieldContext<readonly TItem[] | null | undefined> | UniqueItemsSelector<TItem> | UniqueItemsOptions,
  selectedOptions?: string | UniqueItemsOptions,
): Validator<readonly TItem[] | null | undefined> | ValidationResult {
  if (isFieldContext(contextOrSelectorOrOptions)) return validateUniqueItems(contextOrSelectorOrOptions);
  const hasSelector = typeof contextOrSelectorOrOptions === 'function'
    || typeof contextOrSelectorOrOptions === 'string'
    || typeof contextOrSelectorOrOptions === 'number'
    || typeof contextOrSelectorOrOptions === 'symbol';
  const selector = hasSelector ? contextOrSelectorOrOptions as UniqueItemsSelector<TItem> : undefined;
  const options = hasSelector ? selectedOptions : contextOrSelectorOrOptions as UniqueItemsOptions | undefined;
  return context => validateUniqueItems(context, selector, resolveValidatorMessageOption(options));
}
