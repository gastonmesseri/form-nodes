import { computed, effect, signal } from '@angular/core';
import { NG_VALIDATORS, Validators, type Validator, type ValidatorFn, type ValidationErrors } from '@angular/forms';

import type { AnyNode } from '../../../types/node.type';
import type { ControlAdapterContext } from '../control-adapter';
import type { ValidationErrorWithoutTargetNode } from '../../../validation/validation.type';
import { registerExternalValidationErrors } from '../../../validation/external-validation-errors';

const isValidatorObject = (validator: ValidatorFn | Validator): validator is Validator => {
  return typeof validator === 'object' && validator !== null;
};

const toControlErrors = (errors: ValidationErrors | null): readonly ValidationErrorWithoutTargetNode[] => {
  return errors ? Object.entries(errors).map(([kind, context]) => ({ kind, context })) : [];
};

/** Adapts validators supplied by the CVA host to the bound node's external errors. */
export const connectLegacyValidators = <TNode extends AnyNode>({ binding, getNgControl }: ControlAdapterContext<TNode>) => {
  const injector = binding.injector;
  const owner = {};

  const validators = injector.get<readonly (ValidatorFn | Validator)[] | null>(NG_VALIDATORS, null, { self: true });
  if (!validators?.length) return;
  const version = signal(0);
  validators.forEach((validator) => {
    if (isValidatorObject(validator) && validator.registerOnValidatorChange) {
      validator.registerOnValidatorChange(() => version.update(current => current + 1));
    }
  });
  const validator = Validators.compose(validators.map(item => typeof item === 'function' ? item : item.validate.bind(item)));
  const errors = computed(() => {
    version();
    return toControlErrors(validator?.(getNgControl().control) ?? null);
  });
  effect((onCleanup) => {
    const field = binding.node();
    onCleanup(registerExternalValidationErrors(field, owner, errors));
  }, { injector });
};
