import { describe, expect, it } from 'vitest';
import { MaxLengthValidator, MaxValidator, MinLengthValidator, MinValidator, PatternValidator, Validators } from '@angular/forms';

import { resolveValidatorConstraints } from './validator-constraints';

describe('standard Angular directive constraints', () => {
  it('combines numeric bounds and length bounds using the strongest declarations', () => {
    const make = <T extends object>(type: new () => T, options: Partial<T>) => Object.assign(new type(), options);
    expect(resolveValidatorConstraints([
      make(MinValidator, { min: '1.5' }), make(MinValidator, { min: 2 }),
      make(MaxValidator, { max: '9.5' }), make(MaxValidator, { max: 8 }),
      make(MinLengthValidator, { minlength: '2.8' }), make(MinLengthValidator, { minlength: 3 }),
      make(MaxLengthValidator, { maxlength: '10.8' }), make(MaxLengthValidator, { maxlength: 9 }),
    ])).toEqual({ min: 2, max: 8, minLength: 3, maxLength: 9, pattern: [] });
  });

  it('ignores absent and invalid numeric bounds and arbitrary validator functions', () => {
    const min = new MinValidator();
    const max = new MaxValidator();
    min.min = null;
    max.max = '';
    expect(resolveValidatorConstraints([min, max, Validators.min(3)])).toEqual({ pattern: [] });
  });

  it('anchors string patterns, preserves RegExp objects, and excludes empty patterns', () => {
    const regexp = /Ada/gi;
    const validators = ['Ada', '^Grace$', '^Lin', 'Pat$', '', regexp].map((pattern) => {
      const validator = new PatternValidator();
      validator.pattern = pattern;
      return validator;
    });
    const result = resolveValidatorConstraints(validators);
    expect(result.pattern).toEqual([/^Ada$/, /^Grace$/, /^Lin$/, /^Pat$/, regexp]);
    expect(result.pattern.at(-1)).toBe(regexp);
    expect(regexp.lastIndex).toBe(0);
  });
});
