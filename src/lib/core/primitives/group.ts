import type { ValidatorSource } from '../validation/validation.type';
import type { NodeDefinitions } from '../types/node.type';
import { _createObjectNode } from './form';
import type { Form, FormOptions } from './form.type';
import type { Group, GroupOptions, GroupValue, NormalizedNodes } from './group.type';

export type { Group, GroupApi, GroupChildren, GroupOptions, GroupPatch, GroupRoot, GroupSet, GroupValue, NormalizedNode, NormalizedNodes } from './group.type';

type GroupDefinitions<TDefinitions extends NodeDefinitions> = {
  [TKey in keyof TDefinitions]: TKey extends '$api' | '$field'
    ? never
    : TDefinitions[TKey] extends NodeDefinitions ? GroupDefinitions<TDefinitions[TKey]> : TDefinitions[TKey];
};

/**
 * Creates a fixed object-shaped structural node without an independent submission workflow.
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
 * Plain nested object definitions are equivalent shorthand. Use an explicit group when the
 * object aggregate needs validators, state configuration, debounce, or validator messages. Use
 * `form()` instead when this exact node must own `submission` and `submit()`.
 *
 * @param definitions Fixed child-node definitions.
 * @param options Group configuration.
 */
export function group<TDefinitions extends NodeDefinitions>(
  definitions: TDefinitions & GroupDefinitions<TDefinitions>,
  options?: GroupOptions<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>>,
): Group<NormalizedNodes<TDefinitions>>;
/**
 * Creates a fixed object-shaped structural node with positional validators and optional configuration.
 *
 * ```ts
 * const address = group(
 *   { city: field('') },
 *   [addressValidator],
 * );
 * ```
 *
 * @param definitions Fixed child-node definitions.
 * @param validators Validators for the complete group value.
 * @param options Group configuration.
 */
export function group<TDefinitions extends NodeDefinitions>(
  definitions: TDefinitions & GroupDefinitions<TDefinitions>,
  validators?: ValidatorSource<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>>,
  options?: GroupOptions<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>>,
): Group<NormalizedNodes<TDefinitions>>;
export function group<TDefinitions extends NodeDefinitions>(
  definitions: TDefinitions & GroupDefinitions<TDefinitions>,
  validatorsOrOptions?: ValidatorSource<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>> | GroupOptions<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>>,
  separateOptions?: GroupOptions<NoInfer<GroupValue<NormalizedNodes<TDefinitions>>>>,
): Group<NormalizedNodes<TDefinitions>> {
  type TNodes = NormalizedNodes<TDefinitions>;
  type TValue = GroupValue<TNodes>;
  return _createObjectNode<TDefinitions>(
    definitions,
    validatorsOrOptions as ValidatorSource<TValue> | FormOptions<TValue, Form<TNodes>> | undefined,
    separateOptions as FormOptions<TValue, Form<TNodes>> | undefined,
    'group',
  ) as Group<TNodes>;
}
