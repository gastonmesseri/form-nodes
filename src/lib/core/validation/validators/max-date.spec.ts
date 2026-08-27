import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { maxDate } from './max-date';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('maxDate', () => {
  it('validates maximum dates', () => {
    const middle = new Date('2026-06-01');
    const maximum = new Date('2026-05-01');
    expect(maxDate(maximum)(context(middle))).toEqual({
      kind: 'maxDate',
      maxDate: maximum,
      actual: middle,
      message: 'Please enter a date on or before 2026-05-01T00:00:00.000Z.',
    });
    expect(maxDate(maximum, { message: 'Too late' })(context(middle))).toMatchObject({ message: 'Too late' });
    expect(maxDate(maximum)(context(maximum))).toBeNull();
    expect(maxDate(maximum)(context(null))).toBeNull();
    expect(maxDate(maximum)(context(new Date(Number.NaN)))).toBeNull();
    expect(maxDate(() => undefined)(context(middle))).toBeNull();
    expect(maxDate(new Date(Number.NaN))(context(middle))).toBeNull();
  });

  it('parses static and reactive ISO calendar-date strings', () => {
    const maximum = signal<string | undefined>('2026-08-24');
    const validator = maxDate(() => maximum());

    expect(validator(context(new Date('2026-08-25T00:00:00.000Z')))).toMatchObject({
      maxDate: new Date('2026-08-24T00:00:00.000Z'),
    });

    maximum.set(undefined);
    expect(validator(context(new Date('2026-08-25T00:00:00.000Z')))).toBeNull();
  });
});
