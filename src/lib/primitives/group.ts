import { createFormGroupNode } from './form-group-node';
import type { ValidatorSource } from '../validation/validation.type';
import { isValidatorSource } from '../validation/utils/validator-source';
import type { ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';
import type { GroupNode, GroupOptions, GroupValue, NormalizedNodes } from './group.type';

export type { GroupNode, GroupApi, GroupChildren, GroupOptions, GroupPatch, GroupRoot, GroupSet, GroupValue, NormalizedNode, NormalizedNodes } from './group.type';

type GroupDefinitions<TDefinitions extends ObjectNodeDefinitions> = ObjectNodeDefinitionInputs<TDefinitions>;

/**
 * Creates an empty group with value `{}`. Add dynamic children with `add()`.
 * Pass `{}` explicitly when supplying validators or options.
 *
 * @example
 * ```ts
 * const node = group();
 * node(); // {}
 * node.add('name', field('Ada'));
 * ```
 */
export function group(): GroupNode<{}>;
/**
 * Creates an object-shaped structural node without an independent submission workflow.
 *
 * ```ts
 * const address = group({
 *   city: field('Zurich'),
 *   country: field('Switzerland'),
 * });
 *
 * address();
 * // { city: 'Zurich', country: 'Switzerland' }
 * ```
 *
 * Concise values, including arrays, are normalized to fields, and plain nested object definitions
 * become groups. Only an explicit `array(...)` creates a dynamic array node. Use an explicit group when the
 * object aggregate needs validators, state configuration, debounce, or validator messages. Use
 * `form()` instead when this exact node must own `onSubmit` and `submit()`.
 * Definitions use own enumerable string-keyed data properties. Inherited and non-enumerable
 * properties are ignored; accessors, symbol keys, and `__proto__` are rejected before the tree is
 * created, with the complete declaration path included in the error.
 *
 * @param definitions Initially declared child-node definitions.
 * @param args Validators or node configuration, optionally followed by configuration for positional validators.
 */
export function group<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions & GroupDefinitions<TDefinitions>,
  ...args:
    | [validatorsOrOptions?: NoInfer<ValidatorSource<GroupValue<NormalizedNodes<TDefinitions>>, GroupNode<NormalizedNodes<TDefinitions>>>> | NoInfer<GroupOptions<GroupValue<NormalizedNodes<TDefinitions>>, GroupNode<NormalizedNodes<TDefinitions>>>>]
    | [
      validators: NoInfer<ValidatorSource<GroupValue<NormalizedNodes<TDefinitions>>, GroupNode<NormalizedNodes<TDefinitions>>>> | undefined,
      options: NoInfer<GroupOptions<GroupValue<NormalizedNodes<TDefinitions>>, GroupNode<NormalizedNodes<TDefinitions>>>> | undefined
    ]
): GroupNode<NormalizedNodes<TDefinitions>>;
export function group<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions & GroupDefinitions<TDefinitions> = {} as TDefinitions & GroupDefinitions<TDefinitions>,
  validatorsOrOptions?: ValidatorSource<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>, GroupNode<NormalizedNodes<TDefinitions>>> | GroupOptions<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>, GroupNode<NormalizedNodes<TDefinitions>>>,
  separateOptions?: GroupOptions<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>, GroupNode<NormalizedNodes<TDefinitions>>>,
): GroupNode<NormalizedNodes<TDefinitions>> {
  type TNodes = NormalizedNodes<TDefinitions>;
  type TValue = GroupValue<TNodes>;
  const resolvedOptions = isValidatorSource<TValue, GroupNode<TNodes>>(validatorsOrOptions) || validatorsOrOptions === undefined
    ? separateOptions
    : validatorsOrOptions;
  const validatorSource = isValidatorSource<TValue, GroupNode<TNodes>>(validatorsOrOptions)
    ? validatorsOrOptions
    : resolvedOptions?.validators ?? [];
  return createFormGroupNode<TDefinitions>(definitions, validatorSource, resolvedOptions, 'group') as GroupNode<TNodes>;
}
