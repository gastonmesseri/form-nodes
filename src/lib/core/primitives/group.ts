import { createObjectNode } from './form';
import type { ValidatorSource } from '../validation/validation.type';
import type { Group, GroupOptions, GroupValue, NormalizedNodes } from './group.type';
import type { Form, FormOptions, ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';

export type { Group, GroupApi, GroupChildren, GroupOptions, GroupPatch, GroupRoot, GroupSet, GroupValue, NormalizedNode, NormalizedNodes } from './group.type';

type GroupDefinitions<TDefinitions extends ObjectNodeDefinitions> = ObjectNodeDefinitionInputs<TDefinitions>;

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
 * `form()` instead when this exact node must own `submission` and `submit()`.
 * Definitions use own enumerable string-keyed data properties. Inherited and non-enumerable
 * properties are ignored; accessors, symbol keys, and `__proto__` are rejected before the tree is
 * created, with the complete declaration path included in the error.
 *
 * @param definitions Initially declared child-node definitions.
 * @param options Group configuration.
 */
export function group<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions & GroupDefinitions<TDefinitions>,
  options?: GroupOptions<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>, Group<NormalizedNodes<TDefinitions>>>,
): Group<NormalizedNodes<TDefinitions>>;
/**
 * Creates an object-shaped structural node with positional validators and optional configuration.
 *
 * ```ts
 * const address = group(
 *   { city: field('') },
 *   [addressValidator],
 * );
 * ```
 *
 * @param definitions Initially declared child-node definitions.
 * @param validators Validators for the complete group value.
 * @param options Group configuration.
 */
export function group<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions & GroupDefinitions<TDefinitions>,
  validators?: ValidatorSource<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>, Group<NormalizedNodes<TDefinitions>>>,
  options?: GroupOptions<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>, Group<NormalizedNodes<TDefinitions>>>,
): Group<NormalizedNodes<TDefinitions>>;
export function group<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions & GroupDefinitions<TDefinitions>,
  validatorsOrOptions?: ValidatorSource<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>, Group<NormalizedNodes<TDefinitions>>> | GroupOptions<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>, Group<NormalizedNodes<TDefinitions>>>,
  separateOptions?: GroupOptions<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>, Group<NormalizedNodes<TDefinitions>>>,
): Group<NormalizedNodes<TDefinitions>> {
  type TNodes = NormalizedNodes<TDefinitions>;
  type TValue = GroupValue<TNodes>;
  return createObjectNode<TDefinitions>(
    definitions,
    validatorsOrOptions as unknown as ValidatorSource<TValue> | FormOptions<TValue, Form<TNodes>> | undefined,
    separateOptions as unknown as FormOptions<TValue, Form<TNodes>> | undefined,
    'group',
  ) as Group<TNodes>;
}
