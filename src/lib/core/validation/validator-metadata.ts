import type { MetadataContributions, MetadataKey } from '../metadata/metadata';

export type ValidatorMetadata = MetadataContributions;

type UntypedMetadataKey = MetadataKey<unknown, unknown>;
type MutableValidatorMetadata = Map<UntypedMetadataKey, unknown[]>;

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
export const collectValidatorMetadata = (validator: Function, target: MutableValidatorMetadata) => {
  validatorMetadata.get(validator)?.forEach((contributions, key) => {
    const current = target.get(key) ?? [];
    current.push(...contributions);
    target.set(key, current);
  });
};

export const hasValidatorMetadata = <TWrite, TAccumulator>(
  validator: Function,
  key: MetadataKey<TWrite, TAccumulator>,
): boolean => validatorMetadata.get(validator)?.has(key as UntypedMetadataKey) === true;
