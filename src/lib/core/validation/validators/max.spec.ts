import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { max } from './max';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('max', () => {
  it('validates maximum numbers', () => {
    expect(max(3)(context(4))).toEqual({
      kind: 'max',
      max: 3,
      actual: 4,
      message: 'Please enter a value less than or equal to 3.',
    });
    expect(max(3, { message: 'Too large' })(context(4))).toMatchObject({ message: 'Too large' });
    expect(max(3)(context(3))).toBeNull();
    expect(max(3)(context(null))).toBeNull();
    expect(max(3)(context(Number.NaN))).toBeNull();
    expect(max(() => undefined)(context(4))).toBeNull();
    expect(max(Number.NaN)(context(4))).toBeNull();
  });
});
