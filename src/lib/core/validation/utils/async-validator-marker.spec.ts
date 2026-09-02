import { describe, expect, it } from 'vitest';

import type { AsyncValidator } from '../validation.type';
import { getAsyncValidatorOptions, isAsyncValidator, markAsAsyncValidator } from './async-validator-marker';

describe('async validator marker', () => {
  it('returns empty options for an unmarked validator', () => {
    const validator: AsyncValidator<string> = () => null;

    expect(isAsyncValidator(validator)).toBe(false);
    expect(getAsyncValidatorOptions(validator)).toEqual({});
  });

  it('marks a validator without wrapping it and retains its options', () => {
    const validator: AsyncValidator<string> = () => null;
    const options = { debounce: 100 };

    expect(markAsAsyncValidator(validator, options)).toBe(validator);
    expect(isAsyncValidator(validator)).toBe(true);
    expect(getAsyncValidatorOptions(validator)).toBe(options);
  });
});
