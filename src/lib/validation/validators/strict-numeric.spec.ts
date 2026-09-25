import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { field } from '../../primitives/field';
import { form } from '../../primitives/form';
import { greaterThan } from './greater-than';
import { lessThan } from './less-than';

describe('strict numeric validators', () => {
  it('rejects equality but accepts decimal values on either side', () => {
    const lower = field(1, [greaterThan(1)]);
    const upper = field(1, [lessThan(1)]);

    expect(lower.getError('greaterThan')).toMatchObject({ limit: 1, actual: 1, message: 'Please enter a value greater than 1.' });
    expect(upper.getError('lessThan')).toMatchObject({ limit: 1, actual: 1, message: 'Please enter a value less than 1.' });
    lower.set(1.1);
    upper.set(0.9);
    expect(lower.valid()).toBe(true);
    expect(upper.valid()).toBe(true);
    lower.set(0.9);
    upper.set(1.1);
    expect(lower.invalid()).toBe(true);
    expect(upper.invalid()).toBe(true);
  });

  it('lets null and NaN pass and ignores absent or NaN limits', () => {
    const lower = field<number>(null, [greaterThan(1)]);
    const upper = field<number>(null, [lessThan(1)]);
    expect(lower.valid()).toBe(true);
    expect(upper.valid()).toBe(true);
    lower.set(Number.NaN);
    upper.set(Number.NaN);
    expect(lower.valid()).toBe(true);
    expect(upper.valid()).toBe(true);
    expect(field(1, [greaterThan(() => undefined), greaterThan(Number.NaN)]).valid()).toBe(true);
    expect(field(1, [lessThan(() => undefined), lessThan(Number.NaN)]).valid()).toBe(true);
  });

  it('reacts to limit, condition, and message signals without publishing inclusive metadata', () => {
    const limit = signal<number | undefined>(1);
    const active = signal(true);
    const label = signal('First');
    const getLimit = vi.fn(() => limit());
    const getMessage = vi.fn(() => label());
    const lower = field(1, [greaterThan(getLimit, { when: () => active(), message: getMessage })]);
    expect(lower.getError('greaterThan')?.message).toBe('First');
    expect(getLimit).toHaveBeenCalledOnce();
    expect(getMessage).toHaveBeenCalledOnce();
    expect(lower.min()).toBeNull();
    label.set('Second');
    expect(lower.getError('greaterThan')?.message).toBe('Second');
    expect(getMessage).toHaveBeenCalledTimes(2);
    limit.set(0);
    expect(lower.valid()).toBe(true);
    expect(getMessage).toHaveBeenCalledTimes(2);
    limit.set(2);
    expect(lower.invalid()).toBe(true);
    active.set(false);
    expect(lower.valid()).toBe(true);
    const runs = getLimit.mock.calls.length;
    limit.set(3);
    expect(lower.valid()).toBe(true);
    expect(getLimit).toHaveBeenCalledTimes(runs);
    active.set(true);
    expect(lower.getError('greaterThan')?.limit).toBe(3);
    limit.set(undefined);
    expect(lower.valid()).toBe(true);

    const upperLimit = signal(1);
    const upper = field(1, [lessThan(() => upperLimit())]);
    expect(upper.max()).toBeNull();
    expect(upper.invalid()).toBe(true);
    upperLimit.set(2);
    expect(upper.valid()).toBe(true);
  });

  it('propagates strict failures through nested forms and supports replacement errors', () => {
    const model = form({ nested: form({ lower: field(1, [greaterThan(1, { error: { kind: 'strictMinimum' } })]), upper: field(1, [lessThan(1)]) }) });
    expect(model.nested.lower.getError('strictMinimum')).toBeDefined();
    expect(model.nested.upper.getError('lessThan')?.actual).toBe(1);
    expect(model.nested.invalid()).toBe(true);
    expect(model.invalid()).toBe(true);
    model.nested.lower.set(1.1);
    model.nested.upper.set(0.9);
    expect(model.nested.valid()).toBe(true);
    expect(model.valid()).toBe(true);
  });
});
