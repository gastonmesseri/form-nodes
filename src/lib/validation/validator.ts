import type { Node } from '../types/node.type';
import type { ComposableValidator, DeferredValidator, ValidatorOwner } from './validation.type';

/**
 * Gives a reusable synchronous validator a fully typed authoring context.
 * Return a message string for a `custom` error, including an empty string, or return an error object
 * with an explicit `kind`. Arrays may mix messages and error objects; return null or undefined for success.
 *
 * Use this helper when declaring a validator separately from `field()`, `form()`, `group()`, or `array()`,
 * where contextual inference from the consuming node is unavailable. The returned function is the
 * original function: `validator()` adds no wrapper, dependency-injection requirement, or runtime
 * behavior.
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
 * @returns The same validation function, without a runtime wrapper.
 */
export function validator<TValue, TField extends Node = Node>(validate: NoInfer<DeferredValidator | ComposableValidator<TValue, ValidatorOwner<TField>>>): ComposableValidator<TValue, TField>;
/** Infers the value from an explicitly typed callback when no consuming node provides a context. */
export function validator<TValue, TField extends Node = Node>(validate: ComposableValidator<TValue, ValidatorOwner<TField>>): ComposableValidator<TValue, TField>;
export function validator<TValue, TField extends Node = Node>(validate: ComposableValidator<TValue, ValidatorOwner<TField>>): ComposableValidator<TValue, TField> {
  return validate as unknown as ComposableValidator<TValue, TField>;
}
