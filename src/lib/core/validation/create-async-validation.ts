import { signal } from '@angular/core';

import { addDefaultTargetNode } from '../utils/add-default-target-node';
import { normalizeValidationResult } from '../utils/normalize-validation-result';
import { getAsyncValidatorOptions, isAsyncValidator } from '../utils/async-validator-marker';
import { resolveAsyncValidationResult } from './resolve-async-validation-result';
import type { AsyncValidationResult, AsyncValidator, AsyncValidatorContext, FieldContext, ValidationError, ValidationResult, Validators } from './validation.type';

const wait = (milliseconds: number, signal: AbortSignal): Promise<void> => new Promise((resolve) => {
  if (milliseconds <= 0 || signal.aborted) return resolve();
  const timeout = setTimeout(resolve, milliseconds);
  signal.addEventListener('abort', () => {
    clearTimeout(timeout);
    resolve();
  }, { once: true });
});

export const createAsyncValidation = <TValue, TNode>(
  context: FieldContext<TValue>,
  getValidators: () => Validators<TValue>,
  getSyncErrors: () => readonly ValidationError[],
  getTargetNode: () => TNode,
  isActive: () => boolean,
) => {
  const errors = signal<readonly ValidationError.WithTargetNode<TNode>[]>([]);
  const pending = signal(false);
  let execution = 0;
  let controllers: AbortController[] = [];

  const cancel = () => {
    execution++;
    controllers.forEach((controller) => controller.abort());
    controllers = [];
    errors.set([]);
    pending.set(false);
  };

  const validate = () => {
    cancel();
    const validators = getValidators().filter(isAsyncValidator) as AsyncValidator<TValue>[];
    if (validators.length === 0) return;
    if (!isActive() || getSyncErrors().length > 0) return;
    const activeValidators = validators.filter((validator) => getAsyncValidatorOptions(validator).when?.(context) !== false);
    if (activeValidators.length === 0) return;
    const currentExecution = execution;
    const results = activeValidators.map(() => [] as ValidationError.WithTargetNode<TNode>[]);
    let remaining = activeValidators.length;
    pending.set(true);

    activeValidators.forEach(async (validator, index) => {
      const controller = new AbortController();
      controllers.push(controller);
      const options = getAsyncValidatorOptions(validator);
      await wait(options.debounce ?? 0, controller.signal);
      if (controller.signal.aborted || currentExecution !== execution) return;
      let result: ValidationResult;
      try {
        const validateAsync = validator as unknown as (context: AsyncValidatorContext<TValue>) => AsyncValidationResult;
        const asyncResult = validateAsync({ ...context, abortSignal: controller.signal });
        result = await resolveAsyncValidationResult(asyncResult, controller.signal);
      } catch (error) {
        if (controller.signal.aborted || currentExecution !== execution) return;
        result = options.onError?.(error, context);
      }
      if (controller.signal.aborted || currentExecution !== execution) return;
      results[index] = normalizeValidationResult(result).map((error) => addDefaultTargetNode(error, getTargetNode()));
      errors.set(results.flat());
      remaining--;
      if (remaining === 0) {
        controllers = [];
        pending.set(false);
      }
    });
  };

  return { errors: errors.asReadonly(), pending: pending.asReadonly(), cancel, validate };
};
