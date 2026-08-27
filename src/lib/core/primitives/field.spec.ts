import { describe, expect, it, vi } from 'vitest';
import { computed, signal, type Signal } from '@angular/core';

import { field } from './field';
import { max } from '../validation/validators/max';
import { min } from '../validation/validators/min';
import { url } from '../validation/validators/url';
import { validator } from '../validation/validator';
import { email } from '../validation/validators/email';
import type { InternalNode } from '../types/node.type';
import { pattern } from '../validation/validators/pattern';
import { integer } from '../validation/validators/integer';
import { maxDate } from '../validation/validators/max-date';
import { minDate } from '../validation/validators/min-date';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import { maxLength } from '../validation/validators/max-length';
import { minLength } from '../validation/validators/min-length';

type Context<TValue> = { readonly value: Signal<TValue> };

describe('field', () => {
  it('exposes the same API through api and $api', () => {
    const name = field('David');

    expect(name.$api).toBe(name.api);
  });

  it('exposes an empty path when it is a root node', () => {
    const name = field('David');

    expect(name.api.path()).toEqual([]);
    expect(name.api.parent()).toBeNull();
    expect(name.api.form()).toBeNull();
    expect(name.keyInParent()).toBeNull();
  });

  it('exposes the initial value when called and through value()', () => {
    const fieldNode = field('David');
    expect(fieldNode()).toBe('David');
    expect(fieldNode.value()).toBe('David');
  });

  it('allows focusing safely when no UI control is bound', () => {
    const fieldNode = field('David');

    expect(() => fieldNode.focus()).not.toThrow();
  });

  it('starts as null when no initial value is given', () => {
    const fieldNode = field<string>();
    expect(fieldNode()).toBeNull();
  });

  it('accepts an explicit null initial value', () => {
    const fieldNode = field<string>(null, []);
    expect(fieldNode()).toBeNull();
    fieldNode.set('David');
    expect(fieldNode()).toBe('David');
    fieldNode.set(null);
    expect(fieldNode()).toBeNull();
  });

  it('keeps a non-null initial value when nullable is false', () => {
    const fieldNode = field('David', { nullable: false });
    expect(fieldNode()).toBe('David');
    fieldNode.reset();
    expect(fieldNode()).toBe('David');
  });

  it('updates the value through set', () => {
    const fieldNode = field(23);
    fieldNode.set(30);
    expect(fieldNode()).toBe(30);
    expect(fieldNode.value()).toBe(30);
  });

  it('updates programmatically from the committed value without marking dirty', () => {
    const updater = vi.fn((value: number | null) => (value ?? 0) + 1);
    const fieldNode = field(23);

    fieldNode.update(updater);

    expect(updater).toHaveBeenCalledOnce();
    expect(updater).toHaveBeenCalledWith(23);
    expect(fieldNode()).toBe(24);
    expect(fieldNode.controlValue()).toBe(24);
    expect(fieldNode.pristine()).toBe(true);
  });

  it('updates control and model values immediately without control debounce', () => {
    const fieldNode = field('David');

    fieldNode.setControlValue('Daniel');

    expect(fieldNode.controlValue()).toBe('Daniel');
    expect(fieldNode.value()).toBe('Daniel');
    expect(fieldNode.debouncing()).toBe(false);
    expect(fieldNode.dirty()).toBe(true);
  });

  it('buffers debounced control updates before committing the model value', async () => {
    vi.useFakeTimers();
    try {
      const validate = vi.fn(({ value }: Context<string | null>) => value() === 'Daniel' ? { kind: 'taken' } : null);
      const fieldNode = field('David', { validators: [validate], debounce: 100 });

      expect(fieldNode.errors()).toEqual([]);
      expect(validate).toHaveBeenCalledOnce();

      fieldNode.setControlValue('Daniel');

      expect(fieldNode.controlValue()).toBe('Daniel');
      expect(fieldNode.value()).toBe('David');
      expect(fieldNode.debouncing()).toBe(true);
      expect(fieldNode.errors()).toEqual([]);
      expect(validate).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(100);

      expect(fieldNode.value()).toBe('Daniel');
      expect(fieldNode.debouncing()).toBe(false);
      expect(fieldNode.errors()).toMatchObject([{ kind: 'taken' }]);
      expect(validate).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('buffers blur-debounced control updates until blur or an explicit flush', () => {
    const fieldNode = field('initial', { debounce: 'blur' });

    fieldNode.setControlValue('pending');
    expect(fieldNode.controlValue()).toBe('pending');
    expect(fieldNode.value()).toBe('initial');
    expect(fieldNode.debouncing()).toBe(true);

    (fieldNode as unknown as InternalNode).$api._flushControlValueOnBlur();
    expect(fieldNode.value()).toBe('pending');
    expect(fieldNode.debouncing()).toBe(false);

    fieldNode.setControlValue('flushed');
    fieldNode.flush();
    expect(fieldNode.value()).toBe('flushed');
    expect(fieldNode.debouncing()).toBe(false);
  });

  it('runs cancelable asynchronous control debouncers and ignores stale settlements', async () => {
    const runs: Array<{
      readonly signal: AbortSignal;
      resolve(): void;
      reject(): void;
    }> = [];
    const fieldNode = field('initial', {
      debounce: abortSignal => new Promise<void>((resolve, reject) => {
        runs.push({ signal: abortSignal, resolve, reject });
      }),
    });

    fieldNode.setControlValue('first');
    fieldNode.setControlValue('second');
    expect(runs[0]!.signal.aborted).toBe(true);
    expect(runs[1]!.signal.aborted).toBe(false);
    expect(fieldNode()).toBe('initial');

    runs[0]!.resolve();
    await Promise.resolve();
    expect(fieldNode()).toBe('initial');

    runs[1]!.resolve();
    await Promise.resolve();
    expect(fieldNode()).toBe('second');
    expect(fieldNode.debouncing()).toBe(false);

    fieldNode.setControlValue('rejected');
    runs[2]!.reject();
    await Promise.resolve();
    expect(fieldNode()).toBe('second');
    expect(fieldNode.controlValue()).toBe('rejected');
    expect(fieldNode.debouncing()).toBe(false);

    fieldNode.setControlValue('reset pending');
    fieldNode.reset();
    expect(runs[3]!.signal.aborted).toBe(true);
    expect(fieldNode()).toBe('second');
    expect(fieldNode.controlValue()).toBe('second');

    fieldNode.setControlValue('flushed');
    fieldNode.flush();
    expect(runs[4]!.signal.aborted).toBe(true);
    expect(fieldNode()).toBe('flushed');
  });

  it('handles synchronous custom control debouncers', () => {
    const immediate = field('initial', { debounce: () => {} });
    immediate.setControlValue('updated');
    expect(immediate()).toBe('updated');
    expect(immediate.debouncing()).toBe(false);

    const failure = new Error('Debouncer failed');
    const throwing = field('initial', { debounce: () => { throw failure; } });
    expect(() => throwing.setControlValue('pending')).toThrow(failure);
    expect(throwing()).toBe('initial');
    expect(throwing.controlValue()).toBe('pending');
    expect(throwing.debouncing()).toBe(false);
  });

  it('does not restart asynchronous validation until a control value is committed', async () => {
    vi.useFakeTimers();
    try {
      const validate = vi.fn(async ({ value }: Context<string | null>) => {
        value();
        return null;
      });
      const fieldNode = field('David', {
        validators: [asyncValidator(validate)],
        debounce: 100,
      });

      await Promise.resolve();
      await Promise.resolve();
      expect(validate).toHaveBeenCalledOnce();

      fieldNode.setControlValue('Daniel');
      await Promise.resolve();
      await Promise.resolve();
      expect(validate).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(0);
      await Promise.resolve();
      await Promise.resolve();
      expect(validate).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('restarts control debounce and flushes only the latest value', async () => {
    vi.useFakeTimers();
    try {
      const fieldNode = field('initial', { debounce: 100 });

      fieldNode.setControlValue('first');
      await vi.advanceTimersByTimeAsync(50);
      fieldNode.setControlValue('second');
      await vi.advanceTimersByTimeAsync(99);

      expect(fieldNode.value()).toBe('initial');
      expect(fieldNode.controlValue()).toBe('second');

      fieldNode.flush();

      expect(fieldNode.value()).toBe('second');
      expect(fieldNode.debouncing()).toBe(false);
      await vi.runAllTimersAsync();
      expect(fieldNode.value()).toBe('second');
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels pending control updates on programmatic set and reset', async () => {
    vi.useFakeTimers();
    try {
      const fieldNode = field('initial', { debounce: 100 });

      fieldNode.setControlValue('stale');
      fieldNode.set('programmatic');
      await vi.runAllTimersAsync();

      expect(fieldNode.value()).toBe('programmatic');
      expect(fieldNode.controlValue()).toBe('programmatic');
      expect(fieldNode.debouncing()).toBe(false);

      fieldNode.setControlValue('stale reset');
      fieldNode.reset();
      await vi.runAllTimersAsync();

      expect(fieldNode.value()).toBe('programmatic');
      expect(fieldNode.controlValue()).toBe('programmatic');
      expect(fieldNode.pristine()).toBe(true);

      fieldNode.setControlValue('another stale value');
      fieldNode.reset('reset value');
      await vi.runAllTimersAsync();

      expect(fieldNode.value()).toBe('reset value');
      expect(fieldNode.controlValue()).toBe('reset value');
      expect(fieldNode.pristine()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('flushes a pending control value when marked as touched', () => {
    const fieldNode = field('initial', { debounce: 'blur' });

    fieldNode.setControlValue('touched');
    fieldNode.markAsTouched();

    expect(fieldNode()).toBe('touched');
    expect(fieldNode.touched()).toBe(true);
    expect(fieldNode.debouncing()).toBe(false);
  });

  it('is valid with an empty error array when it has no validators', () => {
    const fieldNode = field('David');
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
    expect(fieldNode.invalid()).toBe(false);
  });

  it('passes a stable reactive value context to validators', () => {
    const contexts: Context<string | null>[] = [];
    const validator = (context: Context<string | null>) => {
      contexts.push(context);
      return context.value() === '' ? { kind: 'required' } : null;
    };
    const fieldNode = field('', [validator]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    fieldNode.set('David');
    expect(fieldNode.errors()).toEqual([]);
    expect(contexts).toHaveLength(2);
    expect(contexts[0]).toBe(contexts[1]);
    expect(contexts[0]!.value()).toBe('David');
  });

  it('exposes the complete field api to synchronous validators', () => {
    let validatorApi: unknown;
    let validatorField: unknown;
    let disabled: unknown;
    let disabledReasons: unknown;
    const fieldNode = field('David', [(context) => {
      validatorApi = context.api;
      validatorField = context.field;
      disabled = context.disabled;
      disabledReasons = context.disabledReasons;
      return null;
    }]);

    expect(fieldNode.errors()).toEqual([]);
    expect(validatorApi).toBe(fieldNode.api);
    expect(validatorField).toBe(fieldNode);
    expect(disabled).toBe(fieldNode.disabled);
    expect(disabledReasons).toBe(fieldNode.disabledReasons);
    expect(fieldNode.api.path()).toEqual([]);
    expect(fieldNode.api.parent()).toBeNull();
    expect(fieldNode.api.form()).toBeNull();
  });

  it('reports the error of a failing validator', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    expect(fieldNode.valid()).toBe(false);
    expect(fieldNode.invalid()).toBe(true);
  });

  it('supports direct built-in validators with default messages', () => {
    const emailField = field('not-an-email', [email]);
    const urlField = field('/relative-path', [url]);
    const integerField = field(1.5, [integer]);

    expect(emailField.errors()).toMatchObject([
      { kind: 'email', message: 'Please enter a valid email address.' },
    ]);
    expect(urlField.errors()).toMatchObject([
      { kind: 'url', message: 'Please enter a valid absolute URL.' },
    ]);
    expect(integerField.errors()).toMatchObject([
      { kind: 'integer', actual: 1.5, message: 'Please enter a safe integer.' },
    ]);
  });

  it('derives validationStatus from synchronous validation', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);

    expect(fieldNode.validationStatus()).toBe('invalid');
    expect(fieldNode.valid()).toBe(false);
    expect(fieldNode.invalid()).toBe(true);

    fieldNode.set('David');

    expect(fieldNode.validationStatus()).toBe('valid');
    expect(fieldNode.valid()).toBe(true);
    expect(fieldNode.invalid()).toBe(false);
  });

  it('runs an asynchronous validator and exposes its validation state', async () => {
    const fieldNode = field('David', [
      asyncValidator(async ({ value }) => value() === 'David' ? { kind: 'nameTaken' } : null),
    ]);

    expect(fieldNode.pending()).toBe(true);
    expect(fieldNode.validationStatus()).toBe('unknown');

    await Promise.resolve();
    await Promise.resolve();

    expect(fieldNode.pending()).toBe(false);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'nameTaken' }]);
    expect(fieldNode.validationStatus()).toBe('invalid');
  });

  it('suppresses pending validation state while non-interactive and restores it afterwards', () => {
    const fieldNode = field('David', [asyncValidator(() => new Promise<null>(() => {}))]);
    expect(fieldNode.pending()).toBe(true);

    fieldNode.disable();
    expect(fieldNode.pending()).toBe(false);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.enable();
    expect(fieldNode.pending()).toBe(true);

    fieldNode.markAsReadonly();
    expect(fieldNode.pending()).toBe(false);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.markAsWritable();
    expect(fieldNode.pending()).toBe(true);

    fieldNode.hide();
    expect(fieldNode.pending()).toBe(false);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.show();
    expect(fieldNode.pending()).toBe(true);
  });

  it('reruns an asynchronous validator when a signal read by it changes', async () => {
    const available = signal(true);
    const validate = vi.fn(async ({ value }: Context<string | null>) =>
      available() || value() === null ? null : { kind: 'unavailable' },
    );
    const fieldNode = field('David', [asyncValidator(validate)]);

    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(fieldNode.errors()).toEqual([]);

    available.set(false);
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledTimes(2);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'unavailable' }]);
  });

  it('restarts debounced asynchronous validation when its value changes', async () => {
    vi.useFakeTimers();
    const validate = vi.fn(async ({ value }: Context<string | null>) =>
      value() === 'David' ? { kind: 'nameTaken' } : null,
    );
    const fieldNode = field('Daniel', [asyncValidator(validate, { debounce: 100 })]);

    await Promise.resolve();
    fieldNode.set('David');
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(100);

    expect(validate).toHaveBeenCalledTimes(2);
    expect(fieldNode.pending()).toBe(false);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'nameTaken' }]);
    vi.useRealTimers();
  });

  it('passes an explicit reactive params snapshot to an asynchronous validator', async () => {
    const country = signal('Switzerland');
    const validate = vi.fn(async ({ params }: { params: { country: string; name: string | null } }) =>
      params.country === 'Switzerland' && params.name === 'David' ? { kind: 'nameTaken' } : null,
    );
    const fieldNode = field('David', [asyncValidator({
      params: ({ value }) => ({ country: country(), name: value() }),
      validate,
    })]);

    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledWith(expect.objectContaining({
      params: { country: 'Switzerland', name: 'David' },
    }));
    expect(fieldNode.errors()).toMatchObject([{ kind: 'nameTaken' }]);
  });

  it('only reruns a parameterized asynchronous validator when its shallow params change', async () => {
    const person = signal({ firstName: 'David', lastName: 'Smith' });
    const validate = vi.fn(async () => null);
    field('profile', [asyncValidator({
      params: () => ({ username: person().firstName }),
      validate,
    })]);

    await Promise.resolve();
    await Promise.resolve();
    person.set({ firstName: 'David', lastName: 'Jones' });
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    person.set({ firstName: 'Daniel', lastName: 'Jones' });
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('reactively includes or excludes an asynchronous validator through when', async () => {
    const enabled = signal(false);
    const validate = vi.fn(async () => ({ kind: 'nameTaken' }));
    const fieldNode = field('David', [asyncValidator(validate, {
      when: () => enabled(),
    })]);

    expect(fieldNode.valid()).toBe(true);
    expect(validate).not.toHaveBeenCalled();

    enabled.set(true);
    await Promise.resolve();
    expect(fieldNode.pending()).toBe(true);
    await Promise.resolve();
    expect(fieldNode.errors()).toMatchObject([{ kind: 'nameTaken' }]);

    enabled.set(false);
    await Promise.resolve();
    expect(fieldNode.pending()).toBe(false);
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
  });

  it('exposes its interaction and availability state to an asynchronous validator', async () => {
    const states: Array<{ dirty: boolean; disabled: boolean; hidden: boolean; readonly: boolean; touched: boolean }> = [];
    const fieldNode = field('David', [asyncValidator(async ({ api }) => {
      states.push({
        dirty: api.dirty(),
        disabled: api.disabled(),
        hidden: api.hidden(),
        readonly: api.readonly(),
        touched: api.touched(),
      });
      return null;
    })]);

    await Promise.resolve();
    await Promise.resolve();
    fieldNode.markAsDirty();
    fieldNode.markAsTouched();
    await Promise.resolve();
    await Promise.resolve();

    expect(states).toEqual([
      { dirty: false, disabled: false, hidden: false, readonly: false, touched: false },
      { dirty: true, disabled: false, hidden: false, readonly: false, touched: true },
    ]);
  });

  it('collects the errors of several validators in order', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const minLength = ({ value }: Context<string | null>) =>
      value() !== null && value()!.length < 3
        ? { kind: 'minLength', minLength: 3, actualLength: value()!.length }
        : null;
    const fieldNode = field('', [required, minLength]);
    expect(fieldNode.errors()).toMatchObject([
      { kind: 'required' },
      { kind: 'minLength', minLength: 3, actualLength: 0 },
    ]);
    expect(fieldNode.errors().every(error => error.targetNode === fieldNode)).toBe(true);
  });

  it('leaves out the keys of validators that pass', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const minLength = ({ value }: Context<string | null>) =>
      value() !== null && value()!.length < 3 ? { kind: 'minLength' } : null;
    const fieldNode = field('ab', [required, minLength]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'minLength' }]);
  });

  it('recomputes errors when the value changes', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.valid()).toBe(false);
    fieldNode.set('David');
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
  });

  it('reports whether a required validator is configured or its error is active', () => {
    const fieldNode = field('', [required]);

    expect(fieldNode.required()).toBe(true);
    expect(fieldNode.api.required()).toBe(true);

    fieldNode.set('David');
    expect(fieldNode.required()).toBe(true);

    fieldNode.set('');
    fieldNode.disable();
    expect(fieldNode.required()).toBe(true);

    fieldNode.enable();
    expect(fieldNode.required()).toBe(true);
  });

  it('is not required without a required validator or required error', () => {
    const withoutValidators = field('David');
    const unrelatedValidator = field('David', [() => ({ kind: 'unrelated' })]);

    expect(withoutValidators.required()).toBe(false);
    expect(withoutValidators.api.required()).toBe(false);
    expect(unrelatedValidator.required()).toBe(false);
  });

  it('exposes the strictest active validator constraints as reactive field state', () => {
    const reactiveMinimum = signal<number | undefined>(5);
    const firstPattern = /^a/;
    const secondPattern = /z$/;
    const fieldNode = field('abz', [
      minLength(2),
      minLength(3),
      maxLength(10),
      maxLength(8),
      pattern(firstPattern),
      pattern(secondPattern),
    ]);
    const numericField = field(7, [min(Number.NaN), min(2), min(reactiveMinimum), max(Number.NaN), max(20), max(15)]);

    expect(fieldNode.minLength()).toBe(3);
    expect(fieldNode.maxLength()).toBe(8);
    expect(fieldNode.pattern()).toEqual([firstPattern, secondPattern]);
    expect(numericField.min()).toBe(5);
    expect(numericField.max()).toBe(15);

    reactiveMinimum.set(9);
    expect(numericField.min()).toBe(9);

    reactiveMinimum.set(undefined);
    expect(numericField.min()).toBe(2);

    const invalidDate = new Date(Number.NaN);
    const dateField = field(new Date('2026-06-01T00:00:00.000Z'), [
      minDate(invalidDate),
      maxDate(invalidDate),
    ]);
    expect(dateField.min()).toBeNull();
    expect(dateField.max()).toBeNull();
  });

  it('exposes stable empty constraint signals when no constraint validators are active', () => {
    const fieldNode = field('David');

    expect(fieldNode.min()).toBeNull();
    expect(fieldNode.max()).toBeNull();
    expect(fieldNode.minLength()).toBeNull();
    expect(fieldNode.maxLength()).toBeNull();
    expect(fieldNode.pattern()).toEqual([]);
  });

  it('exposes date limits and removes conditionally composed constraints', () => {
    const enabled = signal(true);
    const earliest = new Date('2026-01-01T00:00:00.000Z');
    const strictestEarliest = new Date('2026-02-01T00:00:00.000Z');
    const latest = new Date('2026-12-31T00:00:00.000Z');
    const fieldNode = field(new Date('2026-06-01T00:00:00.000Z'), [
      minDate(earliest),
      () => enabled() ? minDate(strictestEarliest) : null,
      maxDate(latest),
    ]);

    expect(fieldNode.min()).toBe(strictestEarliest);
    expect(fieldNode.max()).toBe(latest);

    enabled.set(false);
    expect(fieldNode.min()).toBe(earliest);
  });

  it('normalizes string date constraints in validation errors and constraint metadata', () => {
    const latest = signal<string | undefined>('2026-08-24');
    const fieldNode = field(new Date('2026-08-25T00:00:00.000Z'), [
      minDate('2026-01-01'),
      maxDate(() => latest()),
    ]);

    expect(fieldNode.min()).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(fieldNode.max()).toEqual(new Date('2026-08-24T00:00:00.000Z'));
    expect(fieldNode.getError('maxDate')?.maxDate).toEqual(new Date('2026-08-24T00:00:00.000Z'));

    latest.set('2026-12-31');
    expect(fieldNode.max()).toEqual(new Date('2026-12-31T00:00:00.000Z'));
    expect(fieldNode.getError('maxDate')).toBeUndefined();
  });

  it('returns the first active error of a requested kind', () => {
    const fieldNode = field('', [
      () => ({ kind: 'duplicate', message: 'First' }),
      () => ({ kind: 'duplicate', message: 'Second' }),
      required,
    ]);

    expect(fieldNode.getError('duplicate')).toMatchObject({ kind: 'duplicate', message: 'First' });
    expect(fieldNode.getError('duplicate')?.targetNode).toBe(fieldNode);
    expect(fieldNode.api.getError('required')).toMatchObject({ kind: 'required' });
    expect(fieldNode.getError('missing')).toBeUndefined();

    fieldNode.set('David');
    expect(fieldNode.getError('required')).toBeUndefined();
  });

  it('exposes all field errors through allErrors', () => {
    const fieldNode = field('', [required, () => ({ kind: 'custom' })]);

    expect(fieldNode.allErrors()).toBe(fieldNode.errors());
    expect(fieldNode.allErrors().map(error => error.kind)).toEqual(['required', 'custom']);
    expect(fieldNode.allErrors().every(error => error.targetNode === fieldNode)).toBe(true);

    fieldNode.set('David');

    expect(fieldNode.allErrors().map(error => error.kind)).toEqual(['custom']);
    expect(fieldNode.api.allErrors()).toBe(fieldNode.allErrors());
  });

  it('does not propagate getError when only another error kind changes', () => {
    const unrelated = signal(false);
    const fieldNode = field('', [
      required,
      () => unrelated() ? { kind: 'unrelated' } : null,
    ]);
    let downstreamRuns = 0;
    const requiredMessage = computed(() => {
      downstreamRuns++;
      return fieldNode.getError('required')?.message;
    });

    expect(requiredMessage()).toBe('This field is required.');
    expect(downstreamRuns).toBe(1);

    unrelated.set(true);
    expect(requiredMessage()).toBe('This field is required.');
    expect(downstreamRuns).toBe(1);
  });

  it('derives required from the error kind rather than validator identity', () => {
    const fieldNode = field('David', [() => ({ kind: 'required' })]);

    expect(fieldNode.required()).toBe(true);
  });

  it('recognizes configured and conditionally composed required validators', () => {
    const enabled = signal(false);
    const configured = field('David', [required({ message: 'Name is required' })]);
    const conditional = field('David', [() => enabled() ? required : null]);

    expect(configured.errors()).toEqual([]);
    expect(configured.required()).toBe(true);
    expect(conditional.required()).toBe(false);

    enabled.set(true);
    expect(conditional.required()).toBe(true);

    enabled.set(false);
    expect(conditional.required()).toBe(false);
  });

  it('reacts to external signals read by a synchronous validator', () => {
    const blocked = signal(false);
    const validate = vi.fn(() => blocked() ? { kind: 'blocked' } : null);
    const fieldNode = field('David', [validate]);

    expect(fieldNode.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledOnce();

    blocked.set(true);

    expect(fieldNode.errors()).toMatchObject([{ kind: 'blocked' }]);
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('conditionally applies a synchronous validator returned by another validator', () => {
    const otherAge = signal(23);
    const validate = vi.fn(() => otherAge() > 30 ? required : null);
    const name = field('', [validate]);

    expect(name.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledOnce();

    otherAge.set(31);

    expect(name.errors()).toMatchObject([{ kind: 'required' }]);
    expect(validate).toHaveBeenCalledTimes(2);

    otherAge.set(30);

    expect(name.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledTimes(3);
  });

  it('runs a reusable validator authored with validator()', () => {
    const minimum = signal(18);
    const adult = validator<number | null>(({ value }) => {
      const age = value();
      return age !== null && age < minimum()
        ? { kind: 'adult', minimumAge: minimum(), actual: age }
        : null;
    });
    const age = field<number>(16, [adult]);

    expect(age.getError('adult')).toMatchObject({ minimumAge: 18, actual: 16 });

    minimum.set(16);
    expect(age.getError('adult')).toBeUndefined();
  });

  it('accepts one validator and normalizes it through validators()', () => {
    const fieldNode = field('', required);

    expect(fieldNode.validators()).toEqual([required]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);

    fieldNode.setValidators(() => ({ kind: 'replacement' }));

    expect(fieldNode.validators()).toHaveLength(1);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'replacement' }]);
  });

  it('filters empty entries from the configured validator array', () => {
    const fieldNode = field('', [required, null, undefined]);

    expect(fieldNode.validators()).toEqual([required]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
  });

  it('conditionally applies an array of synchronous validators returned by one validator', () => {
    const enabled = signal(false);
    const tooShort = ({ value }: Context<string | null>) => value() === 'a' ? { kind: 'tooShort' } : null;
    const name = field('', { validators: () => enabled() ? [required, tooShort] : null });

    expect(name.errors()).toEqual([]);

    enabled.set(true);
    expect(name.errors()).toMatchObject([{ kind: 'required' }]);

    name.set('a');
    expect(name.errors()).toMatchObject([{ kind: 'tooShort' }]);

    enabled.set(false);
    expect(name.errors()).toEqual([]);
  });

  it('filters empty entries from a returned validator array', () => {
    const fieldNode = field('', () => [required, null, undefined]);

    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
  });

  it('exposes the current validators through validators()', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.validators()).toEqual([required]);
  });

  it('recomputes errors after setValidators', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.valid()).toBe(false);
    fieldNode.setValidators([]);
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
  });

  it('adds validators to a field declared without them', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('');
    expect(fieldNode.valid()).toBe(true);
    fieldNode.setValidators([required]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    expect(fieldNode.valid()).toBe(false);
  });

  it('applies a newly set validator to the current value', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('David', [required]);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.setValidators([({ value }: Context<string | null>) => (value() === 'David' ? { kind: 'required' } : null)]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
  });

  it('accepts validators and state in a second-argument options object', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', {
      validators: [required],
      disabled: true,
    });
    expect(fieldNode.validators()).toEqual([required]);
    expect(fieldNode.disabled()).toBe(true);
    expect(fieldNode.errors()).toEqual([]);
    fieldNode.enable();
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
  });

  it('accepts second-argument options without validators', () => {
    const fieldNode = field('David', { readonly: true });
    expect(fieldNode.validators()).toEqual([]);
    expect(fieldNode.readonly()).toBe(true);
  });

  it('exposes the same state through the root and through api', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.api.value()).toBe(fieldNode.value());
    expect(fieldNode.api.valid()).toBe(fieldNode.valid());
    expect(fieldNode.api.errors()).toEqual(fieldNode.errors());
    fieldNode.api.set('David');
    expect(fieldNode()).toBe('David');
    expect(fieldNode.dirty()).toBe(false);
  });

  it('patches like it sets, through api', () => {
    const fieldNode = field('David');
    fieldNode.api.patch('Ana');
    expect(fieldNode()).toBe('Ana');
    expect(fieldNode.dirty()).toBe(false);
  });

  it('starts untouched', () => {
    const fieldNode = field('David');
    expect(fieldNode.touched()).toBe(false);
    expect(fieldNode.untouched()).toBe(true);
  });

  it('becomes touched through markAsTouched', () => {
    const fieldNode = field('David');
    fieldNode.markAsTouched({ skipDescendants: true });
    expect(fieldNode.touched()).toBe(true);
    expect(fieldNode.untouched()).toBe(false);
  });

  it('goes back to untouched through markAsUntouched', () => {
    const fieldNode = field('David');
    fieldNode.markAsTouched();
    fieldNode.markAsUntouched();
    expect(fieldNode.touched()).toBe(false);
    expect(fieldNode.untouched()).toBe(true);
  });

  it('stays untouched when the value changes', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    expect(fieldNode.touched()).toBe(false);
  });

  it('keeps touched independent from validity', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.valid()).toBe(false);
    expect(fieldNode.touched()).toBe(false);
  });

  it('starts pristine', () => {
    const fieldNode = field('David');
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
  });

  it('stays pristine when the value is set programmatically', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
  });

  it('stays pristine when set programmatically to the same value', () => {
    const fieldNode = field('David');
    fieldNode.set('David');
    expect(fieldNode.dirty()).toBe(false);
  });

  it('preserves existing dirty state across programmatic updates', () => {
    const fieldNode = field('David');
    fieldNode.markAsDirty();

    fieldNode.set('Ana');

    expect(fieldNode.dirty()).toBe(true);
  });

  it('becomes dirty through markAsDirty', () => {
    const fieldNode = field('David');
    fieldNode.markAsDirty();
    expect(fieldNode.dirty()).toBe(true);
    expect(fieldNode.pristine()).toBe(false);
  });

  it('goes back to pristine through markAsPristine', () => {
    const fieldNode = field('David');
    fieldNode.setControlValue('Ana');
    fieldNode.markAsPristine();
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
  });

  it('keeps the value after markAsPristine', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.markAsPristine();
    expect(fieldNode()).toBe('Ana');
  });

  it('keeps dirty and touched independent', () => {
    const fieldNode = field('David');
    fieldNode.setControlValue('Ana');
    expect(fieldNode.dirty()).toBe(true);
    expect(fieldNode.touched()).toBe(false);
    fieldNode.markAsPristine();
    fieldNode.markAsTouched();
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.touched()).toBe(true);
  });

  it('starts visible and can be hidden and shown', () => {
    const fieldNode = field('David');
    expect(fieldNode.hidden()).toBe(false);
    expect(fieldNode.visible()).toBe(true);
    fieldNode.hide();
    expect(fieldNode.hidden()).toBe(true);
    expect(fieldNode.visible()).toBe(false);
    fieldNode.show();
    expect(fieldNode.hidden()).toBe(false);
    expect(fieldNode.visible()).toBe(true);
  });

  it('can start hidden through options', () => {
    const fieldNode = field('David', undefined, { hidden: true });
    expect(fieldNode.hidden()).toBe(true);
    expect(fieldNode.visible()).toBe(false);
  });

  it('skips validation while hidden', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.valid()).toBe(false);
    fieldNode.hide();
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.show();
    expect(fieldNode.valid()).toBe(false);
  });

  it('hides interaction state and restores it when shown', () => {
    const fieldNode = field('David');
    fieldNode.markAsTouched();
    fieldNode.markAsDirty();
    fieldNode.hide();
    expect(fieldNode.touched()).toBe(false);
    expect(fieldNode.dirty()).toBe(false);
    fieldNode.show();
    expect(fieldNode.touched()).toBe(true);
    expect(fieldNode.dirty()).toBe(true);
  });

  it('does not become touched while hidden', () => {
    const fieldNode = field('David', undefined, { hidden: true });
    fieldNode.markAsTouched();
    fieldNode.show();
    expect(fieldNode.touched()).toBe(false);
  });

  it('reacts to signal state sources', () => {
    const disabled = signal(false);
    const readonly = signal(false);
    const hidden = signal(false);
    const fieldNode = field('David', undefined, { disabled, readonly, hidden });
    disabled.set(true);
    expect(fieldNode.disabled()).toBe(true);
    disabled.set(false);
    readonly.set(true);
    expect(fieldNode.readonly()).toBe(true);
    readonly.set(false);
    hidden.set(true);
    expect(fieldNode.hidden()).toBe(true);
  });

  it('tracks signals read by state source functions', () => {
    const age = signal(17);
    const fieldNode = field('', undefined, { hidden: () => age() >= 18 });
    expect(fieldNode.hidden()).toBe(false);
    age.set(18);
    expect(fieldNode.hidden()).toBe(true);
  });

  it('does not let actions override an active reactive source', () => {
    const locked = signal(true);
    const fieldNode = field('David', undefined, {
      disabled: locked,
      readonly: locked,
      hidden: locked,
    });
    fieldNode.enable();
    fieldNode.markAsWritable();
    fieldNode.show();
    expect(fieldNode.disabled()).toBe(true);
    expect(fieldNode.readonly()).toBe(true);
    expect(fieldNode.hidden()).toBe(true);
    locked.set(false);
    expect(fieldNode.disabled()).toBe(false);
    expect(fieldNode.readonly()).toBe(false);
    expect(fieldNode.hidden()).toBe(false);
  });

  it('stays pristine when only the validators change', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('David');
    fieldNode.setValidators([required]);
    expect(fieldNode.dirty()).toBe(false);
  });

  it('keeps the value on reset with no argument', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.reset();
    expect(fieldNode()).toBe('Ana');
  });

  it('clears dirty and touched on reset', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.markAsTouched();
    fieldNode.reset();
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
    expect(fieldNode.touched()).toBe(false);
    expect(fieldNode.untouched()).toBe(true);
  });

  it('assigns the value passed to reset', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.reset('Leo');
    expect(fieldNode()).toBe('Leo');
  });

  it('stays pristine and untouched after reset with a value', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.markAsTouched();
    fieldNode.reset('Leo');
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.touched()).toBe(false);
  });

  it('resets to an empty string', () => {
    const fieldNode = field('David');
    fieldNode.reset('');
    expect(fieldNode()).toBe('');
  });

  it('resets to zero', () => {
    const fieldNode = field(23);
    fieldNode.reset(0);
    expect(fieldNode()).toBe(0);
  });

  it('revalidates after reset with a value', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('David', [required]);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.reset('');
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    expect(fieldNode.valid()).toBe(false);
  });

  it('keeps the validators after reset', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    fieldNode.reset('David');
    expect(fieldNode.validators()).toEqual([required]);
    expect(fieldNode.valid()).toBe(true);
  });

  it('starts enabled', () => {
    const fieldNode = field('David');
    expect(fieldNode.disabled()).toBe(false);
    expect(fieldNode.disabledReasons()).toEqual([]);
    expect(fieldNode.enabled()).toBe(true);
  });

  it('tracks imperative disabled reasons with an optional message', () => {
    const fieldNode = field('David');

    fieldNode.disable('Account is archived');
    expect(fieldNode.disabledReasons()).toEqual([{
      sourceNode: fieldNode,
      message: 'Account is archived',
    }]);

    fieldNode.disable();
    expect(fieldNode.disabledReasons()).toEqual([{ sourceNode: fieldNode }]);

    fieldNode.enable();
    expect(fieldNode.disabledReasons()).toEqual([]);
    expect(fieldNode.enabled()).toBe(true);
  });

  it('supports static and reactive disabled reasons in options', () => {
    const staticField = field('David', { disabled: 'Managed externally' });
    const condition = signal<boolean | string>(false);
    const reactiveField = field('Ana', { disabled: () => condition() });

    expect(staticField.disabledReasons()).toEqual([{
      sourceNode: staticField,
      message: 'Managed externally',
    }]);
    staticField.enable();
    expect(staticField.disabledReasons()).toEqual([]);

    condition.set('Awaiting approval');
    expect(reactiveField.disabledReasons()).toEqual([{
      sourceNode: reactiveField,
      message: 'Awaiting approval',
    }]);
    reactiveField.disable('Manually locked');
    expect(reactiveField.disabledReasons()).toEqual([
      { sourceNode: reactiveField, message: 'Manually locked' },
      { sourceNode: reactiveField, message: 'Awaiting approval' },
    ]);
    reactiveField.enable();
    expect(reactiveField.disabledReasons()).toEqual([{
      sourceNode: reactiveField,
      message: 'Awaiting approval',
    }]);
    condition.set(true);
    expect(reactiveField.disabledReasons()).toEqual([{ sourceNode: reactiveField }]);
    condition.set(false);
    expect(reactiveField.disabledReasons()).toEqual([]);
  });

  it('can start disabled through options', () => {
    const fieldNode = field('David', undefined, { disabled: true });
    expect(fieldNode.disabled()).toBe(true);
    expect(fieldNode.enabled()).toBe(false);
  });

  it('toggles between disable and enable', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    expect(fieldNode.disabled()).toBe(true);
    expect(fieldNode.enabled()).toBe(false);
    fieldNode.enable();
    expect(fieldNode.disabled()).toBe(false);
    expect(fieldNode.enabled()).toBe(true);
  });

  it('keeps its value when disabled', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    expect(fieldNode()).toBe('David');
    expect(fieldNode.value()).toBe('David');
  });

  it('still writes the value when disabled', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    fieldNode.set('Ana');
    expect(fieldNode()).toBe('Ana');
  });

  it('hides dirty state while disabled and restores it when enabled', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    fieldNode.set('Ana');
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
    fieldNode.markAsPristine();
    fieldNode.markAsDirty();
    expect(fieldNode.dirty()).toBe(false);
    fieldNode.enable();
    expect(fieldNode.dirty()).toBe(true);
  });

  it('hides touched state while disabled and restores it when enabled', () => {
    const fieldNode = field('David');
    fieldNode.markAsTouched();
    fieldNode.disable();
    expect(fieldNode.touched()).toBe(false);
    expect(fieldNode.untouched()).toBe(true);
    fieldNode.enable();
    expect(fieldNode.touched()).toBe(true);
  });

  it('does not become touched while disabled', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    fieldNode.markAsTouched();
    expect(fieldNode.touched()).toBe(false);
  });

  it('becomes touched again once enabled', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    fieldNode.markAsTouched();
    fieldNode.enable();
    fieldNode.markAsTouched();
    expect(fieldNode.touched()).toBe(true);
  });

  it('skips validation while disabled', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    fieldNode.disable();
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
    expect(fieldNode.invalid()).toBe(false);
  });

  it('validates again once enabled', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    fieldNode.disable();
    fieldNode.enable();
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    expect(fieldNode.valid()).toBe(false);
  });

  it('keeps its validators while disabled', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    fieldNode.disable();
    expect(fieldNode.validators()).toEqual([required]);
  });

  it('starts writable', () => {
    const fieldNode = field('David');
    expect(fieldNode.readonly()).toBe(false);
    expect(fieldNode.writable()).toBe(true);
  });

  it('can start readonly through options', () => {
    const fieldNode = field('David', undefined, { readonly: true });
    expect(fieldNode.readonly()).toBe(true);
    expect(fieldNode.writable()).toBe(false);
  });

  it('toggles between readonly and writable', () => {
    const fieldNode = field('David');
    fieldNode.markAsReadonly();
    expect(fieldNode.readonly()).toBe(true);
    fieldNode.markAsWritable();
    expect(fieldNode.readonly()).toBe(false);
  });

  it('preserves its value and underlying dirty state while readonly', () => {
    const fieldNode = field('David', undefined, { readonly: true });
    fieldNode.set('Ana');
    fieldNode.markAsDirty();
    expect(fieldNode()).toBe('Ana');
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
    fieldNode.markAsWritable();
    expect(fieldNode.dirty()).toBe(true);
  });

  it('does not become touched while readonly', () => {
    const fieldNode = field('David', undefined, { readonly: true });
    fieldNode.markAsTouched();
    expect(fieldNode.touched()).toBe(false);
    fieldNode.markAsWritable();
    expect(fieldNode.touched()).toBe(false);
  });

  it('hides touched state while readonly and restores it when writable', () => {
    const fieldNode = field('David');
    fieldNode.markAsTouched();
    fieldNode.markAsReadonly();
    expect(fieldNode.touched()).toBe(false);
    fieldNode.markAsWritable();
    expect(fieldNode.touched()).toBe(true);
  });

  it('skips validation while readonly and validates again when writable', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required], { readonly: true });
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.markAsWritable();
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    expect(fieldNode.valid()).toBe(false);
  });
});
