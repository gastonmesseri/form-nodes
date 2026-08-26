import { addDefaultTargetNode } from '../utils/add-default-target-node';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { normalizeValidationResult } from '../utils/normalize-validation-result';
import type { AsyncValidatorState, FieldContext, ValidationError, ValidationResult, ValidatorApi, ValidatorContext, Validators } from './validation.type';

export const runSyncValidators = <TValue, TNode extends { api: AsyncValidatorState }>(
  context: FieldContext<TValue>,
  validators: Validators<TValue>,
  targetNode: TNode,
): readonly ValidationError.WithTargetNode<TNode>[] => {
  const errors: ValidationError.WithTargetNode<TNode>[] = [];
  const validatorContext = context as ValidatorContext<TValue>;
  if (!Object.hasOwn(validatorContext, 'api')) {
    Object.defineProperty(validatorContext, 'api', {
      enumerable: true,
      value: targetNode.api as ValidatorApi<TValue>,
    });
  }
  validators.forEach((validator) => {
    if (isAsyncValidator(validator)) return;
    errors.push(
      ...normalizeValidationResult(validator(validatorContext) as ValidationResult).map((error) =>
        addDefaultTargetNode(error, targetNode),
      ),
    );
  });
  return errors;
};
