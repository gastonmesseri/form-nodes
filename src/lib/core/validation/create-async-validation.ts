import { signal } from '@angular/core';

import { addDefaultTargetNode } from '../utils/add-default-target-node';
import { normalizeValidationResult } from '../utils/normalize-validation-result';
import { getAsyncValidatorOptions, isAsyncValidator } from '../utils/async-validator-marker';
import { createTrackedRunner, type TrackedRunner } from '../utils/create-reactive-watch';
import { resolveAsyncValidationResult } from './resolve-async-validation-result';
import type { AsyncValidationResult, AsyncValidator, AsyncValidatorContext, FieldContext, ValidationError, ValidationResult, Validators } from './validation.type';

const wait = (milliseconds: number, signal: AbortSignal): Promise<void> => new Promise((resolve) => {
  if (milliseconds <= 0 || signal.aborted) return resolve();
  const finish = () => {
    clearTimeout(timeout);
    signal.removeEventListener('abort', finish);
    resolve();
  };
  const timeout = setTimeout(finish, milliseconds);
  signal.addEventListener('abort', finish, { once: true });
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
  const controllers = new Set<AbortController>();
  const trackedValidators = new Map<AsyncValidator<TValue>, { runner: TrackedRunner; target: { callback: (() => unknown) | null; notify(): void } }>();

  const runTracked = <T>(validator: AsyncValidator<TValue>, callback: () => T): T => {
    let tracked = trackedValidators.get(validator);
    if (!tracked) {
      const target = {
        callback: null as (() => unknown) | null,
        notify: () => {
          const notifiedExecution = execution;
          queueMicrotask(() => {
            if (execution === notifiedExecution) validate();
          });
        },
      };
      tracked = { target, runner: createTrackedRunner(target) };
      trackedValidators.set(validator, tracked);
    }
    return tracked.runner.run(callback);
  };

  const cancel = () => {
    execution++;
    controllers.forEach((controller) => controller.abort());
    controllers.clear();
    errors.set([]);
    pending.set(false);
  };

  const validate = () => {
    cancel();
    const validators = getValidators().filter(isAsyncValidator) as AsyncValidator<TValue>[];
    trackedValidators.forEach(({ runner }, validator) => {
      if (!validators.includes(validator)) {
        runner.destroy();
        trackedValidators.delete(validator);
      }
    });
    if (validators.length === 0) return;
    if (!isActive() || getSyncErrors().length > 0) return;
    context.value();
    const activeValidators = validators.filter((validator) => {
      const options = getAsyncValidatorOptions(validator);
      return options.when?.(context) !== false;
    });
    if (activeValidators.length === 0) return;
    const currentExecution = execution;
    const results = activeValidators.map(() => [] as ValidationError.WithTargetNode<TNode>[]);
    let remaining = activeValidators.length;
    pending.set(true);

    activeValidators.forEach(async (validator, index) => {
      const controller = new AbortController();
      controllers.add(controller);
      const options = getAsyncValidatorOptions(validator);
      if ((options.debounce ?? 0) > 0) await wait(options.debounce!, controller.signal);
      if (controller.signal.aborted || currentExecution !== execution) {
        controllers.delete(controller);
        return;
      }
      let result: ValidationResult;
      try {
        const validateAsync = validator as unknown as (context: AsyncValidatorContext<TValue>) => AsyncValidationResult;
        const asyncResult = runTracked(validator, () => validateAsync({ ...context, abortSignal: controller.signal }));
        result = await resolveAsyncValidationResult(asyncResult, controller.signal);
      } catch (error) {
        if (controller.signal.aborted || currentExecution !== execution) return;
        result = options.onError?.(error, context);
      }
      if (controller.signal.aborted || currentExecution !== execution) {
        controllers.delete(controller);
        return;
      }
      results[index] = normalizeValidationResult(result).map((error) => addDefaultTargetNode(error, getTargetNode()));
      controllers.delete(controller);
      errors.set(results.flat());
      remaining--;
      if (remaining === 0) {
        pending.set(false);
      }
    });
  };

  const destroy = () => {
    cancel();
    trackedValidators.forEach(({ runner }) => runner.destroy());
    trackedValidators.clear();
  };

  return { errors: errors.asReadonly(), pending: pending.asReadonly(), cancel, destroy, validate };
};
