import { computed, type Signal } from '@angular/core';

import { collectValidatorMetadata } from '../validation/validator-metadata';
import type { ValidatorContext } from '../validation/validation.type';
import { appendMetadataContributions, type MetadataContributions, type MetadataKey } from './metadata';

export const createNodeMetadata = (
  validators: Signal<readonly Function[]>,
  validatorMetadata: Signal<MetadataContributions>,
  getContext: () => ValidatorContext<unknown>,
): Signal<MetadataContributions> => {
  return computed<MetadataContributions>(() => {
    const result = new Map<MetadataKey<unknown, unknown>, unknown[]>();
    validators().forEach(validator => collectValidatorMetadata(validator, result, getContext()));
    appendMetadataContributions(result, validatorMetadata());
    return result;
  });
};
