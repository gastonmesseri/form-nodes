import type { Node } from '../types/node.type';
import { addDefaultTargetNode } from '../utils/add-default-target-node';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { normalizeValidationResult } from '../utils/normalize-validation-result';
import { createValidatorContext } from './create-validator-context';
import type { AsyncValidatorState, FieldContext, ValidationError, ValidationResult, Validators } from './validation.type';

export const runSyncValidators = <TValue, TNode extends Node & { api: AsyncValidatorState }>(
  context: FieldContext<TValue>,
  validators: Validators<TValue>,
  targetNode: TNode,
): readonly ValidationError.WithTargetNode<TNode>[] => {
  const errors: ValidationError.WithTargetNode<TNode>[] = [];
  const validatorContext = createValidatorContext(context, targetNode);
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
