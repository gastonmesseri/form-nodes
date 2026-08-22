import type { Node } from '../types/node.type';
import { addDefaultTargetNode } from '../utils/add-default-target-node';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { normalizeValidationResult } from '../utils/normalize-validation-result';
import { createValidatorContext } from './create-validator-context';
import type { AsyncValidatorState, ComposableValidationResult, ComposableValidator, FieldContext, ValidationError, ValidationResult, ValidatorContext, Validators } from './validation.type';

const maximumCompositionDepth = 100;

const resolveComposableValidator = <TValue>(
  validator: ComposableValidator<TValue>,
  context: ValidatorContext<TValue>,
): ValidationResult => {
  const visited = new Set<Function>([validator]);
  let result: ComposableValidationResult<TValue> = validator(context);
  let depth = 0;
  while (typeof result === 'function') {
    if (isAsyncValidator(result)) {
      throw new Error('A synchronous validator cannot return an asyncValidator(); add it directly to the validators array.');
    }
    if (visited.has(result)) throw new Error('Circular synchronous validator composition detected.');
    if (depth++ >= maximumCompositionDepth) {
      throw new Error(`Synchronous validator composition exceeded ${maximumCompositionDepth} levels.`);
    }
    visited.add(result);
    result = result(context);
  }
  return result;
};

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
      ...normalizeValidationResult(resolveComposableValidator(validator, validatorContext)).map((error) =>
        addDefaultTargetNode(error, targetNode),
      ),
    );
  });
  return errors;
};
