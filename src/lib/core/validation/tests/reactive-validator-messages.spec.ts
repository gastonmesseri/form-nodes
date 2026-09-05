import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { max } from '../validators/max';
import { min } from '../validators/min';
import { url } from '../validators/url';
import { email } from '../validators/email';
import { oneOf } from '../validators/one-of';
import { field } from '../../primitives/field';
import { array } from '../../primitives/array';
import { pattern } from '../validators/pattern';
import { integer } from '../validators/integer';
import { between } from '../validators/between';
import { equalTo } from '../validators/equal-to';
import { maxDate } from '../validators/max-date';
import { minDate } from '../validators/min-date';
import { required } from '../validators/required';
import { maxWords } from '../validators/max-words';
import { minWords } from '../validators/min-words';
import { maxLength } from '../validators/max-length';
import { minLength } from '../validators/min-length';
import { dateBetween } from '../validators/date-between';
import { uniqueItems } from '../validators/unique-items';

describe('reactive validator messages', () => {
  it('accepts a static message string through every unambiguous shorthand', () => {
    const invalidNodes = [
      field('', [required('Custom error')]),
      field('invalid', [email('Custom error')]),
      field('invalid', [url('Custom error')]),
      field(1, [min(2, 'Custom error')]),
      field(2, [max(1, 'Custom error')]),
      field(3, [between(4, 5, 'Custom error')]),
      field(1.5, [integer('Custom error')]),
      field('actual', [equalTo('expected', 'Custom error')]),
      array({ id: field(1) }, [{ id: 1 }, { id: 1 }], [uniqueItems('id', 'Custom error')]),
      field('a', [minLength(2, 'Custom error')]),
      field('ab', [maxLength(1, 'Custom error')]),
      field<Date>(new Date('2026-01-01'), [minDate('2026-02-01', 'Custom error')]),
      field<Date>(new Date('2026-02-01'), [maxDate('2026-01-01', 'Custom error')]),
      field<Date>(new Date('2027-01-01'), [dateBetween('2026-01-01', '2026-12-31', 'Custom error')]),
      field('one', [minWords(2, 'Custom error')]),
      field('one two', [maxWords(1, 'Custom error')]),
      field('123', [pattern(/^[a-z]+$/, 'Custom error')]),
      field('archived', [oneOf(['draft', 'published'], 'Custom error')]),
    ];

    expect(invalidNodes.map(node => node.errors()[0]?.message)).toEqual(
      Array.from({ length: invalidNodes.length }, () => 'Custom error'),
    );
  });

  it('updates every built-in validator message and falls back when the source returns undefined', () => {
    const translatedMessage = signal<string | undefined>('Translated error');
    const message = () => translatedMessage();
    const invalidNodes = [
      field('', [required({ message })]),
      field('invalid', [email({ message })]),
      field('invalid', [url({ message })]),
      field(1, [min(2, { message })]),
      field(2, [max(1, { message })]),
      field(3, [between(4, 5, { message })]),
      field(1.5, [integer({ message })]),
      field('actual', [equalTo('expected', { message })]),
      array(field(''), ['duplicate', 'duplicate'], [uniqueItems({ message })]),
      field('a', [minLength(2, { message })]),
      field('ab', [maxLength(1, { message })]),
      field<Date>(new Date('2026-01-01'), [minDate('2026-02-01', { message })]),
      field<Date>(new Date('2026-02-01'), [maxDate('2026-01-01', { message })]),
      field<Date>(new Date('2027-01-01'), [dateBetween('2026-01-01', '2026-12-31', { message })]),
      field('one', [minWords(2, { message })]),
      field('one two', [maxWords(1, { message })]),
      field('123', [pattern(/^[a-z]+$/, { message })]),
      field('archived', [oneOf(['draft', 'published'], { message })]),
    ];

    expect(invalidNodes.map(node => node.errors()[0]?.message)).toEqual(
      Array.from({ length: invalidNodes.length }, () => 'Translated error'),
    );

    translatedMessage.set('Translated again');
    expect(invalidNodes.map(node => node.errors()[0]?.message)).toEqual(
      Array.from({ length: invalidNodes.length }, () => 'Translated again'),
    );

    translatedMessage.set(undefined);
    expect(invalidNodes.map(node => node.errors()[0]?.message)).not.toContain(undefined);
    expect(invalidNodes.map(node => node.errors()[0]?.message)).not.toContain('Translated again');
  });

  it('only evaluates a message function while its validator is failing', () => {
    const translatedMessage = signal('Too small');
    const message = vi.fn(() => translatedMessage());
    const value = field(3, [min(2, { message })]);

    expect(value.errors()).toEqual([]);
    expect(message).not.toHaveBeenCalled();

    value.set(1);
    expect(value.getError('min')?.message).toBe('Too small');
    expect(message).toHaveBeenCalledTimes(1);

    translatedMessage.set('Still too small');
    expect(value.getError('min')?.message).toBe('Still too small');
    expect(message).toHaveBeenCalledTimes(2);
  });
});
