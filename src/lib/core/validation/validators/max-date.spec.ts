import { describe, expect, it } from 'vitest';

import { maxDate } from './max-date';

describe('maxDate', () => {
  it('validates maximum dates', () => {
    const middle = new Date('2026-06-01');
    const maximum = new Date('2026-05-01');
    expect(maxDate(maximum)(middle)).toEqual({
      maxDate: { maxDate: maximum, actual: middle },
    });
    expect(maxDate(maximum)(maximum)).toBeNull();
    expect(maxDate(maximum)(new Date(Number.NaN))).toBeNull();
  });
});
