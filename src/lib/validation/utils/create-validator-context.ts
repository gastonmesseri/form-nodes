import { signal } from '@angular/core';

import type { AnyNode } from '../../types/node.type';
import type { AsyncValidatorState, FieldContext, ValidatorApi, ValidatorContext } from '../validation.type';

/** Adds the stable readonly node facade used by validator callbacks. */
export const createValidatorContext = <TValue>(
  context: FieldContext<TValue>,
  field: AnyNode & { $api: AsyncValidatorState },
): ValidatorContext<TValue> => {
  const validatorContext = context as ValidatorContext<TValue>;
  if (Object.hasOwn(validatorContext, 'node')) return validatorContext;
  const api = field.$api as unknown as ValidatorApi<TValue>;
  const node = signal(field).asReadonly();
  Object.defineProperties(validatorContext, {
    parent: { enumerable: true, value: api.parent },
    path: { enumerable: true, value: api.path },
    field: { enumerable: true, value: node },
    node: { enumerable: true, value: node },
  });
  return validatorContext;
};
