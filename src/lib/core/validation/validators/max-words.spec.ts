import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { field } from '../../primitives/field';
import { maxWords } from './max-words';

describe('maxWords', () => {
  it('validates maximum word counts and reports the actual count', () => {
    const summary = field('one two three', [maxWords(2)]);

    expect(summary.errors()).toMatchObject([{
      kind: 'maxWords',
      maxWords: 2,
      actual: 3,
      message: 'Please enter no more than 2 words.',
    }]);

    summary.set('one two');
    expect(summary.errors()).toEqual([]);
    expect(field('one two', [maxWords(1)]).errors()).toMatchObject([
      { message: 'Please enter no more than 1 word.' },
    ]);
  });

  it('accepts empty values and supports custom and reactive constraints', () => {
    const maximum = signal<number | undefined>(1);
    const summary = field<string>(null, [maxWords(maximum, { message: 'Keep it short' })]);

    expect(summary.errors()).toEqual([]);
    summary.set('');
    expect(summary.errors()).toEqual([]);
    summary.set('one two');
    expect(summary.errors()).toMatchObject([{
      kind: 'maxWords',
      maxWords: 1,
      actual: 2,
      message: 'Keep it short',
    }]);

    maximum.set(undefined);
    expect(summary.errors()).toEqual([]);
    maximum.set(Number.NaN);
    expect(summary.errors()).toEqual([]);
  });
});
