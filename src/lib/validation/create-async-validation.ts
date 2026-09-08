import { computed, signal, untracked } from '@angular/core';

import type { Node } from '../types/node.type';
import { shallowEqual } from '../utils/shallow-equal';
import { addDefaultTargetNode } from './utils/add-default-target-node';
import { createValidatorContext } from './utils/create-validator-context';
import { normalizeValidationResult } from './utils/normalize-validation-result';
import { resolveAsyncValidationResult } from './utils/resolve-async-validation-result';
import { createTrackedRunner, type TrackedRunner } from '../utils/create-reactive-watch';
import { getAsyncValidatorOptions, isAsyncValidator } from './utils/async-validator-marker';
import type { AsyncValidationResult, AsyncValidator, AsyncValidatorContext, AsyncValidatorState, FieldContext, ParameterizedAsyncValidatorContext, ValidationError, ValidationResult, Validators, ValidationErrorWithTargetNode } from './validation.type';

const wait = (milliseconds: number, signal: AbortSignal): Promise<void> => {
  return new Promise((resolve) => {
    if (milliseconds <= 0 || signal.aborted) return resolve();
    const finish = () => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timeout = setTimeout(finish, milliseconds);
    signal.addEventListener('abort', finish, { once: true });
  });
};

export const createAsyncValidation = <TValue, TNode extends Node & { $api: AsyncValidatorState }>(
  context: FieldContext<TValue>,
  getValidators: () => Validators<TValue>,
  getSyncErrors: () => readonly ValidationError[],
  getTargetNode: () => TNode,
  isActive: () => boolean,
  ensureStarted: () => void,
) => {
  const errors = signal<readonly ValidationErrorWithTargetNode<TNode>[]>([]);
  const pending = signal(false);
  let execution = 0;
  let firstValidation = true;
  let lastParameterizedRun: {
    source: Validators<TValue>;
    validators: readonly { params: unknown; validator: AsyncValidator<TValue> }[];
  } | null = null;
  const controllers = new Set<AbortController>();
  const trackedValidators = new Map<AsyncValidator<TValue>, {
    paramsReader?: () => unknown;
    paramsValue?: unknown;
    runner: TrackedRunner;
    target: { callback: (() => unknown) | null; notify(): void };
  }>();

  const runTracked = <T>(validator: AsyncValidator<TValue>, callback: () => T): T => {
    let tracked = trackedValidators.get(validator);
    if (!tracked) {
      const target = {
        callback: null as (() => unknown) | null,
        notify: () => {
          const notifiedExecution = execution;
          queueMicrotask(() => {
            if (execution !== notifiedExecution) return;
            const currentTracked = trackedValidators.get(validator);
            if (!currentTracked?.runner.hasChanges()) return;
            if (currentTracked?.paramsReader) {
              const nextParams = currentTracked.runner.run(currentTracked.paramsReader);
              if (shallowEqual(currentTracked.paramsValue, nextParams)) return;
              currentTracked.paramsValue = nextParams;
            }
            validate();
          });
        },
      };
      tracked = { target, runner: createTrackedRunner(target) };
      trackedValidators.set(validator, tracked);
    }
    return tracked.runner.run(callback);
  };

  const runTrackedParams = (validator: AsyncValidator<TValue>, callback: () => unknown): unknown => {
    const currentTracked = trackedValidators.get(validator);
    if (currentTracked?.paramsReader) {
      currentTracked.paramsReader = callback;
      return currentTracked.paramsValue;
    }
    const params = runTracked(validator, callback);
    const tracked = trackedValidators.get(validator)!;
    tracked.paramsReader = callback;
    tracked.paramsValue = params;
    return params;
  };

  const cancel = () => {
    execution++;
    controllers.forEach(controller => controller.abort());
    controllers.clear();
    errors.set([]);
    pending.set(false);
  };

  const validate = (deferCallbacks = firstValidation) => {
    firstValidation = false;
    const source = getValidators();
    const validators = source.filter(isAsyncValidator) as AsyncValidator<TValue>[];
    trackedValidators.forEach(({ runner }, validator) => {
      if (!validators.includes(validator)) {
        runner.destroy();
        trackedValidators.delete(validator);
      }
    });
    if (validators.length === 0 || !isActive() || getSyncErrors().length > 0) {
      lastParameterizedRun = null;
      cancel();
      return;
    }
    const baseContext = createValidatorContext(context, getTargetNode());
    if (validators.some(validator => getAsyncValidatorOptions(validator).params === undefined)) context.value();
    const activeValidators = validators.flatMap((validator) => {
      const options = getAsyncValidatorOptions(validator);
      if (options.when?.(baseContext) === false) return [];
      const params = options.params === undefined
        ? undefined
        : runTrackedParams(validator, () => options.params!(baseContext));
      return [{ options, params, validator }];
    });
    if (activeValidators.length === 0) {
      lastParameterizedRun = null;
      cancel();
      return;
    }
    const parameterizedValidators = activeValidators.filter(({ options }) => options.params !== undefined);
    if (parameterizedValidators.length === activeValidators.length) {
      const sameRun = lastParameterizedRun?.source === source
        && lastParameterizedRun.validators.length === parameterizedValidators.length
        && parameterizedValidators.every(({ params, validator }, index) => {
          const previous = lastParameterizedRun!.validators[index]!;
          return previous.validator === validator && shallowEqual(previous.params, params);
        });
      if (sameRun) return;
      lastParameterizedRun = {
        source,
        validators: parameterizedValidators.map(({ params, validator }) => ({ params, validator })),
      };
    } else {
      lastParameterizedRun = null;
    }
    cancel();
    const currentExecution = execution;
    const results = activeValidators.map(() => [] as ValidationErrorWithTargetNode<TNode>[]);
    let remaining = activeValidators.length;
    pending.set(true);

    activeValidators.forEach(async ({ options, params, validator }, index) => {
      const controller = new AbortController();
      controllers.add(controller);
      const debounce = options.debounce ?? 0;
      const discoversDependencies = options.params === undefined && !trackedValidators.has(validator);
      const initialPublicationDelay = discoversDependencies && debounce > 0
        ? wait(debounce, controller.signal)
        : null;
      if (!discoversDependencies && debounce > 0) await wait(debounce, controller.signal);
      else if (deferCallbacks) await Promise.resolve();
      if (controller.signal.aborted || currentExecution !== execution) {
        controllers.delete(controller);
        return;
      }
      let result: ValidationResult;
      try {
        const validateAsync = validator as unknown as (context: AsyncValidatorContext<TValue> | ParameterizedAsyncValidatorContext<TValue, unknown>) => AsyncValidationResult;
        const validatorContext = options.params === undefined
          ? { ...baseContext, abortSignal: controller.signal }
          : { ...baseContext, abortSignal: controller.signal, params };
        const asyncResult = options.params === undefined
          ? runTracked(validator, () => validateAsync(validatorContext))
          : untracked(() => validateAsync(validatorContext));
        result = await resolveAsyncValidationResult(asyncResult, controller.signal);
        if (initialPublicationDelay) await initialPublicationDelay;
      } catch (error) {
        if (controller.signal.aborted || currentExecution !== execution) return;
        if (initialPublicationDelay) await initialPublicationDelay;
        result = options.onError?.(error, baseContext);
      }
      if (controller.signal.aborted || currentExecution !== execution) {
        controllers.delete(controller);
        return;
      }
      results[index] = normalizeValidationResult(result).map(error => addDefaultTargetNode(error, getTargetNode()));
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

  const observedErrors = computed(() => {
    untracked(ensureStarted);
    return errors();
  });
  const observedPending = computed(() => {
    untracked(ensureStarted);
    return pending();
  });

  return { errors: observedErrors, pending: observedPending, cancel, destroy, validate };
};
