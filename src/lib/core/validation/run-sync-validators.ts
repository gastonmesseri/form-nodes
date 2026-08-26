import type { Node } from '../types/node.type';
import { addDefaultTargetNode } from '../utils/add-default-target-node';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { normalizeValidationResult } from '../utils/normalize-validation-result';
import { createValidatorContext } from './create-validator-context';
import type { AsyncValidatorState, ComposableValidationResult, ComposableValidator, FieldContext, ValidationError, ValidationResult, ValidatorContext, Validators } from './validation.type';

const maximumCompositionDepth = 100;

const resolveComposableResult = <TValue>(
  result: ComposableValidationResult<TValue>,
  context: ValidatorContext<TValue>,
  activeValidators: Set<Function>,
  depth: number,
): ValidationResult => {
  if (typeof result === 'function') {
    if (isAsyncValidator(result)) {
      throw new Error('A synchronous validator cannot return an asyncValidator(); add it directly to the validators array.');
    }
    if (activeValidators.has(result)) throw new Error('Circular synchronous validator composition detected.');
    if (depth >= maximumCompositionDepth) {
      throw new Error(`Synchronous validator composition exceeded ${maximumCompositionDepth} levels.`);
    }
    activeValidators.add(result);
    const resolved = resolveComposableResult(result(context), context, activeValidators, depth + 1);
    activeValidators.delete(result);
    return resolved;
  }

  if (Array.isArray(result)) {
    const validators = result.filter((item) => typeof item === 'function');
    if (validators.length === 0) return result as readonly ValidationError.WithoutTargetNode[];
    if (validators.length !== result.length) {
      throw new Error('Synchronous validator composition cannot mix validators and validation errors in the same array.');
    }
    return (result as Validators<TValue>).flatMap((validator) =>
      normalizeValidationResult(resolveComposableResult(validator, context, activeValidators, depth)),
    );
  }

  return result as ValidationResult;
};

const resolveComposableValidator = <TValue>(
  validator: ComposableValidator<TValue>,
  context: ValidatorContext<TValue>,
): ValidationResult => resolveComposableResult(validator, context, new Set(), 0);

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
