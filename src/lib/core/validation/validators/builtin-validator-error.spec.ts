import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { field } from '../../primitives/field';
import { form } from '../../primitives/form';
import { url } from './url';
import { min } from './min';
import { max } from './max';
import { email } from './email';
import { oneOf } from './one-of';
import { pattern } from './pattern';
import { between } from './between';
import { integer } from './integer';
import { maxDate } from './max-date';
import { minDate } from './min-date';
import { required } from './required';
import { equalTo } from './equal-to';
import { maxWords } from './max-words';
import { minWords } from './min-words';
import { maxLength } from './max-length';
import { minLength } from './min-length';
import { requiredIf } from './required-if';
import { dateBetween } from './date-between';
import { uniqueItems } from './unique-items';
import { applyValidatorWhen } from './validator-options';

describe('built-in validator error option', () => {
  it('replaces every built-in validation error', () => {
    const customError = { kind: 'custom' };
    const validators = [
      () => field('', [required({ error: customError })]),
      () => field('', [requiredIf(() => true, { error: customError })]),
      () => field(1, [min(2, { error: customError })]),
      () => field(3, [max(2, { error: customError })]),
      () => field(3, [between(4, 5, { error: customError })]),
      () => field(1.5, [integer({ error: customError })]),
      () => field('a', [minLength(2, { error: customError })]),
      () => field('abc', [maxLength(2, { error: customError })]),
      () => field('one', [minWords(2, { error: customError })]),
      () => field('one two', [maxWords(1, { error: customError })]),
      () => field('a', [pattern(/^b$/, { error: customError })]),
      () => field('invalid', [email({ error: customError })]),
      () => field('invalid', [url({ error: customError })]),
      () => field(new Date('2025-01-01'), [minDate('2026-01-01', { error: customError })]),
      () => field(new Date('2027-01-01'), [maxDate('2026-01-01', { error: customError })]),
      () => field(new Date('2027-01-01'), [dateBetween('2026-01-01', '2026-12-31', { error: customError })]),
      () => field('draft', [oneOf(['published'], { error: customError })]),
      () => field('first', [equalTo('second', { error: customError })]),
      () => field(['same', 'same'], [uniqueItems({ error: customError })]),
    ];

    validators.forEach((createNode) => {
      expect(createNode().errors().map(error => error.kind)).toEqual(['custom']);
    });
  });

  it('evaluates an error function reactively only while validation fails', () => {
    const kind = signal('first');
    const error = vi.fn(() => ({ kind: kind() }));
    const value = field(1, [min(2, { error })]);

    expect(value.errors()[0]?.kind).toBe('first');
    expect(error).toHaveBeenCalledOnce();

    kind.set('second');
    expect(value.errors()[0]?.kind).toBe('second');
    expect(error).toHaveBeenCalledTimes(2);

    value.set(2);
    expect(value.errors()).toEqual([]);
    expect(error).toHaveBeenCalledTimes(2);
  });

  it('accepts several errors and an empty list can suppress a failed rule', () => {
    const several = field(1, [min(2, { error: [{ kind: 'first' }, { kind: 'second' }] })]);
    const suppressed = field(1, [min(2, { error: () => [] })]);

    expect(several.errors().map(error => error.kind)).toEqual(['first', 'second']);
    expect(suppressed.valid()).toBe(true);
  });

  it('propagates a replacement error through a public form', () => {
    const profile = form({
      age: field(16, [min(18, { error: { kind: 'minimumAge' } })]),
    });

    expect(profile.age.errors()[0]?.kind).toBe('minimumAge');
    expect(profile.errors()).toEqual([]);
    expect(profile.allErrors()[0]?.kind).toBe('minimumAge');
    expect(profile.invalid()).toBe(true);
  });

  it('does not replace successful nullish or empty validation results', () => {
    const customError = { kind: 'custom' };
    const undefinedResult = field('', [applyValidatorWhen(() => undefined, { error: customError })]);
    const emptyResult = field('', [applyValidatorWhen(() => [], { error: customError })]);

    expect(undefinedResult.errors()).toEqual([]);
    expect(emptyResult.errors()).toEqual([]);
  });
});
