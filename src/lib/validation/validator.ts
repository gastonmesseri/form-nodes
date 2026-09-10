import { untracked } from '@angular/core';

import type { AnyNode } from '../types/node.type';
import { isAsyncValidator } from './utils/async-validator-marker';
import { markNonReactiveValidator } from './utils/non-reactive-validator';
import type { ComposableValidator, DeferredValidator, ValidatorOwner } from './validation.type';

/**
 * Gives a reusable synchronous validator a fully typed authoring context.
 * Return a message string for a `custom` error, including an empty string, or return an error object
 * with an explicit `kind`. Arrays may mix messages and error objects; return null or undefined for success.
 *
 * Use this helper when declaring a validator separately from `field()`, `form()`, `group()`, or `array()`,
 * where contextual inference from the consuming node is unavailable. By default the returned function is the original function.
 * With `{ reactive: false }`, the helper tracks the node value and executes the callback and
 * its returned compositions without tracking their signal reads. External signal changes alone
 * do not invalidate validation; the next value change reads their latest values. No injector is needed.
 *
 * Inline use also infers the concrete node for `context.node()` and its `context.field()` alias.
 * Omit helper type arguments to infer both the value and owner from the consuming primitive.
 * Parameterless callbacks accept unchecked returns to support class form self-references.
 * Callbacks receiving a context retain checked synchronous results and composition types.
 *
 * `TValue` is the exact value observed by the validator. Because `field()` is nullable by default,
 * its standalone validators normally use a type such as `number | null`. Omit `null` only for a
 * field created with `field.strict()`. Form and array nodes use their non-null aggregate models.
 *
 * @reactive Tracks signal reads by default. With reactive: false, tracks the owning value only;
 * ordinary validation lifecycle triggers still apply. This does not make circular reads safe.
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
 * const age = field<number>(null, [isAdult]);
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
 * @template TValue Exact field, form, group, or array value observed by the validator.
 * @template TField Concrete owning node, inferred when the helper is declared inline.
 * @param validate Synchronous validation function to type and reuse.
 * @param options Set reactive to false to sample external signals when the node value triggers validation.
 * @returns The original function by default, or a wrapper when reactive is false.
 */
export function validator<TValue, TField extends AnyNode = AnyNode>(validate: NoInfer<DeferredValidator | ComposableValidator<TValue, ValidatorOwner<TField>>>, options?: { reactive?: boolean }): ComposableValidator<TValue, TField>;
/** Infers the value from an explicitly typed callback when no consuming node provides a context. */
export function validator<TValue, TField extends AnyNode = AnyNode>(validate: ComposableValidator<TValue, ValidatorOwner<TField>>, options?: { reactive?: boolean }): ComposableValidator<TValue, TField>;
export function validator<TValue, TField extends AnyNode = AnyNode>(validate: ComposableValidator<TValue, ValidatorOwner<TField>>, options?: { reactive?: boolean }): ComposableValidator<TValue, TField> {
  if (options?.reactive !== false) return validate as unknown as ComposableValidator<TValue, TField>;
  if (isAsyncValidator(validate)) {
    throw new Error('validator() with reactive: false cannot wrap asyncValidator(); use its params option to control asynchronous dependencies.');
  }
  return markNonReactiveValidator((context: Parameters<typeof validate>[0]) => {
    context.value();
    return untracked(() => validate(context));
  }, validate) as unknown as ComposableValidator<TValue, TField>;
}
