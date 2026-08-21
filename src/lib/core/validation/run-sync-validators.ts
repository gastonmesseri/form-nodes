import { addDefaultTargetNode } from '../utils/add-default-target-node';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { normalizeValidationResult } from '../utils/normalize-validation-result';
import type { FieldContext, ValidationError, ValidationResult, Validators } from './validation.type';

export const runSyncValidators = <TValue, TNode>(
  context: FieldContext<TValue>,
  validators: Validators<TValue>,
  targetNode: TNode,
): readonly ValidationError.WithTargetNode<TNode>[] => {
  const errors: ValidationError.WithTargetNode<TNode>[] = [];
  validators.forEach((validator) => {
    if (isAsyncValidator(validator)) return;
    errors.push(
      ...normalizeValidationResult(validator(context) as ValidationResult).map((error) =>
        addDefaultTargetNode(error, targetNode),
      ),
    );
  });
  return errors;
};
