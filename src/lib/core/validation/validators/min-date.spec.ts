import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { minDate } from './min-date';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('minDate', () => {
  it('validates minimum dates', () => {
    const middle = new Date('2026-06-01');
    const minimum = new Date('2026-07-01');
    expect(minDate(minimum)(context(middle))).toEqual({
      kind: 'minDate',
      minDate: minimum,
      actual: middle,
      message: 'Please enter a date on or after 2026-07-01T00:00:00.000Z.',
    });
    expect(minDate(minimum, { message: 'Too early' })(context(middle))).toMatchObject({ message: 'Too early' });
    expect(minDate(minimum)(context(minimum))).toBeNull();
    expect(minDate(minimum)(context(null))).toBeNull();
    expect(minDate(minimum)(context(new Date(Number.NaN)))).toBeNull();
    expect(minDate(() => undefined)(context(middle))).toBeNull();
    expect(minDate(new Date(Number.NaN))(context(middle))).toBeNull();
  });
});
