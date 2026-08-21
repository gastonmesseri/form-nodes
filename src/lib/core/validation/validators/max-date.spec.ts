import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { maxDate } from './max-date';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('maxDate', () => {
  it('validates maximum dates', () => {
    const middle = new Date('2026-06-01');
    const maximum = new Date('2026-05-01');
    expect(maxDate(maximum)(context(middle))).toEqual({
      maxDate: { maxDate: maximum, actual: middle },
    });
    expect(maxDate(maximum)(context(maximum))).toBeNull();
    expect(maxDate(maximum)(context(new Date(Number.NaN)))).toBeNull();
  });
});
