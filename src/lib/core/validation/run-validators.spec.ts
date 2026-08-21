import { describe, expect, it } from 'vitest';

import { field } from '../primitives/field';
import { required } from './validators/required';
import { minLength } from './validators/min-length';

describe('runValidators', () => {
  it('combines validators in fields', () => {
    const fieldNode = field('', [required, minLength(3)]);
    expect(fieldNode.errors()).toEqual({ required: true });
    fieldNode.set('ab');
    expect(fieldNode.errors()).toEqual({
      minLength: { minLength: 3, actualLength: 2 },
    });
    fieldNode.set('David');
    expect(fieldNode.errors()).toBeNull();
  });
});
