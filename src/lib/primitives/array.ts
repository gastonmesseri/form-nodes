import { isNode } from './utils/node-marker';
import type { NormalizedNode } from './form';
import { createArrayNode } from './array-node';
import { field, type FieldNode } from './field';
import type { AnyNode } from '../types/node.type';
import type { ValidatorSource } from '../validation/validation.type';
import { assertArrayObjectTemplate, looksLikeValidatorSource } from './array.utils';
import { createNodeDefinitionFactory } from './utils/create-node-definition-factory';
import type { ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';
import type { ArrayNode as ArrayNodeType, ArrayOptions, ArraySet, ArrayValue } from './array.type';

export type { ArrayItemNode, ArrayApi, ArrayIndexes, ArrayItemWithParent, ArrayItems, ArrayNode, ArrayOptions, ArrayPatch, ArrayRoot, ArraySet, ArrayValue } from './array.type';

type ArrayTemplate = AnyNode | ObjectNodeDefinitions;
type ArrayTemplateInput<TDefinition extends ArrayTemplate> =
  TDefinition extends AnyNode ? TDefinition : ObjectNodeDefinitionInputs<Extract<TDefinition, ObjectNodeDefinitions>>;
type ArrayFactory<TDefinition extends ArrayTemplate> = () => TDefinition & ArrayTemplateInput<TDefinition>;
type ArraySource<TDefinition extends ArrayTemplate> = (TDefinition & ArrayTemplateInput<TDefinition>) | ArrayFactory<TDefinition>;
type ArrayInitial<TDefinition extends ArrayTemplate> = number | ArraySet<NormalizedNode<TDefinition>> | null | undefined;
type PositionalArrayOptions<TValue, TArray extends AnyNode = ArrayNodeType<AnyNode>> = Omit<ArrayOptions<TValue, TArray>, 'initialValue'>;

/**
 * Creates an empty array with an unknown-valued field template, equivalent to `array(field())`.
 * `push()` without a value adds null; supplied values remain field values, including objects.
 * Use an explicit template when item structure or validators are known.
 *
 * @example
 * ```ts
 * const values = array();
 * values(); // []
 * values.push('Ada');
 * values(); // ['Ada']
 * ```
 */
export function array(): ArrayNodeType<FieldNode<unknown>>;
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
 * @param args Validators or node configuration, optionally followed by configuration for positional validators. Callback contexts are typed; returns use any for self-reference support but must satisfy ValidationResult or ComposableValidationResult (see ValidatorSource).
 */
export function array<TDefinition extends ArrayTemplate>(
  template: TDefinition & ArrayTemplateInput<TDefinition>,
  ...args:
    | [validatorsOrOptions?: NoInfer<ValidatorSource<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | NoInfer<ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>>]
    | [
      validators: NoInfer<ValidatorSource<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | undefined,
      options: NoInfer<ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | undefined
    ]
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
 * @param args Validators or node configuration, optionally followed by configuration for positional validators. Callback contexts are typed; returns use any for self-reference support but must satisfy ValidationResult or ComposableValidationResult (see ValidatorSource).
 */
export function array<TDefinition extends ArrayTemplate>(
  template: TDefinition & ArrayTemplateInput<TDefinition>,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  ...args:
    | [validatorsOrOptions?: NoInfer<ValidatorSource<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | NoInfer<PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>>]
    | [
      validators: NoInfer<ValidatorSource<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | undefined,
      options: NoInfer<PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | undefined
    ]
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
 * @param args Validators or node configuration, optionally followed by configuration for positional validators. Callback contexts are typed; returns use any for self-reference support but must satisfy ValidationResult or ComposableValidationResult (see ValidatorSource).
 */
export function array<TDefinition extends ArrayTemplate>(
  factory: ArrayFactory<TDefinition>,
  ...args:
    | [validatorsOrOptions?: NoInfer<ValidatorSource<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | NoInfer<ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>>]
    | [
      validators: NoInfer<ValidatorSource<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | undefined,
      options: NoInfer<ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | undefined
    ]
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
 * @param args Validators or node configuration, optionally followed by configuration for positional validators. Callback contexts are typed; returns use any for self-reference support but must satisfy ValidationResult or ComposableValidationResult (see ValidatorSource).
 */
export function array<TDefinition extends ArrayTemplate>(
  factory: ArrayFactory<TDefinition>,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  ...args:
    | [validatorsOrOptions?: NoInfer<ValidatorSource<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | NoInfer<PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>>]
    | [
      validators: NoInfer<ValidatorSource<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | undefined,
      options: NoInfer<PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>, ArrayNodeType<NormalizedNode<TDefinition>>>> | undefined
    ]
): ArrayNodeType<NormalizedNode<TDefinition>>;
export function array<TDefinition extends ArrayTemplate>(
  source: ArraySource<TDefinition> = field() as unknown as ArraySource<TDefinition>,
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
    ? source as () => unknown
    : createNodeDefinitionFactory(source);
  return createArrayNode<TItem>(factory, normalizedInitial, validatorSource, resolvedOptions);
}
