import { createFormGroupNode } from './form-group-node';
import type { ValidatorSource } from '../validation/validation.type';
import { isValidatorSource } from '../validation/utils/validator-source';
import type { Form, FormOptions, FormValue, NormalizedNodes, ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';

export type { AddedNode, DynamicFormChildren, Form, FormApi, FormChildren, FormOptions, FormPatch, FormRoot, FormSet, FormValue, FormValueContract, NodeWithParent, NormalizedNode, NormalizedNodes } from './form.type';

type FormDefinitions<TDefinitions extends ObjectNodeDefinitions> = ObjectNodeDefinitionInputs<TDefinitions>;

/**
 * ```ts
 * const profile = form({
 *   name: field(''),
 *   age: field(null),
 *   address: {
 *     city: field(''),
 *   },
 *   contacts: array({
 *     type: field(''),
 *     value: field(''),
 *   }),
 * });
 * ```
 *
 * Creates a root form from an initially fixed object of node definitions and optional configuration.
 *
 * Concise values, including arrays, are normalized to fields, while plain nested objects become
 * structural groups. Only an explicit `array(...)` creates a dynamic array node. Use the options object for
 * form-level validators, submission, state, debounce, and validator messages.
 * Definitions use own enumerable string-keyed data properties. Inherited and non-enumerable
 * properties are ignored; accessors, symbol keys, and `__proto__` are rejected before the tree is
 * created, with the complete declaration path included in the error.
 *
 * @param definitions Initially declared child-node definitions.
 * @param options Form configuration.
 */
export function form<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions & FormDefinitions<TDefinitions>,
  options?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>>,
): Form<NormalizedNodes<TDefinitions>>;
/**
 * Creates a root form with positional validators and optional configuration.
 *
 * ```ts
 * const profile = form({
 *   name: field('')
 * }, [profileValidator]);
 * ```
 *
 * @param definitions Fixed child-node definitions.
 * @param validators Validators for the complete form value.
 * @param options Form configuration.
 */
export function form<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions & FormDefinitions<TDefinitions>,
  validators?: ValidatorSource<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>>,
  options?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>>,
): Form<NormalizedNodes<TDefinitions>>;
export function form<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions & FormDefinitions<TDefinitions>,
  validatorsOrOptions?: ValidatorSource<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>> | FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>>,
  separateOptions?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>>,
): Form<NormalizedNodes<TDefinitions>> {
  type TNodes = NormalizedNodes<TDefinitions>;
  type TValue = FormValue<TNodes>;
  const resolvedOptions = isValidatorSource<TValue, Form<TNodes>>(validatorsOrOptions) || validatorsOrOptions === undefined
    ? separateOptions
    : validatorsOrOptions;
  const validatorSource = isValidatorSource<TValue, Form<TNodes>>(validatorsOrOptions)
    ? validatorsOrOptions
    : resolvedOptions?.validators ?? [];
  return createFormGroupNode<TDefinitions>(definitions, validatorSource, resolvedOptions, 'form') as Form<TNodes>;
}
