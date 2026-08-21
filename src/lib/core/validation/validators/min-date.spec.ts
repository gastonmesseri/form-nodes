import { describe, expect, it } from 'vitest';

import { minDate } from './min-date';

describe('minDate', () => {
  it('validates minimum dates', () => {
    const middle = new Date('2026-06-01');
    const minimum = new Date('2026-07-01');
    expect(minDate(minimum)(middle)).toEqual({
      minDate: { minDate: minimum, actual: middle },
    });
    expect(minDate(minimum)(minimum)).toBeNull();
    expect(minDate(minimum)(null)).toBeNull();
  });
});
