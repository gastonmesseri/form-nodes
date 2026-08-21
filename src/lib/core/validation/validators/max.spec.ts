import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { max } from './max';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('max', () => {
  it('validates maximum numbers', () => {
    expect(max(3)(context(4))).toEqual({ max: { max: 3, actual: 4 } });
    expect(max(3)(context(3))).toBeNull();
    expect(max(3)(context(Number.NaN))).toBeNull();
  });
});
