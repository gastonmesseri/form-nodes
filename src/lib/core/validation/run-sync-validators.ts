import { isNotNil } from '../utils/is-nil';
import type { Node } from '../types/node.type';
import type { MetadataKey } from '../metadata/metadata';
import { runWithValidatorMessages } from './validator-messages';
import { isAsyncValidator } from './utils/async-validator-marker';
import { addDefaultTargetNode } from './utils/add-default-target-node';
import { createValidatorContext } from './utils/create-validator-context';
import { normalizeValidationResult } from './utils/normalize-validation-result';
import { collectValidatorMetadata, type ValidatorMetadata } from './validator-metadata';
import type { AsyncValidatorState, ComposableValidationResult, ComposableValidator, FieldContext, ValidationError, ValidationResult, ValidatorContext, Validators } from './validation.type';

const maximumCompositionDepth = 100;

export type SyncValidation<TNode extends Node> = {
  readonly errors: readonly ValidationError.WithTargetNode<TNode>[];
  readonly metadata: ValidatorMetadata;
};

const resolveComposableResult = <TValue>(
  result: ComposableValidationResult<TValue>,
  context: ValidatorContext<TValue>,
  activeValidators: Set<Function>,
  depth: number,
  metadata: Map<MetadataKey<unknown, unknown>, unknown[]>,
): ValidationResult => {
  if (typeof result === 'function') {
    if (isAsyncValidator(result)) {
      throw new Error('A synchronous validator cannot return an asyncValidator(); add it directly to the validators array.');
    }
    if (activeValidators.has(result)) throw new Error('Circular synchronous validator composition detected.');
    if (depth >= maximumCompositionDepth) {
      throw new Error(`Synchronous validator composition exceeded ${maximumCompositionDepth} levels.`);
    }
    collectValidatorMetadata(result, metadata, context as ValidatorContext<unknown>);
    activeValidators.add(result);
    const resolved = resolveComposableResult(result(context), context, activeValidators, depth + 1, metadata);
    activeValidators.delete(result);
    return resolved;
  }

  if (Array.isArray(result)) {
    const items = result.filter(isNotNil);
    const validators = items.filter(item => typeof item === 'function');
    if (validators.length === 0) return items as readonly ValidationError.ValidatorResult[];
    if (validators.length !== items.length) {
      throw new Error('Synchronous validator composition cannot mix validators and validation errors in the same array.');
    }
    return (items as Validators<TValue>).flatMap(validator =>
      normalizeValidationResult(resolveComposableResult(validator, context, activeValidators, depth, metadata)),
    );
  }

  return result as ValidationResult;
};

const resolveComposableValidator = <TValue>(
  validator: ComposableValidator<TValue>,
  context: ValidatorContext<TValue>,
  metadata: Map<MetadataKey<unknown, unknown>, unknown[]>,
): ValidationResult => resolveComposableResult(validator, context, new Set(), 0, metadata);

export const runSyncValidators = <TValue, TNode extends Node & { $api: AsyncValidatorState }>(
  context: FieldContext<TValue>,
  validators: Validators<TValue>,
  targetNode: TNode,
): SyncValidation<TNode> => {
  const errors: ValidationError.WithTargetNode<TNode>[] = [];
  const metadata = new Map<MetadataKey<unknown, unknown>, unknown[]>();
  const validatorContext = createValidatorContext(context, targetNode);
  validators.forEach((validator) => {
    if (isAsyncValidator(validator)) return;
    errors.push(
      ...normalizeValidationResult(runWithValidatorMessages(
        targetNode,
        () => resolveComposableValidator(validator, validatorContext, metadata),
      )).map(error =>
        addDefaultTargetNode(error, targetNode),
      ),
    );
  });
  return { errors, metadata };
};
