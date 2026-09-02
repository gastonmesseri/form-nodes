import { signal } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { field } from '../../primitives/field';
import { dateBetween } from './date-between';

afterEach(() => vi.useRealTimers());

describe('dateBetween', () => {
  it('accepts inclusive boundaries and reports dates outside the range', () => {
    const value = field<Date>(new Date('2025-12-31'), [dateBetween('2026-01-01', '2026-12-31')]);

    expect(value.getError('dateBetween')).toMatchObject({
      minDate: new Date('2026-01-01T00:00:00.000Z'),
      maxDate: new Date('2026-12-31T00:00:00.000Z'),
      actual: new Date('2025-12-31T00:00:00.000Z'),
      message: 'Please enter a date between 2026-01-01T00:00:00.000Z and 2026-12-31T00:00:00.000Z.',
    });
    value.set(new Date('2026-01-01'));
    expect(value.errors()).toEqual([]);
    value.set(new Date('2026-12-31'));
    expect(value.errors()).toEqual([]);
  });

  it('passes for null and invalid current dates', () => {
    const value = field<Date>(null, [dateBetween('2026-01-01', '2026-12-31')]);

    expect(value.errors()).toEqual([]);
    value.set(new Date(Number.NaN));
    expect(value.errors()).toEqual([]);
  });

  it('tracks both limits and disables validation and metadata when either is invalid', () => {
    const minimum = signal<Date | string | undefined>('2026-01-01');
    const maximum = signal<Date | string | undefined>('2026-12-31');
    const value = field<Date>(new Date('2025-12-31'), [dateBetween(() => minimum(), () => maximum())]);

    expect(value.getError('dateBetween')).toBeDefined();
    minimum.set('2025-01-01');
    expect(value.errors()).toEqual([]);
    maximum.set(undefined);
    expect(value.errors()).toEqual([]);
    maximum.set('invalid');
    expect(value.errors()).toEqual([]);
    expect(value.min()).toBeNull();
    expect(value.max()).toBeNull();
  });

  it('parses both string limits as local dates and contributes their metadata', () => {
    const value = field<Date>(null, [dateBetween('2026-01-01', '2026-12-31', { parseAs: 'local' })]);

    expect(value.min()).toEqual(new Date(2026, 0, 1));
    expect(value.max()).toEqual(new Date(2026, 11, 31));
  });

  it('supports static and reactive today range boundaries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-24T15:00:00.000Z'));
    const maximum = signal<Date | string>(new Date('2026-08-25T00:00:00.000Z'));
    const value = field<Date>(new Date('2026-08-26T00:00:00.000Z'), [
      dateBetween('today', () => maximum()),
    ]);

    expect(value.getError('dateBetween')).toMatchObject({
      minDate: new Date('2026-08-24T00:00:00.000Z'),
      maxDate: new Date('2026-08-25T00:00:00.000Z'),
    });
    value.set(new Date('2026-08-24T00:00:00.000Z'));
    expect(value.errors()).toEqual([]);
  });
});
