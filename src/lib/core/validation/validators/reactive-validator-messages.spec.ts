import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { max } from './max';
import { min } from './min';
import { email } from './email';
import { oneOf } from './one-of';
import { pattern } from './pattern';
import { maxDate } from './max-date';
import { minDate } from './min-date';
import { required } from './required';
import { maxWords } from './max-words';
import { minWords } from './min-words';
import { maxLength } from './max-length';
import { minLength } from './min-length';
import { field } from '../../primitives/field';

describe('reactive validator messages', () => {
  it('updates every built-in validator message and falls back when the source returns undefined', () => {
    const translatedMessage = signal<string | undefined>('Translated error');
    const message = () => translatedMessage();
    const invalidNodes = [
      field('', [required({ message })]),
      field('invalid', [email({ message })]),
      field(1, [min(2, { message })]),
      field(2, [max(1, { message })]),
      field('a', [minLength(2, { message })]),
      field('ab', [maxLength(1, { message })]),
      field<Date>(new Date('2026-01-01'), [minDate('2026-02-01', { message })]),
      field<Date>(new Date('2026-02-01'), [maxDate('2026-01-01', { message })]),
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
