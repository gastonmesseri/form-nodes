import { describe, expect, it } from 'vitest';

import { required } from './required';
import { field } from '../../primitives/field';

describe('required', () => {
  it('requires non-empty values', () => {
    const fieldNode = field<unknown>(null, [required]);
    expect(fieldNode.errors()).toEqual({ required: true });
    fieldNode.set(undefined);
    expect(fieldNode.errors()).toEqual({ required: true });
    fieldNode.set('');
    expect(fieldNode.errors()).toEqual({ required: true });
    fieldNode.set(false);
    expect(fieldNode.errors()).toEqual({ required: true });
    fieldNode.set(Number.NaN);
    expect(fieldNode.errors()).toEqual({ required: true });
    fieldNode.set('David');
    expect(fieldNode.errors()).toBeNull();
    fieldNode.set(0);
    expect(fieldNode.errors()).toBeNull();
  });

  it('supports direct and options syntax', () => {
    const directField = field('David', [required]);
    const optionsField = field('David', [required({ message: 'Name is required' })]);
    directField.set(null);
    optionsField.set(null);
    expect(directField.errors()).toEqual({ required: true });
    expect(optionsField.errors()).toEqual({
      required: { message: 'Name is required' },
    });
  });
});
