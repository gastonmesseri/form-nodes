import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { field } from '../../primitives/field';
import { minWords } from './min-words';

describe('minWords', () => {
  it('validates Unicode words and reports the actual count', () => {
    const biography = field('L\'été well-known 2026', [minWords(5)]);

    expect(biography.errors()).toMatchObject([{
      kind: 'minWords',
      minWords: 5,
      actual: 3,
      message: 'Please enter at least 5 words.',
    }]);

    biography.set('L\'été is very well known');
    expect(biography.errors()).toEqual([]);
    expect(field('---', [minWords(1)]).errors()).toMatchObject([
      { message: 'Please enter at least 1 word.' },
    ]);
  });

  it('accepts empty values and supports custom and reactive constraints', () => {
    const minimum = signal<number | undefined>(1);
    const biography = field<string>(null, [minWords(minimum, { message: 'Write something' })]);

    expect(biography.errors()).toEqual([]);
    biography.set('');
    expect(biography.errors()).toEqual([]);
    biography.set('---');
    expect(biography.errors()).toMatchObject([{
      kind: 'minWords',
      minWords: 1,
      actual: 0,
      message: 'Write something',
    }]);

    minimum.set(undefined);
    expect(biography.errors()).toEqual([]);
    minimum.set(Number.NaN);
    expect(biography.errors()).toEqual([]);
  });
});
