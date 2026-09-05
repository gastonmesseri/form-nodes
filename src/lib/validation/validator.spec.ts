import { describe, expect, it } from 'vitest';

import { validator } from './validator';

describe('validator', () => {
  it('returns the original validator without wrapping it', () => {
    const validate = () => ({ kind: 'custom' });

    expect(validator<null>(validate)).toBe(validate);
  });
});
