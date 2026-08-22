import { describe, expect, it } from 'vitest';

import { field } from '../primitives/field';
import { asyncValidator } from './async-validator';
import { required } from './validators/required';
import { minLength } from './validators/min-length';
import type { ComposableValidator } from './validation.type';

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

  it('resolves nested synchronous validators with the same context', () => {
    const contexts: unknown[] = [];
    const nested: ComposableValidator<string | null> = context => {
      contexts.push(context);
      return { kind: 'nested' };
    };
    const fieldNode = field('David', [context => {
      contexts.push(context);
      return nested;
    }]);

    expect(fieldNode.errors()).toMatchObject([{ kind: 'nested' }]);
    expect(contexts).toHaveLength(2);
    expect(contexts[0]).toBe(contexts[1]);
  });

  it('rejects circular synchronous validator composition', () => {
    let circular!: ComposableValidator<string | null>;
    circular = () => circular;
    const fieldNode = field('David', [circular]);

    expect(() => fieldNode.errors()).toThrow('Circular synchronous validator composition detected.');
  });

  it('rejects an asynchronous validator returned by a synchronous validator', () => {
    const fieldNode = field('David', [() => asyncValidator(async () => null)]);

    expect(() => fieldNode.errors()).toThrow(
      'A synchronous validator cannot return an asyncValidator(); add it directly to the validators array.',
    );
  });
});
