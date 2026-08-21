import { describe, expect, it } from 'vitest';

import { required } from './required';
import { field } from '../../primitives/field';

describe('required', () => {
  it('requires non-empty values', () => {
    const fieldNode = field<unknown>(null, [required]);
    expect(fieldNode.errors()).toEqual([{ kind: 'required' }]);
    fieldNode.set(undefined);
    expect(fieldNode.errors()).toEqual([{ kind: 'required' }]);
    fieldNode.set('');
    expect(fieldNode.errors()).toEqual([{ kind: 'required' }]);
    fieldNode.set(false);
    expect(fieldNode.errors()).toEqual([{ kind: 'required' }]);
    fieldNode.set(Number.NaN);
    expect(fieldNode.errors()).toEqual([{ kind: 'required' }]);
    fieldNode.set('David');
    expect(fieldNode.errors()).toEqual([]);
    fieldNode.set(0);
    expect(fieldNode.errors()).toEqual([]);
  });

  it('supports direct and options syntax', () => {
    const directField = field('David', [required]);
    const optionsField = field('David', [required({ message: 'Name is required' })]);
    directField.set(null);
    optionsField.set(null);
    expect(directField.errors()).toEqual([{ kind: 'required' }]);
    expect(optionsField.errors()).toEqual([
      { kind: 'required', message: 'Name is required' },
    ]);
  });

  it('does not confuse object field values with factory options', () => {
    const fieldNode = field<unknown>({ message: 'Field value' }, [required]);
    expect(fieldNode.errors()).toEqual([]);
  });
});
