import type { ValueEqualityFn } from '@angular/core';

import { deepEqual } from '../../utils/deep-equal';
import { shallowEqual } from '../../utils/shallow-equal';

export const resolveValueEquality = <TValue>(
  equal: 'shallow' | 'deep' | ValueEqualityFn<TValue> | undefined,
): ValueEqualityFn<TValue> => {
  if (equal === 'deep') return deepEqual;
  if (equal === 'shallow') return shallowEqual;
  return equal ?? Object.is;
};
