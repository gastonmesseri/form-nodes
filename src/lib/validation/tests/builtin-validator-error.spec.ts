import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { url } from '../validators/url';
import { min } from '../validators/min';
import { max } from '../validators/max';
import { email } from '../validators/email';
import { form } from '../../primitives/form';
import { oneOf } from '../validators/one-of';
import { field } from '../../primitives/field';
import { pattern } from '../validators/pattern';
import { between } from '../validators/between';
import { integer } from '../validators/integer';
import { maxDate } from '../validators/max-date';
import { minDate } from '../validators/min-date';
import { equalTo } from '../validators/equal-to';
import { required } from '../validators/required';
import { maxWords } from '../validators/max-words';
import { minWords } from '../validators/min-words';
import { maxLength } from '../validators/max-length';
import { minLength } from '../validators/min-length';
import { requiredIf } from '../validators/required-if';
import { dateBetween } from '../validators/date-between';
import { uniqueItems } from '../validators/unique-items';
import { applyValidatorWhen } from '../utils/validator-options';

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
