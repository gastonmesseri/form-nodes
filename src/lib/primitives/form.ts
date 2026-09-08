import { createFormGroupNode } from './form-group-node';
import type { ValidatorSource } from '../validation/validation.type';
import { isValidatorSource } from '../validation/utils/validator-source';
import type { FormNode, FormOptions, FormValue, NormalizedNodes, ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';

export type { AddedNode, DynamicFormChildren, FormNode, FormApi, FormChildren, FormOptions, FormPatch, FormRoot, FormSet, FormValue, FormValueContract, NodeWithParent, NormalizedNode, NormalizedNodes } from './form.type';

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
 * @param args Validators or node configuration, optionally followed by configuration for positional validators.
 */
export function form<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions & FormDefinitions<TDefinitions>,
  ...args:
    | [validatorsOrOptions?: NoInfer<ValidatorSource<FormValue<NormalizedNodes<TDefinitions>>, FormNode<NormalizedNodes<TDefinitions>>>> | NoInfer<FormOptions<FormValue<NormalizedNodes<TDefinitions>>, FormNode<NormalizedNodes<TDefinitions>>>>]
    | [
      validators: NoInfer<ValidatorSource<FormValue<NormalizedNodes<TDefinitions>>, FormNode<NormalizedNodes<TDefinitions>>>> | undefined,
      options: NoInfer<FormOptions<FormValue<NormalizedNodes<TDefinitions>>, FormNode<NormalizedNodes<TDefinitions>>>> | undefined
    ]
): FormNode<NormalizedNodes<TDefinitions>>;
export function form<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions & FormDefinitions<TDefinitions>,
  validatorsOrOptions?: ValidatorSource<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, FormNode<NormalizedNodes<TDefinitions>>> | FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, FormNode<NormalizedNodes<TDefinitions>>>,
  separateOptions?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, FormNode<NormalizedNodes<TDefinitions>>>,
): FormNode<NormalizedNodes<TDefinitions>> {
  type TNodes = NormalizedNodes<TDefinitions>;
  type TValue = FormValue<TNodes>;
  const resolvedOptions = isValidatorSource<TValue, FormNode<TNodes>>(validatorsOrOptions) || validatorsOrOptions === undefined
    ? separateOptions
    : validatorsOrOptions;
  const validatorSource = isValidatorSource<TValue, FormNode<TNodes>>(validatorsOrOptions)
    ? validatorsOrOptions
    : resolvedOptions?.validators ?? [];
  return createFormGroupNode<TDefinitions>(definitions, validatorSource, resolvedOptions, 'form') as FormNode<TNodes>;
}
