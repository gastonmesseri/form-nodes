import type { AnyNode } from '../../types/node.type';
import type { ComposableValidator, ValidatorNode, ValidatorSource, Validators } from '../validation.type';

export const isValidatorSource = <TValue, TField extends AnyNode = ValidatorNode>(value: unknown): value is ValidatorSource<TValue, TField> => {
  return typeof value === 'function' || Array.isArray(value);
};

export const normalizeValidatorSource = <TValue, TField extends AnyNode = ValidatorNode>(source: ValidatorSource<TValue, TField>): Validators<TValue> => {
  // The runtime runner supplies the owning node; erase contextual node types at this boundary.
  return Array.isArray(source)
    ? source.filter((validator): validator is ComposableValidator<TValue> => typeof validator === 'function')
    : [source as unknown as ComposableValidator<TValue>];
};
