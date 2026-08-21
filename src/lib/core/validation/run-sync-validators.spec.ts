import { describe, expect, it } from 'vitest';

import { field } from '../primitives/field';
import { required } from './validators/required';
import { minLength } from './validators/min-length';

describe('runSyncValidators', () => {
  it('combines validators in fields', () => {
    const fieldNode = field('', [required, minLength(3)]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    fieldNode.set('ab');
    expect(fieldNode.errors()).toMatchObject([{ kind: 'minLength', minLength: 3 }]);
    fieldNode.set('David');
    expect(fieldNode.errors()).toEqual([]);
  });

  it('flattens validator results while preserving order and duplicate kinds', () => {
    const fieldNode = field('David', [
      () => [{ kind: 'name' }, { kind: 'name', message: 'Second error' }],
      () => undefined,
      () => ({ kind: 'name', message: 'Third error' }),
    ]);
    expect(fieldNode.errors()).toMatchObject([
      { kind: 'name' },
      { kind: 'name', message: 'Second error' },
      { kind: 'name', message: 'Third error' },
    ]);
    expect(fieldNode.errors().every((error) => error.targetNode === fieldNode)).toBe(true);
  });
});
