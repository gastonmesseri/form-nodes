import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { notNil } from './not-nil';
import { requiredTrue } from './required-true';
import { field } from '../../primitives/field';

const rules = [
  { rule: requiredTrue, kind: 'requiredTrue', message: 'This field must be accepted.', required: true },
  { rule: notNil, kind: 'notNil', message: 'Please provide a value.', required: false },
] as const;

describe.each(rules)('$kind validator', ({ rule, kind, message, required }) => {
  it('supports direct, string, and options call styles with default messages', () => {
    const direct = field<unknown>(null, [rule]);
    expect(direct.errors()).toEqual([{ kind, message, targetNode: direct }]);
    expect(direct.required()).toBe(required);
    expect(field(null, [rule('Custom message.')]).errors()[0]?.message).toBe('Custom message.');
    expect(field(null, [rule({ message: 'Options message.' })]).errors()[0]?.message).toBe('Options message.');
    expect(field(null, [rule({})]).errors()[0]?.message).toBe(message);
    expect(field(null, [rule({ message: () => undefined })]).errors()[0]?.message).toBe(message);
  });

  it('runs error overrides only when active and failing', () => {
    const enabled = signal(false);
    const error = vi.fn(() => ({ kind: 'answerNeeded', message: 'Provide an answer.' }));
    const node = field<unknown>(null, [rule({ when: () => enabled(), error })]);
    expect(node.valid()).toBe(true);
    expect(error).not.toHaveBeenCalled();
    enabled.set(true);
    expect(node.errors()).toMatchObject([{ kind: 'answerNeeded', message: 'Provide an answer.' }]);
    expect(node.required()).toBe(required);
    expect(error).toHaveBeenCalledTimes(1);
    node.set(true);
    expect(node.valid()).toBe(true);
    expect(error).toHaveBeenCalledTimes(1);
    node.set(null);
    expect(node.invalid()).toBe(true);
    expect(error).toHaveBeenCalledTimes(2);
  });

  it('preserves reactive metadata with a static custom error', () => {
    const enabled = signal(true);
    const node = field(null, [rule({ error: { kind: 'custom' }, when: () => enabled() })]);
    expect(node.hasError('custom')).toBe(true);
    expect(node.required()).toBe(required);
    enabled.set(false);
    expect(node.errors()).toEqual([]);
    expect(node.required()).toBe(false);
  });
});
