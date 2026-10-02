import { describe, expect, it } from 'vitest';

import { field } from '../primitives/field';
import { asyncValidator } from './async-validator';
import { required } from './validators/required';
import { minLength } from './validators/min-length';
import type { ComposableValidationResult, ComposableValidator } from './validation.type';

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
    expect(fieldNode.errors().every(error => error.targetNode === fieldNode)).toBe(true);
  });

  it('resolves nested synchronous validators with the same context', () => {
    const contexts: unknown[] = [];
    const nested: ComposableValidator<string | null> = (context) => {
      contexts.push(context);
      return { kind: 'nested' };
    };
    const fieldNode = field('David', [(context) => {
      contexts.push(context);
      return nested;
    }]);

    expect(fieldNode.errors()).toMatchObject([{ kind: 'nested' }]);
    expect(contexts).toHaveLength(2);
    expect(contexts[0]).toBe(contexts[1]);
  });

  it('rejects circular synchronous validator composition', () => {
    /* eslint-disable prefer-const -- The validator deliberately closes over itself to test circular composition. */
    let circular!: ComposableValidator<string | null>;
    circular = () => circular;
    /* eslint-enable prefer-const */
    const fieldNode = field('David', [circular]);

    expect(() => fieldNode.validators({ resolve: true })).toThrow('Circular synchronous validator composition detected.');
    expect(() => fieldNode.errors()).toThrow('Circular synchronous validator composition detected.');
  });

  it('rejects synchronous validator composition deeper than the safety limit', () => {
    let nested: ComposableValidator<string | null> = () => null;
    for (let depth = 0; depth <= 100; depth++) {
      const child = nested;
      nested = () => child;
    }
    const fieldNode = field('David', [nested]);

    expect(() => fieldNode.hasValidator(required, { resolve: true })).toThrow('Synchronous validator composition exceeded 100 levels.');
    expect(() => fieldNode.errors()).toThrow('Synchronous validator composition exceeded 100 levels.');
  });

  it('rejects an asynchronous validator returned by a synchronous validator', () => {
    const fieldNode = field('David', [() => asyncValidator(async () => null)]);

    expect(() => fieldNode.validators({ resolve: true })).toThrow(
      'A synchronous validator cannot return an asyncValidator(); add it directly to the validators array.',
    );
  });

  it('allows the same validator in multiple branches of a returned array', () => {
    const duplicate = () => ({ kind: 'duplicate' });
    const fieldNode = field('David', [() => [duplicate, duplicate]]);

    expect(fieldNode.errors()).toMatchObject([{ kind: 'duplicate' }, { kind: 'duplicate' }]);
  });

  it('treats a returned array containing only empty entries as successful', () => {
    const fieldNode = field('David', [() => [null, undefined]]);

    expect(fieldNode.errors()).toEqual([]);
  });

  it.each([{ kind: 'mixed' }, 'Message', ''])('rejects arrays that mix validators and validation errors (%s)', (error) => {
    const mixed = () => [required, error] as unknown as ComposableValidationResult<string | null>;
    const fieldNode = field('David', [mixed]);

    expect(() => fieldNode.validators({ resolve: true })).toThrow(
      'Synchronous validator composition cannot mix validators and validation errors in the same array.',
    );
  });
});
