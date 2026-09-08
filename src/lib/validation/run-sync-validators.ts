import type { Node } from '../types/node.type';
import type { MetadataKey } from '../metadata/metadata';
import { isNode } from '../primitives/utils/node-marker';
import { runWithValidatorMessages } from './validator-messages';
import { isAsyncValidator } from './utils/async-validator-marker';
import { addDefaultTargetNode } from './utils/add-default-target-node';
import { createValidatorContext } from './utils/create-validator-context';
import { normalizeValidationResult } from './utils/normalize-validation-result';
import { collectValidatorMetadata, type ValidatorMetadata } from './validator-metadata';
import type { AsyncValidatorState, ComposableValidationResult, ComposableValidator, FieldContext, ValidationResult, ValidatorContext, Validators, ValidationErrorWithTargetNode } from './validation.type';

const maximumCompositionDepth = 100;

export type SyncValidation<TNode extends Node, TValue> = {
  readonly errors: readonly ValidationErrorWithTargetNode<TNode>[];
  readonly metadata: ValidatorMetadata;
  readonly resolvedValidators: Validators<TValue>;
};

const resolveComposableResult = <TValue>(
  result: ComposableValidationResult<TValue>,
  context: ValidatorContext<TValue>,
  activeValidators: Set<Function>,
  depth: number,
  metadata: Map<MetadataKey<unknown, unknown>, unknown[]>,
  resolvedValidators: ComposableValidator<TValue>[],
): ValidationResult => {
  if (isNode(result)) return normalizeValidationResult(result);

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
    const outcome = result(context);
    const returnsValidators = typeof outcome === 'function' && !isNode(outcome)
      || Array.isArray(outcome) && outcome.some(item => typeof item === 'function' && !isNode(item));
    if (!returnsValidators) resolvedValidators.push(result);
    const resolved = resolveComposableResult(outcome, context, activeValidators, depth + 1, metadata, resolvedValidators);
    activeValidators.delete(result);
    return resolved;
  }

  if (Array.isArray(result)) {
    const validators = result.filter(item => typeof item === 'function' && !isNode(item));
    const errors = normalizeValidationResult(result.filter(item => typeof item !== 'function' || isNode(item)));
    if (validators.length === 0) return errors;
    if (errors.length > 0) {
      throw new Error('Synchronous validator composition cannot mix validators and validation errors in the same array.');
    }
    return (validators as Validators<TValue>).flatMap((validator) => {
      return normalizeValidationResult(resolveComposableResult(validator, context, activeValidators, depth, metadata, resolvedValidators));
    });
  }

  return result as ValidationResult;
};

const resolveComposableValidator = <TValue>(
  validator: ComposableValidator<TValue>,
  context: ValidatorContext<TValue>,
  metadata: Map<MetadataKey<unknown, unknown>, unknown[]>,
  resolvedValidators: ComposableValidator<TValue>[],
): ValidationResult => resolveComposableResult(validator, context, new Set(), 0, metadata, resolvedValidators);

export const runSyncValidators = <TValue, TNode extends Node & { $api: AsyncValidatorState }>(
  context: FieldContext<TValue>,
  validators: Validators<TValue>,
  targetNode: TNode,
): SyncValidation<TNode, TValue> => {
  const errors: ValidationErrorWithTargetNode<TNode>[] = [];
  const metadata = new Map<MetadataKey<unknown, unknown>, unknown[]>();
  const resolvedValidators: ComposableValidator<TValue>[] = [];
  const validatorContext = createValidatorContext(context, targetNode);
  validators.forEach((validator) => {
    if (isAsyncValidator(validator)) {
      resolvedValidators.push(validator);
      return;
    }
    errors.push(
      ...normalizeValidationResult(runWithValidatorMessages(
        targetNode,
        () => resolveComposableValidator(validator, validatorContext, metadata, resolvedValidators),
      )).map((error) => {
        return addDefaultTargetNode(error, targetNode);
      },
      ),
    );
  });
  return { errors, metadata, resolvedValidators };
};
