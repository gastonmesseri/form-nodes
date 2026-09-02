import { describe, expect, it } from 'vitest';

import { countWords } from './count-words';

describe('countWords', () => {
  it.each([
    ['', 0],
    [' \t\n ', 0],
    ['--- ... 🎉', 0],
    ['  one\ttwo\nthree  ', 3],
    ['don\'t l’été well-known', 3],
    ['café Ελληνικά 中文 ١٢٣', 4],
    ['version42 2026', 2],
    ['one,two/three—four', 4],
  ])('counts words in %j as %i', (value, expected) => {
    expect(countWords(value)).toBe(expected);
  });

  it('counts repeated calls independently', () => {
    expect(countWords('one two')).toBe(2);
    expect(countWords('one two')).toBe(2);
    expect(countWords('')).toBe(0);
    expect(countWords('three')).toBe(1);
  });
});
