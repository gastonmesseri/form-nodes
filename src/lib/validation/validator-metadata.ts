import type { MetadataContributions, MetadataKey } from '../metadata/metadata';
import type { ValidatorContext } from './validation.type';

export type ValidatorMetadata = MetadataContributions;

type UntypedMetadataKey = MetadataKey<unknown, unknown>;
type MutableValidatorMetadata = Map<UntypedMetadataKey, unknown[]>;

type ConditionalMetadataContribution = {
  readonly resolve: (context: ValidatorContext<unknown>) => { readonly active: boolean; readonly value: unknown };
};

const isConditionalMetadataContribution = (value: unknown): value is ConditionalMetadataContribution =>
  typeof value === 'object' && value !== null && 'resolve' in value;

const validatorMetadata = new WeakMap<Function, MutableValidatorMetadata>();

/** Associates a metadata contribution with a validator without changing its public shape. */
export const markValidatorMetadata = <TValidator extends Function, TWrite, TAccumulator>(
  validator: TValidator,
  key: MetadataKey<TWrite, TAccumulator>,
  contribution: TWrite,
): TValidator => {
  let validatorContributions = validatorMetadata.get(validator);
  if (validatorContributions === undefined) {
    validatorContributions = new Map();
    validatorMetadata.set(validator, validatorContributions);
  }
  const untypedKey = key as UntypedMetadataKey;
  const contributions = validatorContributions.get(untypedKey) ?? [];
  contributions.push(contribution);
  validatorContributions.set(untypedKey, contributions);
  return validator;
};

/** Appends every raw contribution attached to a validator to one node resolution store. */
export const collectValidatorMetadata = (
  validator: Function,
  target: MutableValidatorMetadata,
  context?: ValidatorContext<unknown>,
) => {
  validatorMetadata.get(validator)?.forEach((contributions, key) => {
    const current = target.get(key) ?? [];
    contributions.forEach((contribution) => {
      if (!isConditionalMetadataContribution(contribution)) {
        current.push(contribution);
        return;
      }
      if (context === undefined) return;
      const resolved = contribution.resolve(context);
      if (resolved.active) current.push(resolved.value);
    });
    target.set(key, current);
  });
};

/** Copies metadata to a validator while making every contribution conditional. */
export const copyConditionalValidatorMetadata = <TValue>(
  source: Function,
  target: Function,
  when: (context: ValidatorContext<TValue>) => boolean,
) => {
  validatorMetadata.get(source)?.forEach((contributions, key) => {
    const current = validatorMetadata.get(target) ?? new Map<UntypedMetadataKey, unknown[]>();
    const targetContributions = current.get(key) ?? [];
    contributions.forEach((contribution) => {
      targetContributions.push({
        resolve: (context: ValidatorContext<unknown>) => ({
          active: when(context as ValidatorContext<TValue>),
          value: contribution,
        }),
      } satisfies ConditionalMetadataContribution);
    });
    current.set(key, targetContributions);
    validatorMetadata.set(target, current);
  });
};

export const hasValidatorMetadata = <TWrite, TAccumulator>(
  validator: Function,
  key: MetadataKey<TWrite, TAccumulator>,
): boolean => validatorMetadata.get(validator)?.has(key as UntypedMetadataKey) === true;
