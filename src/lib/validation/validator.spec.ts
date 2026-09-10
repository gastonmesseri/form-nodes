import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { validator } from './validator';
import { field } from '../primitives/field';
import { required } from './validators/required';
import { asyncValidator } from './async-validator';

describe('validator', () => {
  it('returns the original validator without wrapping it', () => {
    const validate = () => ({ kind: 'custom' });

    expect(validator<null>(validate)).toBe(validate);
  });
});

it('keeps reactive policies independent when reusing the same callback', () => {
  const external = signal(true);
  const validate = () => external() ? { kind: 'blocked' } : null;
  const tracked = validator(validate, { reactive: true });
  const untracked = validator(validate, { reactive: false });
  const a = field(1, tracked);
  const b = field(1, untracked);
  expect(tracked).toBe(validate);
  expect(untracked).not.toBe(validate);
  expect(a.invalid()).toBe(true);
  expect(b.invalid()).toBe(true);
  external.set(false);
  expect(a.valid()).toBe(true);
  expect(b.invalid()).toBe(true);
  b.set(2);
  expect(b.valid()).toBe(true);
});

it('preserves direct metadata through repeated non-reactive wrappers', () => {
  const rule = validator(validator(required, { reactive: false }), { reactive: false });
  const name = field('', rule);
  expect(name.required()).toBe(true);
  expect(name.errors()).toMatchObject([{ kind: 'required' }]);
  expect(name.validators()).toEqual([rule]);
  expect(name.validators({ resolve: true })).toEqual([rule]);
  name.set('Ada');
  expect(name.required()).toBe(true);
  expect(name.valid()).toBe(true);
});

it('rejects applying synchronous tracking options to an asynchronous validator', () => {
  const rule = asyncValidator(async () => null);
  expect(validator(rule)).toBe(rule);
  expect(() => validator(rule, { reactive: false })).toThrow('cannot wrap asyncValidator()');
});
