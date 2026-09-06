import { isNil } from '../utils/is-nil';
import { ArrayNode } from './array-node';
import { isNode } from './utils/node-marker';
import type { NormalizedNode } from './form';
import type { Node } from '../types/node.type';
import { assertArrayObjectTemplate } from './array.utils';
import type { ValidatorSource } from '../validation/validation.type';
import type { ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';
import { createNodeDefinitionFactory } from './utils/create-node-definition-factory';
import type { ArrayNode as ArrayNodeType, ArrayOptions, ArraySet, ArrayValue } from './array.type';

export type { ArrayApi, ArrayIndexes, ArrayItemWithParent, ArrayItems, ArrayNode, ArrayOptions, ArrayPatch, ArrayRoot, ArraySet, ArrayValue } from './array.type';

type ArrayTemplate = Node | ObjectNodeDefinitions;
type ArrayTemplateInput<TDefinition extends ArrayTemplate> =
  TDefinition extends Node ? TDefinition : ObjectNodeDefinitionInputs<Extract<TDefinition, ObjectNodeDefinitions>>;
type ArrayFactory<TDefinition extends ArrayTemplate> = () => TDefinition & ArrayTemplateInput<TDefinition>;
type ArraySource<TDefinition extends ArrayTemplate> = (TDefinition & ArrayTemplateInput<TDefinition>) | ArrayFactory<TDefinition>;
type ArrayInitial<TDefinition extends ArrayTemplate> = number | ArraySet<NormalizedNode<TDefinition>> | null | undefined;
type PositionalArrayOptions<TValue, TArray extends Node = ArrayNodeType<Node>> = Omit<ArrayOptions<TValue, TArray>, 'initialValue'>;

const looksLikeValidatorSource = (value: unknown): boolean => {
  return typeof value === 'function'
    || (Array.isArray(value)
    && value.some(entry => typeof entry === 'function')
    && value.every(entry => isNil(entry) || typeof entry === 'function'));
};

/**
 * Creates a dynamic array by cloning a declarative node template for every item.
 * 
 * ```ts
 * const people = array({
 *   name: field(''),
 * }, 1);
 *
 * people(); // [{ name: '' }]
 * 
 * 
 * const people = array({
 *   name: field(''),
 * }, {
 *   initialValue: [{ name: 'Marco' }],
 * });
 *
 * people(); // [{ name: 'Marco' }]
 * 
 * 
 * const people = array({
 *   name: field(''),
 * }, [{ name: 'Marco' }]);
 *
 * people(); // [{ name: 'Marco' }]
 * ```
 *
 * The template itself remains independent; each item is a fresh clone. Use a factory overload
 * when item construction must be deferred or customized.
 *
 * @param template Declarative shape cloned for every item. Pass a `field()`, `form()`, nested
 * `array()`, or shorthand object. The supplied definition remains an independent node and is not
 * inserted directly into this array.
 * @param options Array configuration. `initialValue` accepts either an array of item values or a non-negative initial item count; it defaults to `[]`.
 */
export function array<TDefinition extends ArrayTemplate>(
  template: TDefinition & ArrayTemplateInput<TDefinition>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
): ArrayNodeType<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a template and validators.
 *
 * ```ts
 * const names = array(field(''), [minLength(1)]);
 * ```
 *
 * @param template Declarative shape cloned for every item. Pass a `field()`, `form()`, nested
 * `array()`, or shorthand object; the supplied definition itself is not inserted into the array.
 * @param validators Reactive validator source for the complete array value.
 * @param options Array configuration. `initialValue` accepts either an array of item values or a non-negative initial item count.
 */
export function array<TDefinition extends ArrayTemplate>(
  template: TDefinition & ArrayTemplateInput<TDefinition>,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
): ArrayNodeType<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a declarative node template and positional initial contents.
 *
 * ```ts
 * const names = array(field(''), ['Marco', 'Lia']);
 * ```
 *
 * @param template Declarative shape cloned for every item. Pass a `field()`, `form()`, nested
 * `array()`, or shorthand object; the supplied definition itself is not inserted into the array.
 * @param initial **Initial contents:** either an array of item values or a non-negative integer specifying how many items to create from the template defaults.
 * @param options Additional array configuration.
 */
export function array<TDefinition extends ArrayTemplate>(
  template: TDefinition & ArrayTemplateInput<TDefinition>,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  options?: PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
): ArrayNodeType<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a template, positional initial contents, and validators.
 *
 * ```ts
 * const names = array(field(''), ['Marco'], [minLength(1)]);
 * ```
 *
 * @param template Declarative shape cloned for every item. Pass a `field()`, `form()`, nested
 * `array()`, or shorthand object; the supplied definition itself is not inserted into the array.
 * @param initial **Initial contents:** either an array of item values or a non-negative integer specifying how many items to create from the template defaults.
 * @param validators Reactive validator source for the complete array value.
 * @param options Additional array configuration.
 */
export function array<TDefinition extends ArrayTemplate>(
  template: TDefinition & ArrayTemplateInput<TDefinition>,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
  options?: PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
): ArrayNodeType<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a node-definition factory.
 *
 * ```ts
 * const people = array(() => ({
 *   name: field(''),
 * }), {
 *   initialValue: 2,
 * });
 * ```
 *
 * @param factory Creates the declarative shape for each item. Use a factory when construction
 * should be deferred or customized. Every call must return a fresh `field()`, `form()`, `array()`,
 * or shorthand object; returning the same definition twice throws.
 * @param options Array configuration. `initialValue` accepts either an array of item values or a non-negative initial item count; it defaults to `[]`.
 */
export function array<TDefinition extends ArrayTemplate>(
  factory: ArrayFactory<TDefinition>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
): ArrayNodeType<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a factory and validators.
 *
 * ```ts
 * const names = array(() => field(''), [minLength(1)]);
 * ```
 *
 * @param factory Creates one fresh `field()`, `form()`, `array()`, or shorthand object per item.
 * Returning the same definition from multiple calls throws.
 * @param validators Reactive validator source for the complete array value.
 * @param options Array configuration. `initialValue` accepts either an array of item values or a non-negative initial item count.
 */
export function array<TDefinition extends ArrayTemplate>(
  factory: ArrayFactory<TDefinition>,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
): ArrayNodeType<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a factory and positional initial contents.
 *
 * ```ts
 * const names = array(() => field(''), 2);
 * ```
 *
 * @param factory Creates one fresh `field()`, `form()`, `array()`, or shorthand object per item.
 * Returning the same definition from multiple calls throws.
 * @param initial **Initial contents:** either an array of item values or a non-negative integer specifying how many items to create from the factory defaults.
 * @param options Additional array configuration.
 */
export function array<TDefinition extends ArrayTemplate>(
  factory: ArrayFactory<TDefinition>,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  options?: PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
): ArrayNodeType<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a factory, positional initial contents, and validators.
 *
 * ```ts
 * const names = array(() => field(''), 2, [minLength(1)]);
 * ```
 *
 * @param factory Creates one fresh `field()`, `form()`, `array()`, or shorthand object per item.
 * Returning the same definition from multiple calls throws.
 * @param initial **Initial contents:** either an array of item values or a non-negative integer specifying how many items to create from the factory defaults.
 * @param validators Reactive validator source for the complete array value.
 * @param options Additional array configuration.
 */
export function array<TDefinition extends ArrayTemplate>(
  factory: ArrayFactory<TDefinition>,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
  options?: PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
): ArrayNodeType<NormalizedNode<TDefinition>>;
export function array<TDefinition extends ArrayTemplate>(
  source: ArraySource<TDefinition>,
  initialOrValidatorsOrOptions?: ArrayInitial<TDefinition> | ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>, ArrayNodeType<NormalizedNode<TDefinition>>> | ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
  validatorsOrOptions?: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>, ArrayNodeType<NormalizedNode<TDefinition>>> | ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
  separateOptions?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>,
): ArrayNodeType<NormalizedNode<TDefinition>> {
  type TItem = NormalizedNode<TDefinition>;
  type TValue = ArrayValue<TItem>;
  type TSet = ArraySet<TItem>;
  const secondIsValidators = looksLikeValidatorSource(initialOrValidatorsOrOptions);
  const thirdIsValidators = looksLikeValidatorSource(validatorsOrOptions);
  const hasInitial = initialOrValidatorsOrOptions === null
    || typeof initialOrValidatorsOrOptions === 'number'
    || (Array.isArray(initialOrValidatorsOrOptions) && (
      !secondIsValidators || thirdIsValidators || separateOptions !== undefined
    ));
  const resolvedOptions = hasInitial
    ? thirdIsValidators ? separateOptions : validatorsOrOptions as ArrayOptions<TValue, any> | undefined
    : secondIsValidators ? validatorsOrOptions as ArrayOptions<TValue, any> | undefined : initialOrValidatorsOrOptions as ArrayOptions<TValue, any> | undefined;
  const configuredInitial = resolvedOptions?.initialValue;
  const initial = hasInitial
    ? initialOrValidatorsOrOptions as number | TSet | null
    : configuredInitial as number | TSet | null | undefined;
  const validatorSource = hasInitial
    ? thirdIsValidators ? validatorsOrOptions as ValidatorSource<TValue> : resolvedOptions?.validators ?? []
    : secondIsValidators ? initialOrValidatorsOrOptions as ValidatorSource<TValue> : resolvedOptions?.validators ?? [];
  if (typeof initial === 'number' && (!Number.isSafeInteger(initial) || initial < 0)) {
    throw new RangeError('array: initial count must be a non-negative safe integer');
  }
  const normalizedInitial = initial ?? [];

  const sourceIsFactory = typeof source === 'function' && !isNode(source);
  if (!sourceIsFactory && !isNode(source)) {
    assertArrayObjectTemplate(source, 'template');
  }
  const factory = sourceIsFactory
    ? source as ArrayFactory<TDefinition>
    : createNodeDefinitionFactory(source);
  return new ArrayNode<TItem>(factory, normalizedInitial, validatorSource, resolvedOptions).getNode();
}
