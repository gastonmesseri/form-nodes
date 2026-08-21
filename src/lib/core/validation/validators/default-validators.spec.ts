import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { max } from './max';
import { min } from './min';
import { email } from './email';
import { pattern } from './pattern';
import { maxDate } from './max-date';
import { minDate } from './min-date';
import { required } from './required';
import { maxLength } from './max-length';
import { minLength } from './min-length';
import { field } from '../../primitives/field';

describe('default validators', () => {
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

  it('supports direct and options required syntax', () => {
    const directField = field('David', [required]);
    const optionsField = field('David', [required({ message: 'Name is required' })]);
    directField.set(null);
    optionsField.set(null);
    expect(directField.errors()).toEqual({ required: true });
    expect(optionsField.errors()).toEqual({
      required: { message: 'Name is required' },
    });
  });

  it('validates minimum and maximum numbers', () => {
    expect(min(3)(2)).toEqual({ min: { min: 3, actual: 2 } });
    expect(min(3)(3)).toBeNull();
    expect(max(3)(4)).toEqual({ max: { max: 3, actual: 4 } });
    expect(max(3)(3)).toBeNull();
    expect(min(3)(null)).toBeNull();
    expect(max(3)(Number.NaN)).toBeNull();
  });

  it('tracks reactive numeric limits', () => {
    const minimum = signal(3);
    const fieldNode = field(2, [min(minimum)]);
    expect(fieldNode.errors()).toEqual({ min: { min: 3, actual: 2 } });
    minimum.set(2);
    expect(fieldNode.errors()).toBeNull();
  });

  it('validates minimum and maximum length or size', () => {
    expect(minLength(3)('ab')).toEqual({
      minLength: { minLength: 3, actualLength: 2 },
    });
    expect(minLength(3)('abc')).toBeNull();
    expect(minLength(1)(new Set())).toEqual({
      minLength: { minLength: 1, actualLength: 0 },
    });
    expect(maxLength(2)('abc')).toEqual({
      maxLength: { maxLength: 2, actualLength: 3 },
    });
    expect(maxLength(3)('abc')).toBeNull();
    expect(minLength(3)('')).toBeNull();
    expect(maxLength(3)(null)).toBeNull();
  });

  it('validates regular expression patterns', () => {
    expect(pattern(/^[a-z]+$/)('abc')).toBeNull();
    expect(pattern(/^[a-z]+$/)('123')).toEqual({
      pattern: { pattern: /^[a-z]+$/, actual: '123' },
    });
    expect(pattern(/^[a-z]+$/)('')).toBeNull();
    expect(pattern(/^[a-z]+$/)(null)).toBeNull();
  });

  it('validates email addresses', () => {
    expect(email('david@example.com')).toBeNull();
    expect(email('not-an-email')).toEqual({ email: true });
    expect(email('')).toBeNull();
    expect(email(null)).toBeNull();
  });

  it('validates minimum and maximum dates', () => {
    const middle = new Date('2026-06-01');
    const minimum = new Date('2026-07-01');
    const maximum = new Date('2026-05-01');
    expect(minDate(minimum)(middle)).toEqual({
      minDate: { minDate: minimum, actual: middle },
    });
    expect(maxDate(maximum)(middle)).toEqual({
      maxDate: { maxDate: maximum, actual: middle },
    });
    expect(minDate(minimum)(minimum)).toBeNull();
    expect(maxDate(maximum)(maximum)).toBeNull();
    expect(minDate(minimum)(null)).toBeNull();
    expect(maxDate(maximum)(new Date(Number.NaN))).toBeNull();
  });

  it('combines default validators in fields', () => {
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
