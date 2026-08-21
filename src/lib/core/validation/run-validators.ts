import { addDefaultTargetNode } from '../utils/add-default-target-node';
import { normalizeValidationResult } from '../utils/normalize-validation-result';
import type { FieldContext, ValidationError, Validators } from './validation.type';

export const runValidators = <TValue, TNode>(
  context: FieldContext<TValue>,
  validators: Validators<TValue>,
  targetNode: TNode,
): readonly ValidationError.WithTargetNode<TNode>[] => {
  const errors: ValidationError.WithTargetNode<TNode>[] = [];
  validators.forEach((validator) => {
    errors.push(
      ...normalizeValidationResult(validator(context)).map((error) =>
        addDefaultTargetNode(error, targetNode),
      ),
    );
  });
  return errors;
};
