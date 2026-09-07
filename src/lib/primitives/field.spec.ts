import { describe, expect, it, vi } from 'vitest';
import { createWatch } from '@angular/core/primitives/signals';
import { computed, Injector, isSignal, signal, runInInjectionContext, type Signal } from '@angular/core';

import { form } from './form';
import { field } from './field';
import { max } from '../validation/validators/max';
import { min } from '../validation/validators/min';
import { url } from '../validation/validators/url';
import { validator } from '../validation/validator';
import { email } from '../validation/validators/email';
import { pattern } from '../validation/validators/pattern';
import { integer } from '../validation/validators/integer';
import { between } from '../validation/validators/between';
import { equalTo } from '../validation/validators/equal-to';
import { maxDate } from '../validation/validators/max-date';
import { minDate } from '../validation/validators/min-date';
import type { InternalNode, Node } from '../types/node.type';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import { createFormPrimitives } from './create-form-primitives';
import { maxLength } from '../validation/validators/max-length';
import { minLength } from '../validation/validators/min-length';
import { requiredIf } from '../validation/validators/required-if';
import { dateBetween } from '../validation/validators/date-between';
import { provideFormNodesConfig } from '../form-node/form-node-config';
import { configureGlobalValidatorMessages } from '../validation/validator-messages';

type Context<TValue> = { readonly value: Signal<TValue> };

it.each(['object', 'factory'])('inherits %s message providers without requiring a binding', (source) => {
  const message = signal('Parent message');
  const catalog = { required: () => message() };
  const parent = Injector.create({ providers: provideFormNodesConfig({
    validatorMessages: source === 'object' ? catalog : () => catalog,
  }) });
  const bindingsOnly = Injector.create({ parent, providers: provideFormNodesConfig({ classes: {} }) });
  const messagesOnly = Injector.create({ parent, providers: provideFormNodesConfig({
    validatorMessages: () => ({ required: 'Local message' }),
  }) });
  const node = runInInjectionContext(bindingsOnly, () => field('', [required]));
  const localNode = runInInjectionContext(messagesOnly, () => field('', [required]));
  expect(node.getError('required')?.message).toBe('Parent message');
  expect(localNode.getError('required')?.message).toBe('Local message');
  node.set('Marco');
  expect(node.errors()).toEqual([]);
  node.reset('');
  expect(node.getError('required')?.message).toBe('Parent message');
  message.set('Updated message');
  expect(node.getError('required')?.message).toBe('Updated message');
  expect(localNode.getError('required')?.message).toBe('Local message');
  expect(field('', [required]).getError('required')?.message).toBe('This field is required.');
  messagesOnly.destroy();
  bindingsOnly.destroy();
  parent.destroy();
});

it('resets provider messages with null while preserving reactive global and form-tree fallbacks', () => {
  const globalMessage = signal('Global required');
  const restore = configureGlobalValidatorMessages({ required: () => globalMessage() });
  const providerFactory = vi.fn(() => ({ required: 'Ancestor provider required' }));
  const parent = Injector.create({ providers: provideFormNodesConfig({ validatorMessages: providerFactory }) });
  const resetInjector = Injector.create({ parent, providers: provideFormNodesConfig({ validatorMessages: null }) });
  try {
    const node = runInInjectionContext(resetInjector, () => field('', [required]));
    expect(node.getError('required')?.message).toBe('Global required');
    expect(providerFactory).not.toHaveBeenCalled();
    globalMessage.set('Updated global required');
    expect(node.getError('required')?.message).toBe('Updated global required');
    node.set('Marco');
    expect(node.errors()).toEqual([]);
    node.reset('');
    expect(node.getError('required')?.message).toBe('Updated global required');
    const parentForm = runInInjectionContext(parent, () => form({ branch: node }));
    expect(node.getError('required')?.message).toBe('Ancestor provider required');
    expect(providerFactory).toHaveBeenCalledTimes(1);
    form({ parentForm }, { validatorMessages: { required: 'Form-tree required' } });
    expect(node.getError('required')?.message).toBe('Form-tree required');
  } finally {
    restore();
    resetInjector.destroy();
    parent.destroy();
  }
});

describe('resolved validator queries', () => {
  it('shares synchronous evaluation, tracks branches, and preserves order and duplicates', () => {
    const enabled = signal(true);
    const leaf = vi.fn(() => ({ kind: 'policy' }));
    const alternate = vi.fn(() => null);
    const composed = vi.fn(() => enabled() ? [leaf, leaf] : alternate);
    const node = field('Marco', [composed]);
    expect(isSignal(node.validators)).toBe(true);
    expect(node.validators()).toEqual([composed]);
    expect(node.validators({ resolve: false })).toEqual([composed]);
    expect(node.validators({})).toEqual([composed]);
    expect(node.hasValidator(composed)).toBe(true);
    expect(composed).not.toHaveBeenCalled();
    const present = computed(() => node.hasValidator(leaf, { resolve: true }));
    expect(present()).toBe(true);
    const resolved = node.validators({ resolve: true });
    expect(resolved).toEqual([leaf, leaf]);
    expect(node.validators({ resolve: true })).toBe(resolved);
    expect(node.hasValidator(composed, { resolve: true })).toBe(false);
    expect(node.errors()).toHaveLength(2);
    expect(composed).toHaveBeenCalledTimes(1);
    expect(leaf).toHaveBeenCalledTimes(2);
    enabled.set(false);
    expect(present()).toBe(false);
    expect(node.validators({ resolve: true })).toEqual([alternate]);
    expect(node.errors()).toEqual([]);
    expect(composed).toHaveBeenCalledTimes(2);
    expect(alternate).toHaveBeenCalledTimes(1);
    enabled.set(true);
    expect(node.errors()).toHaveLength(2);
    expect(present()).toBe(true);
    expect(node.validators({ resolve: true })).toEqual([leaf, leaf]);
    expect(composed).toHaveBeenCalledTimes(3);
    expect(leaf).toHaveBeenCalledTimes(4);
    node.setValidators(alternate);
    expect(present()).toBe(false);
    expect(node.validators()).toEqual([alternate]);
    expect(node.validators({ resolve: true })).toEqual([alternate]);
    expect(node.dirty()).toBe(false);
    expect(node.touched()).toBe(false);
  });

  it('keeps successful leaves and opaque wrappers instead of inferring their internal calls', () => {
    const leaf = vi.fn(() => null);
    const wrapper = () => leaf();
    const composed = () => [wrapper, () => [], () => undefined];
    const node = field('Marco', [composed]);
    const resolved = node.validators({ resolve: true });
    expect(resolved).toHaveLength(3);
    expect(resolved[0]).toBe(wrapper);
    expect(node.hasValidator(leaf, { resolve: true })).toBe(false);
    expect(node.hasValidator(wrapper, { resolve: true })).toBe(true);
    expect(leaf).toHaveBeenCalledTimes(1);
    expect(node.errors()).toEqual([]);
  });

  it.each(['disabled', 'hidden', 'readonly'] as const)('resolves a %s node without changing suppressed errors or interaction state', (state) => {
    const leaf = vi.fn(() => ({ kind: 'policy' }));
    const composed = vi.fn(() => leaf);
    const node = field('Marco', [composed], { [state]: true });
    expect(node.errors()).toEqual([]);
    expect(node.validators()).toEqual([composed]);
    expect(composed).not.toHaveBeenCalled();
    expect(node.validators({ resolve: true })).toEqual([leaf]);
    expect(node.hasValidator(leaf, { resolve: true })).toBe(true);
    expect(composed).toHaveBeenCalledTimes(1);
    expect(node.errors()).toEqual([]);
    expect(node.valid()).toBe(true);
    expect(node.dirty()).toBe(false);
    expect(node.touched()).toBe(false);
    if (state === 'disabled') node.enable();
    else if (state === 'hidden') node.show();
    else node.markAsWritable();
    expect(node.errors()).toHaveLength(1);
    expect(node.validators({ resolve: true })).toEqual([leaf]);
    expect(composed).toHaveBeenCalledTimes(2);
  });

  it('does not start registered async work when explicitly resolving a disabled node', () => {
    const run = vi.fn(async () => null);
    const remote = asyncValidator(run);
    const node = field('Marco', [remote], { disabled: true });
    expect(node.validators({ resolve: true })).toEqual([remote]);
    expect(node.hasValidator(remote, { resolve: true })).toBe(true);
    expect(run).not.toHaveBeenCalled();
    expect(node.pending()).toBe(false);
    expect(node.errors()).toEqual([]);
  });

  it('lists async references without starting or restarting asynchronous validation', async () => {
    const run = vi.fn(async () => null);
    const remote = asyncValidator(run);
    const leaf = () => null;
    const composed = () => leaf;
    const node = field('Marco', [composed, remote]);
    const previousPending = node.pending();
    const previousCalls = run.mock.calls.length;
    expect(node.validators({ resolve: true })).toEqual([leaf, remote]);
    expect(node.hasValidator(remote, { resolve: true })).toBe(true);
    expect(node.hasValidator(remote)).toBe(true);
    expect(run).toHaveBeenCalledTimes(previousCalls);
    expect(node.pending()).toBe(previousPending);
    await vi.waitFor(() => expect(node.pending()).toBe(false));
    const callsAfterCompletion = run.mock.calls.length;
    expect(callsAfterCompletion).toBeGreaterThanOrEqual(previousCalls);
    expect(callsAfterCompletion).toBeGreaterThan(0);
    expect(node.validators({ resolve: true })).toEqual([leaf, remote]);
    expect(run).toHaveBeenCalledTimes(callsAfterCompletion);
  });
});

describe('field', () => {
  it('reactively queries own errors and directly registered validator identities', () => {
    const blocked = signal(true);
    const check = vi.fn(() => blocked() ? { kind: 'blocked' } : null);
    const node = field('Marco', [check]);
    const present = computed(() => node.hasValidator(check));
    expect(present()).toBe(true);
    expect(check).not.toHaveBeenCalled();
    const error = computed(() => node.hasError('blocked'));
    expect(error()).toBe(true);
    expect(node.hasError('missing')).toBe(false);
    expect(check).toHaveBeenCalledTimes(1);
    blocked.set(false);
    expect(error()).toBe(false);
    expect(present()).toBe(true);
    expect(check).toHaveBeenCalledTimes(2);
    node.setValidators([]);
    expect(present()).toBe(false);
    expect(error()).toBe(false);
    node.setValidators(check);
    expect(present()).toBe(true);
    blocked.set(true);
    node.disable();
    expect(error()).toBe(false);
    expect(present()).toBe(true);
    node.enable();
    expect(error()).toBe(true);
    expect(node.$api.hasError('blocked')).toBe(true);
    expect(node.$api.hasValidator(check)).toBe(true);
    const composer = () => check;
    node.setValidators(composer);
    expect(node.hasValidator(composer)).toBe(true);
    expect(node.hasValidator(check)).toBe(false);
    expect(error()).toBe(true);
  });

  it('queries async registration independently of pending and completed errors', async () => {
    let finish!: (result: { kind: string }) => void;
    const run = vi.fn(() => new Promise<{ kind: string }>((resolve) => { finish = resolve; }));
    const check = asyncValidator(run);
    const node = field('Marco', [check]);
    expect(node.hasValidator(check)).toBe(true);
    const error = computed(() => node.hasError('remote'));
    expect(error()).toBe(false);
    expect(node.pending()).toBe(true);
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    finish({ kind: 'remote' });
    await vi.waitFor(() => expect(error()).toBe(true));
    expect(node.pending()).toBe(false);
    expect(node.hasValidator(check)).toBe(true);
    node.setValidators([]);
    expect(node.hasValidator(check)).toBe(false);
    await vi.waitFor(() => expect(error()).toBe(false));
  });

  it('exposes a real signal with committed-value tracking and configured equality', () => {
    const name = field.strict('Marco', { debounce: 'blur', equal: (a, b) => a.toLowerCase() === b.toLowerCase() });
    const observe = <T>(source: Signal<T>) => computed(() => source());
    const observed = observe(name);
    const read = vi.fn(() => observed());
    const value = computed(read);
    expect(isSignal(name)).toBe(true);
    expect(value()).toBe('Marco');
    name.setControlValue('Lia');
    expect(value()).toBe('Marco');
    expect(read).toHaveBeenCalledTimes(1);
    name.flush();
    expect(value()).toBe('Lia');
    expect(read).toHaveBeenCalledTimes(2);
    name.set('LIA');
    expect(value()).toBe('Lia');
    expect(read).toHaveBeenCalledTimes(2);
    name.reset('Marco');
    expect(value()).toBe('Marco');
    expect(read).toHaveBeenCalledTimes(3);
  });

  it.each([false, true])('preserves async work when a computed dependency compares equal (injector: %s)', async (withInjector) => {
    const injector = withInjector ? Injector.create({ providers: [] }) : undefined;
    const source = signal('Marco');
    const selected = computed(source, { equal: (a, b) => a.toLowerCase() === b.toLowerCase() });
    const runs: { abortSignal: AbortSignal; finish: (result: null) => void }[] = [];
    const target = field('', {
      ...(injector ? { injector } : {}),
      validators: asyncValidator<string | null>((ctx) => {
        selected();
        return new Promise<null>((finish) => { runs.push({ abortSignal: ctx.abortSignal, finish }); });
      }),
    });
    expect(target.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(runs).toHaveLength(1);
    source.set('MARCO');
    await Promise.resolve();
    await Promise.resolve();
    expect(runs).toHaveLength(1);
    expect(runs[0]!.abortSignal.aborted).toBe(false);
    source.set('Lia');
    await Promise.resolve();
    await Promise.resolve();
    expect(runs).toHaveLength(2);
    expect(runs[0]!.abortSignal.aborted).toBe(true);
    runs[1]!.finish(null);
    await Promise.resolve();
    await Promise.resolve();
    expect(target.pending()).toBe(false);
    expect(target.valid()).toBe(true);
    injector?.destroy();
  });

  it.each(['shallow', 'deep'] as const)('retains equal exposed values with %s equality while preserving control input', (equal) => {
    const initial = { name: 'Marco' };
    const validate = vi.fn(({ value }: Context<unknown>) => { value(); return null; });
    const name = field(initial, [validate], { equal });
    const read = vi.fn(() => name());
    const observed = computed(read);
    expect(observed()).toBe(initial);
    expect(name.valid()).toBe(true);
    const equivalent = { name: 'Marco' };
    name.set(equivalent);
    expect(name()).toBe(initial);
    expect(name.value()).toBe(initial);
    expect(name.controlValue()).toBe(equivalent);
    expect(observed()).toBe(initial);
    expect(name.valid()).toBe(true);
    expect(read).toHaveBeenCalledOnce();
    expect(validate).toHaveBeenCalledOnce();
    name.update(() => ({ name: 'Lia' }));
    expect(observed()).toEqual({ name: 'Lia' });
    expect(name.valid()).toBe(true);
    expect(validate).toHaveBeenCalledTimes(2);
    name.set(null);
    expect(name()).toBeNull();
  });

  it('distinguishes nested shallow values and retains deep dates and collections', () => {
    const initial = { values: new Map([['date', new Date(0)]]) };
    const shallow = field(initial, { equal: 'shallow' });
    const deep = field(initial, { equal: 'deep' });
    expect(shallow()).toBe(initial);
    expect(deep()).toBe(initial);
    const next = { values: new Map([['date', new Date(0)]]) };
    shallow.set(next);
    deep.set(next);
    expect(shallow()).toBe(next);
    expect(deep()).toBe(initial);
  });

  it('initializes custom equality without comparing temporary values', () => {
    const unrelated = signal(0);
    const equal = vi.fn((a: string, b: string) => {
      unrelated();
      return a.toLowerCase() === b.toLowerCase();
    });
    const name = field.strict('Marco', { equal });
    expect(name()).toBe('Marco');
    expect(equal).not.toHaveBeenCalled();
    const create = vi.fn(() => field.strict('Marco', { equal }));
    const model = computed(create);
    expect(model()()).toBe('Marco');
    expect(equal).not.toHaveBeenCalled();
    name.set('MARCO');
    expect(equal).not.toHaveBeenCalled();
    expect(name()).toBe('Marco');
    expect(equal).toHaveBeenCalledExactlyOnceWith('Marco', 'MARCO');
    unrelated.set(1);
    expect(model()()).toBe('Marco');
    expect(create).toHaveBeenCalledOnce();
    const alwaysDifferent = field.strict('a', { equal: () => false });
    const validate = vi.fn(({ value }: Context<unknown>) => { value(); return null; });
    alwaysDifferent.setValidators([validate]);
    alwaysDifferent.valid();
    alwaysDifferent.set('a');
    alwaysDifferent.valid();
    expect(validate).toHaveBeenCalledOnce();
    alwaysDifferent.set('b');
    alwaysDifferent.valid();
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('does not subscribe a reactive writer to signals read by its comparator', () => {
    const next = signal('MARCO');
    const unrelated = signal(0);
    const name = field.strict('Marco', { equal: (a, b) => {
      unrelated();
      return a.toLowerCase() === b.toLowerCase();
    } });
    const schedule = vi.fn();
    expect(name()).toBe('Marco');
    const writer = createWatch(() => name.set(next()), schedule, true);
    try {
      writer.run();
      expect(name()).toBe('Marco');
      unrelated.set(1);
      expect(schedule).not.toHaveBeenCalled();
      next.set('Lia');
      expect(schedule).toHaveBeenCalledOnce();
      writer.run();
      expect(name()).toBe('Lia');
    } finally {
      writer.destroy();
    }
  });

  it.each([0, 'blur', 100] as const)('commits equivalent control input independently of exposed equality with debounce %s', (debounce) => {
    const initial = { name: 'Marco' };
    const name = field(initial, { equal: 'deep', debounce });
    expect(name()).toBe(initial);
    name.setControlValue({ name: 'Lia' });
    const next = { name: 'Marco' };
    name.setControlValue(next);
    expect(name.dirty()).toBe(true);
    expect(name.debouncing()).toBe(debounce !== 0);
    expect(name()).toBe(initial);
    name.markAsTouched();
    expect(name.debouncing()).toBe(false);
    expect(name.touched()).toBe(true);
    name.reset();
    expect(name.controlValue()).toBe(next);
    const resetValue = { name: 'Marco' };
    name.reset(resetValue);
    expect(name.touched()).toBe(false);
    expect(name.pristine()).toBe(true);
    expect(name.controlValue()).toBe(resetValue);
    expect(name()).toBe(initial);
  });

  it('reports comparator errors on exposed reads while preserving committed writes and recovery', () => {
    const failure = new Error('Comparison failed');
    let shouldThrow = true;
    const name = field.strict('Marco', { equal: (a, b) => {
      if (shouldThrow) throw failure;
      return a === b;
    } });
    expect(name()).toBe('Marco');
    name.set('Lia');
    expect(name.controlValue()).toBe('Lia');
    expect(() => name()).toThrow(failure);
    name.reset();
    expect(name.controlValue()).toBe('Lia');
    expect(() => name.value()).toThrow(failure);
    shouldThrow = false;
    name.set('Ada');
    expect(name()).toBe('Ada');
  });

  it('replaces custom debounce work for publicly equivalent input and cancels only on identical committed input', async () => {
    const runs: { abortSignal: AbortSignal; finish: () => void }[] = [];
    const debounce = vi.fn((signal: AbortSignal) => {
      return new Promise<void>((finish) => { runs.push({ abortSignal: signal, finish }); });
    });
    const name = field.strict('Marco', { equal: (a, b) => a.toLowerCase() === b.toLowerCase(), debounce });
    expect(name()).toBe('Marco');
    name.setControlValue('Lia');
    expect(name.debouncing()).toBe(true);
    name.setControlValue('MARCO');
    expect(runs[0]!.abortSignal.aborted).toBe(true);
    expect(name.debouncing()).toBe(true);
    expect(debounce).toHaveBeenCalledTimes(2);
    runs[0]!.finish();
    await Promise.resolve();
    expect(name.debouncing()).toBe(true);
    runs[1]!.finish();
    await Promise.resolve();
    expect(name.debouncing()).toBe(false);
    expect(name()).toBe('Marco');
    expect(name.controlValue()).toBe('MARCO');
    expect(name.dirty()).toBe(true);
    name.setControlValue('Ada');
    name.setControlValue('MARCO');
    expect(runs[2]!.abortSignal.aborted).toBe(true);
    expect(debounce).toHaveBeenCalledTimes(3);
    expect(name.debouncing()).toBe(false);
    runs[2]!.finish();
    await Promise.resolve();
    name.reset();
    expect(name.controlValue()).toBe('MARCO');
  });

  it('captures equality at construction and accepts legitimate undefined values', () => {
    const equal = vi.fn((a: number | null | undefined, b: number | null | undefined) => a === b);
    const options = { equal };
    const value = field<number>(undefined, options);
    expect(value()).toBeUndefined();
    expect(equal).not.toHaveBeenCalled();
    options.equal = vi.fn(() => true);
    value.set(1);
    expect(value()).toBe(1);
    expect(equal).toHaveBeenCalledExactlyOnceWith(undefined, 1);
    value.set(null);
    expect(value()).toBeNull();
  });

  it('compares lazily against the last exposed value and coalesces intermediate writes', () => {
    const equal = vi.fn((a: string, b: string) => a.toLowerCase() === b.toLowerCase());
    const name = field.strict('Marco', { equal });
    name.set('MARCO');
    expect(name()).toBe('MARCO');
    expect(equal).not.toHaveBeenCalled();
    name.set('Lia');
    name.set('marco');
    expect(name()).toBe('MARCO');
    expect(equal).toHaveBeenCalledExactlyOnceWith('MARCO', 'marco');
    const updater = vi.fn(value => `${value}!`);
    name.update(updater);
    expect(updater).toHaveBeenCalledExactlyOnceWith('MARCO');
    expect(name()).toBe('MARCO!');
  });

  it('keeps a computed field instance when validators or parent ownership change', () => {
    const initialName = signal('Marco');
    const create = vi.fn(() => field(initialName(), [required]));
    const model = computed(create);
    const name = model();
    expect(name.valid()).toBe(true);
    name.setValidators([]);
    const profile = form({ name });
    name.set('');
    expect(name.parent()).toBe(profile);
    expect(model()).toBe(name);
    expect(create).toHaveBeenCalledOnce();

    name.setValidators([required]);
    expect(profile.invalid()).toBe(true);
    expect(model()).toBe(name);
    initialName.set('Noa');
    expect(model()()).toBe('Noa');
    expect(model()).not.toBe(name);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it.each<{ label: string; initial: unknown }>([
    { label: 'string', initial: 'ready' },
    { label: 'zero', initial: 0 },
    { label: 'negative zero', initial: -0 },
    { label: 'NaN', initial: NaN },
    { label: 'false', initial: false },
    { label: 'null', initial: null },
    { label: 'undefined', initial: undefined },
    { label: 'object', initial: { name: 'ready' } },
    { label: 'array', initial: [1, 2] },
    { label: 'function', initial: () => 'ready' },
  ])('exposes the supplied $label value on first use and after discarding a buffered edit', ({ initial }) => {
    const observed: unknown[][] = [];
    const model = computed(() => {
      return field<unknown>(initial, ({ value, node }) => {
        observed.push([value(), node().controlValue()]);
        return null;
      }, { debounce: 'blur' });
    });
    const node = model();
    expect(node()).toBe(initial);
    expect(node.controlValue()).toBe(initial);
    expect(observed).toEqual([]);
    expect(node.valid()).toBe(true);
    expect(observed).toHaveLength(1);
    expect(observed[0]![0]).toBe(initial);
    expect(observed[0]![1]).toBe(initial);

    node.setControlValue('draft');
    expect(node()).toBe(initial);
    expect(node.controlValue()).toBe('draft');
    expect(node.debouncing()).toBe(true);
    node.reset();
    expect(node()).toBe(initial);
    expect(node.controlValue()).toBe(initial);
    expect(node.debouncing()).toBe(false);
    expect(node.pristine()).toBe(true);
    expect(node.untouched()).toBe(true);
  });

  it('initializes validators before exposing metadata and the first synchronous result', () => {
    const observed: Array<string | null> = [];
    const validate = vi.fn(({ value }: Context<string | null>) => {
      observed.push(value());
      return null;
    });
    const length = minLength(3);
    const model = computed(() => field.strict('x', [length, validate]));
    const node = model();
    expect(node()).toBe('x');
    expect(node.controlValue()).toBe('x');
    expect(node.validators()).toEqual([length, validate]);
    expect(validate).not.toHaveBeenCalled();

    expect(node.minLength()).toBe(3);
    expect(node.errors()).toMatchObject([{ kind: 'minLength' }]);
    expect(observed).toEqual(['x']);
    expect(validate).toHaveBeenCalledOnce();
    expect(node.invalid()).toBe(true);
    expect(node.pristine()).toBe(true);
  });

  it.each([false, true])('initializes an async validator before its first run inside computed (array=%s)', async (asArray) => {
    const initialValue = { name: 'initial' };
    const observed: Array<typeof initialValue | null> = [];
    const validate = vi.fn(async ({ value }: Context<typeof initialValue | null>) => {
      observed.push(value());
      return { kind: 'unavailable' };
    });
    const check = asyncValidator(validate);
    const model = computed(() => field(initialValue, asArray ? [check] : check));
    const node = model();
    expect(node()).toBe(initialValue);
    expect(node.controlValue()).toBe(initialValue);
    expect(node.validators()).toEqual([check]);
    expect(node.pending()).toBe(true);
    expect(node.validationStatus()).toBe('unknown');
    expect(validate).not.toHaveBeenCalled();

    await Promise.resolve();
    await Promise.resolve();

    expect(observed).toHaveLength(1);
    expect(observed[0]).toBe(initialValue);
    expect(validate).toHaveBeenCalledOnce();
    expect(node.pending()).toBe(false);
    expect(node.errors()).toMatchObject([{ kind: 'unavailable' }]);
    expect(node.validationStatus()).toBe('invalid');
    expect(node.pristine()).toBe(true);
  });

  it('creates a field inside computed and preserves the surrounding dependencies', () => {
    const initialValue = signal('initial');
    const create = vi.fn(() => {
      const node = field(initialValue());
      return node;
    });
    const model = computed(create);
    const node = model();
    expect(node()).toBe('initial');
    expect(node.disabled()).toBe(false);
    expect(node.readonly()).toBe(false);
    expect(node.hidden()).toBe(false);
    expect(create).toHaveBeenCalledOnce();

    initialValue.set('next');
    expect(model()()).toBe('next');
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('preserves dependencies read by initial state option getters', () => {
    const disabled = signal(false);
    const create = vi.fn(() => field('initial', { get disabled() { return disabled(); } }));
    const model = computed(create);
    const initial = model();
    expect(initial.disabled()).toBe(false);
    expect(create).toHaveBeenCalledOnce();

    disabled.set(true);
    const next = model();
    expect(next).not.toBe(initial);
    expect(next.disabled()).toBe(true);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it.each([true, 'Locked', ''])('applies initial availability before validation inside computed: %j', (disabled) => {
    const validate = vi.fn(() => ({ kind: 'required' }));
    const model = computed(() => field('', [validate], { disabled, readonly: true, hidden: true }));
    const node = model();
    expect(node.disabled()).toBe(true);
    expect(node.disabledReasons()).toEqual([
      typeof disabled === 'string' ? { sourceNode: node, message: disabled } : { sourceNode: node },
    ]);
    expect(node.readonly()).toBe(true);
    expect(node.hidden()).toBe(true);
    expect(node.valid()).toBe(true);
    expect(validate).not.toHaveBeenCalled();

    node.enable();
    expect(node.disabled()).toBe(false);
    expect(node.disabledReasons()).toEqual([]);
    expect(node.valid()).toBe(true);
    node.markAsWritable();
    expect(node.readonly()).toBe(false);
    expect(node.valid()).toBe(true);
    expect(validate).not.toHaveBeenCalled();
    node.show();
    expect(node.hidden()).toBe(false);
    expect(node.errors()).toMatchObject([{ kind: 'required' }]);
    expect(validate).toHaveBeenCalledOnce();
    expect(node.pristine()).toBe(true);
    expect(node.untouched()).toBe(true);
    expect(model()).toBe(node);
  });

  it('keeps availability sources reactive without recreating a computed field', () => {
    const locked = signal(true);
    const disabled = vi.fn(() => locked());
    const readonly = vi.fn(() => locked());
    const hidden = vi.fn(() => locked());
    const create = vi.fn(() => field('', [required], { disabled, readonly, hidden }));
    const model = computed(create);
    const node = model();
    expect(disabled).not.toHaveBeenCalled();
    expect(readonly).not.toHaveBeenCalled();
    expect(hidden).not.toHaveBeenCalled();
    expect(node.disabled()).toBe(true);
    expect(node.readonly()).toBe(true);
    expect(node.hidden()).toBe(true);
    expect(node.valid()).toBe(true);

    node.enable();
    node.markAsWritable();
    node.show();
    expect(node.disabled()).toBe(true);
    expect(node.readonly()).toBe(true);
    expect(node.hidden()).toBe(true);
    locked.set(false);
    expect(model()).toBe(node);
    expect(create).toHaveBeenCalledOnce();
    expect(node.disabled()).toBe(false);
    expect(node.readonly()).toBe(false);
    expect(node.hidden()).toBe(false);
    expect(node.invalid()).toBe(true);
    expect(disabled).toHaveBeenCalledTimes(2);
    expect(readonly).toHaveBeenCalledTimes(2);
    expect(hidden).toHaveBeenCalledTimes(2);
  });

  it('tracks interaction state read through validator node aliases', () => {
    const validate = vi.fn((ctx: { node: Signal<Node & { touched: Signal<boolean>; dirty: Signal<boolean> }>; field: Signal<Node & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
      return ctx.node().touched() && ctx.field().dirty() ? { kind: 'edited' } : null;
    });
    const model = field('initial', { validators: validate });

    expect(model.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledTimes(1);
    model.markAsTouched();
    expect(model.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledTimes(2);
    model.markAsDirty();
    expect(model.errors()).toMatchObject([{ kind: 'edited' }]);
    expect(validate).toHaveBeenCalledTimes(3);
    model.markAsPristine();
    expect(model.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledTimes(4);
  });

  it('tracks node state in async conditions and params and exposes it to error handlers', async () => {
    const params = vi.fn((ctx: { node: Signal<Node & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
      return ctx.node().dirty();
    });
    const states: boolean[] = [];
    const onError = vi.fn((_error: unknown, ctx: { node: Signal<Node & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
      return ctx.node().dirty() ? { kind: 'edited' } : null;
    });
    const validate = vi.fn(async (ctx: { params: boolean; field: Signal<Node & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
      states.push(ctx.field().dirty());
      throw new Error('Unavailable');
    });
    const validators = asyncValidator({
      when: ctx => ctx.node().touched(),
      params,
      validate,
      onError,
    });
    const model = field('initial', { validators });

    expect(model.valid()).toBe(true);
    expect(params).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    model.markAsTouched();
    await Promise.resolve();
    expect(model.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(model.valid()).toBe(true);
    expect(params).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);

    model.markAsDirty();
    await Promise.resolve();
    expect(model.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(model.errors()).toMatchObject([{ kind: 'edited' }]);
    expect(params).toHaveBeenCalledTimes(2);
    expect(validate).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(2);
    expect(states).toEqual([false, true]);

    model.markAsUntouched();
    await Promise.resolve();
    expect(model.pending()).toBe(false);
    expect(model.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('exposes a stable readonly validator field signal independently of the node value', () => {
    const references: Signal<Node>[] = [];
    const validators = (context: { field: Signal<Node>; node: Signal<Node> }) => {
      references.push(context.field);
      expect(context.node).toBe(context.field);
      expect(isSignal(context.field)).toBe(true);
      expect(Object.hasOwn(context.field, 'set')).toBe(false);
      return null;
    };
    const node = field('initial', { validators });
    expect(node.errors()).toEqual([]);
    const readIdentity = vi.fn(() => references[0]!());
    const identity = computed(readIdentity);
    const readValue = vi.fn(() => references[0]!()());
    const value = computed(readValue);
    expect(identity()).toBe(node);
    expect(value()).toEqual(node());

    node.set('updated');
    expect(node.errors()).toEqual([]);
    expect(references.at(-1)).toBe(references[0]);
    expect(identity()).toBe(node);
    expect(value()).toEqual('updated');
    expect(readIdentity).toHaveBeenCalledTimes(1);
    expect(readValue).toHaveBeenCalledTimes(2);

    const owner = form({ fixed: field(true) });
    owner.add('node', node);
    expect(identity()).toBe(node);
    owner.remove('node');
    expect(identity()).toBe(node);
    expect(readIdentity).toHaveBeenCalledTimes(1);
  });

  it('tracks async validator field identity separately from reading its node value', async () => {
    const readValue = signal(false);
    const references: Signal<Node>[] = [];
    const params = vi.fn((context: { field: Signal<Node>; node: Signal<Node> }) => {
      references.push(context.field);
      expect(context.node).toBe(context.field);
      return readValue() ? context.field()() : context.field();
    });
    const validate = vi.fn(async () => null);
    const validators = asyncValidator({ params, validate });
    const node = field('initial', { validators });
    expect(node.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(params).toHaveBeenCalledTimes(1);
    expect(node.pending()).toBe(false);
    expect(references[0]!()).toBe(node);

    node.set('updated');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(params).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(node.valid()).toBe(true);

    readValue.set(true);
    await Promise.resolve();
    expect(node.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(params).toHaveBeenCalledTimes(2);
    expect(validate).toHaveBeenCalledTimes(2);
    expect(node.pending()).toBe(false);

    node.set('final');
    await Promise.resolve();
    expect(node.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(params).toHaveBeenCalledTimes(3);
    expect(validate).toHaveBeenCalledTimes(3);
    expect(references.every(reference => Object.is(reference, references[0]))).toBe(true);
    expect(node.valid()).toBe(true);
  });

  it('creates explicit nullable and non-nullable fields through short factory methods', () => {
    const nonNullableName = field.strict('Marco');
    const hiddenNonNullableName = field.strict('Lia', { hidden: true });
    const validatedNonNullableName = field.strict('Ada', [required]);
    const nullableName = field.nullable('Marco');
    const hiddenNullableName = field.nullable('Lia', { hidden: true });
    const validatedNullableName = field.nullable('Ada', [required], { readonly: true });
    const emptyNullableName = field.nullable<string>();

    nullableName.set(null);

    expect(nonNullableName()).toBe('Marco');
    expect(hiddenNonNullableName.hidden()).toBe(true);
    expect(validatedNonNullableName.valid()).toBe(true);
    expect(nullableName()).toBeNull();
    expect(hiddenNullableName.hidden()).toBe(true);
    expect(validatedNullableName.readonly()).toBe(true);
    expect(emptyNullableName()).toBeNull();
  });

  it('exposes explicit field nullability overrides on configured primitives', () => {
    const nullableFields = createFormPrimitives({ nullable: true }).field;
    const nonNullableFields = createFormPrimitives({ nullable: false }).field;
    const forcedNonNullable = nullableFields.strict('Marco');
    const forcedNullable = nonNullableFields.nullable('Lia');
    const emptyNullable = nullableFields.nullable<string>();
    const validatedNonNullable = nullableFields.strict('', [required]);
    const validatedNullable = nonNullableFields.nullable('', [required]);

    forcedNullable.set(null);

    expect(forcedNonNullable()).toBe('Marco');
    expect(forcedNullable()).toBeNull();
    expect(emptyNullable()).toBeNull();
    expect(validatedNonNullable.invalid()).toBe(true);
    expect(validatedNullable.invalid()).toBe(true);
  });

  it('defaults createFormPrimitives and its nullable option to nullable fields', () => {
    const defaultField = createFormPrimitives().field('Marco');
    const emptyOptionsField = createFormPrimitives({}).field('Lia');

    expect(defaultField()).toBe('Marco');
    expect(emptyOptionsField()).toBe('Lia');
  });

  it('uses reactive validator message defaults from configured primitives', () => {
    const language = signal<'en' | 'es'>('en');
    const { field: configuredField } = createFormPrimitives({
      validatorMessages: () => ({
        required: () => language() === 'en' ? 'Enter a value.' : 'Introduce un valor.',
      }),
    });
    const name = configuredField('', [required]);

    expect(name.getError('required')?.message).toBe('Enter a value.');

    language.set('es');

    expect(name.getError('required')?.message).toBe('Introduce un valor.');
  });

  it('applies configured injector inheritance defaults and permits local overrides', async () => {
    const dependency = signal('initial');
    const blockedValidation = vi.fn(async () => {
      dependency();
      return null;
    });
    const inheritedValidation = vi.fn(async () => {
      dependency();
      return null;
    });
    const { field: configuredField } = createFormPrimitives({ inheritInjector: false });
    const blocked = configuredField('', [asyncValidator(blockedValidation)]);
    const inherited = configuredField('', [asyncValidator(inheritedValidation)], { inheritInjector: true });
    const injector = Injector.create({ providers: [] });
    form({ blocked, inherited }, { injector });

    await Promise.resolve();
    await Promise.resolve();
    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(blockedValidation).toHaveBeenCalledTimes(2);
    expect(inheritedValidation).toHaveBeenCalledOnce();
  });

  it('creates configured fields without an injection context', () => {
    const { field: configuredField } = createFormPrimitives({ nullable: false });
    const name = configuredField('Marco');
    const nickname = configuredField.nullable('Marco');
    const hiddenName = configuredField('Marco', { hidden: true });
    const validatedName = configuredField.strict('Marco', []);
    const emptyName = configuredField(null);
    const hiddenEmptyName = configuredField(null, { hidden: true });

    expect(name()).toBe('Marco');
    expect(name.nodeType()).toBe('field');
    expect(nickname()).toBe('Marco');
    expect(hiddenName.hidden()).toBe(true);
    expect(validatedName()).toBe('Marco');
    expect(emptyName()).toBeNull();
    expect(hiddenEmptyName.hidden()).toBe(true);
  });

  it('exposes its public node type', () => {
    const name = field('Marco');

    expect(name.nodeType()).toBe('field');
    expect(name.$api.nodeType()).toBe('field');
  });

  it('distinguishes an omitted initial value from an explicit undefined value', () => {
    const omitted = field();
    const fieldNode = field(undefined);
    const typedField = field<string>(undefined);
    const explicitNullable = field.nullable<string>(undefined);
    const { field: configuredFactory } = createFormPrimitives({ nullable: false });
    const configuredOmitted = configuredFactory();
    const configuredNullableOmitted = configuredFactory.nullable<string>();
    const configuredField = configuredFactory(undefined);

    expect(omitted()).toBeNull();
    expect(fieldNode()).toBeUndefined();
    expect(fieldNode.controlValue()).toBeUndefined();
    expect(typedField()).toBeUndefined();
    expect(explicitNullable()).toBeUndefined();
    expect(configuredOmitted()).toBeNull();
    expect(configuredNullableOmitted()).toBeNull();
    expect(configuredField()).toBeUndefined();
  });

  it('inherits async-validation ownership from its parent injector by default', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const name = field('David', [asyncValidator(validate)]);
    const injector = Injector.create({ providers: [] });
    form({ name }, { injector });

    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(name.pending()).toBe(false);
  });

  it('aborts inherited pending validation when the ancestor injector is destroyed', async () => {
    let abortSignal: AbortSignal | undefined;
    const name = field('David', [asyncValidator(({ abortSignal: currentSignal }) => {
      abortSignal = currentSignal;
      return new Promise<null>(() => { });
    })]);
    const injector = Injector.create({ providers: [] });
    form({ name }, { injector });

    await Promise.resolve();
    expect(name.pending()).toBe(true);

    injector.destroy();

    expect(abortSignal?.aborted).toBe(true);
    expect(name.pending()).toBe(false);
  });

  it('can opt out of inheriting async-validation ownership from ancestors', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const name = field('David', [asyncValidator(validate)], { inheritInjector: false });
    const injector = Injector.create({ providers: [] });
    form({ name }, { injector });

    await Promise.resolve();
    await Promise.resolve();
    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('prefers its own injector over an ancestor injector', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const childInjector = Injector.create({ providers: [] });
    const parentInjector = Injector.create({ providers: [] });
    const name = field('David', [asyncValidator(validate)], { injector: childInjector });
    form({ name }, { injector: parentInjector });

    await Promise.resolve();
    await Promise.resolve();
    parentInjector.destroy();
    dependency.set('after parent destroy');
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledTimes(2);

    childInjector.destroy();
    dependency.set('after child destroy');
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('exposes inclusive between validation and both constraint metadata values', () => {
    const percentage = field(101, [between(0, 100)]);

    expect(percentage.getError('between')).toMatchObject({ min: 0, max: 100, actual: 101 });
    expect(percentage.min()).toBe(0);
    expect(percentage.max()).toBe(100);
    percentage.set(100);
    expect(percentage.errors()).toEqual([]);
  });

  it('exposes inclusive dateBetween validation and both date constraint metadata values', () => {
    const departure = field<Date>(new Date('2027-01-01'), [dateBetween('2026-01-01', '2026-12-31')]);

    expect(departure.getError('dateBetween')).toMatchObject({
      minDate: new Date('2026-01-01T00:00:00.000Z'),
      maxDate: new Date('2026-12-31T00:00:00.000Z'),
      actual: new Date('2027-01-01T00:00:00.000Z'),
    });
    expect(departure.min()).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(departure.max()).toEqual(new Date('2026-12-31T00:00:00.000Z'));
    departure.set(new Date('2026-12-31'));
    expect(departure.errors()).toEqual([]);
  });

  it('exposes the same API through api and $api', () => {
    const name = field('David');

    expect(name.$api).toBe(name.api);
  });

  it('exposes an empty path when it is a root node', () => {
    const name = field('David');

    expect(name.api.path()).toEqual([]);
    expect(name.api.parent()).toBeNull();
    expect(name.api.form()).toBeNull();
    expect(name.api.root()).toBe(name);
    expect(name.keyInParent()).toBeNull();
  });

  it('reactively updates validator ancestry when a field is attached and detached', async () => {
    const ancestry: [unknown, unknown][] = [];
    const name = field('David', [asyncValidator(async ({ node }) => {
      ancestry.push([node().form(), node().root()]);
      return null;
    })]);
    const profile = form({ fixed: field(true) });

    expect(name.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(ancestry.at(-1)).toEqual([null, name]);

    profile.add('name', name);
    await Promise.resolve();
    await Promise.resolve();
    expect(ancestry.at(-1)).toEqual([profile, profile]);

    profile.remove('name');
    await Promise.resolve();
    await Promise.resolve();
    expect(ancestry.at(-1)).toEqual([null, name]);
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
    const fieldNode = field.strict('David');
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

  it('keeps extracted actions callable without a receiver', () => {
    const name = field('initial', { debounce: 'blur' });
    const { set, update, setControlValue, flush, reset, setValidators, markAsTouched } = name;
    const { patch } = name.api;

    set('first');
    update(value => `${value}!`);
    expect(name()).toBe('first!');
    expect(name.pristine()).toBe(true);

    setControlValue('pending');
    expect(name()).toBe('first!');
    expect(name.controlValue()).toBe('pending');
    expect(name.debouncing()).toBe(true);
    flush();
    expect(name()).toBe('pending');
    expect(name.debouncing()).toBe(false);

    setValidators([required]);
    patch('');
    expect(name.errors()).toMatchObject([{ kind: 'required' }]);
    markAsTouched();
    expect(name.touched()).toBe(true);

    reset('ready');
    expect(name()).toBe('ready');
    expect(name.controlValue()).toBe('ready');
    expect(name.errors()).toEqual([]);
    expect(name.touched()).toBe(false);
    expect(name.dirty()).toBe(false);
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
      debounce: (abortSignal) => {
        return new Promise<void>((resolve, reject) => {
          runs.push({ signal: abortSignal, resolve, reject });
        });
      },
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

    runs[3]!.resolve();
    await Promise.resolve();
    expect(fieldNode()).toBe('second');
    expect(fieldNode.debouncing()).toBe(false);

    fieldNode.setControlValue('flushed');
    fieldNode.flush();
    expect(runs[4]!.signal.aborted).toBe(true);
    expect(fieldNode()).toBe('flushed');

    runs[4]!.reject();
    await Promise.resolve();
    expect(fieldNode()).toBe('flushed');
    expect(fieldNode.debouncing()).toBe(false);
  });

  it('handles synchronous custom control debouncers', () => {
    const immediate = field('initial', { debounce: () => { } });
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
      validatorApi = context.node().api;
      validatorField = context.field();
      disabled = context.node().disabled;
      disabledReasons = context.node().disabledReasons;
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
    const confirmationField = field('different', [equalTo('expected')]);

    expect(emailField.errors()).toMatchObject([
      { kind: 'email', message: 'Please enter a valid email address.' },
    ]);
    expect(urlField.errors()).toMatchObject([
      { kind: 'url', message: 'Please enter a valid absolute URL.' },
    ]);
    expect(integerField.errors()).toMatchObject([
      { kind: 'integer', actual: 1.5, message: 'Please enter a safe integer.' },
    ]);
    expect(confirmationField.errors()).toMatchObject([
      { kind: 'equalTo', message: 'Please enter the matching value.' },
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
    const fieldNode = field('David', [asyncValidator(() => new Promise<null>(() => { }))]);
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
    const validate = vi.fn(async ({ value }: Context<string | null>) => {
      return available() || value() === null ? null : { kind: 'unavailable' };
    });
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
    const validate = vi.fn(async ({ value }: Context<string | null>) => {
      return value() === 'David' ? { kind: 'nameTaken' } : null;
    });
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
    const validate = vi.fn(async ({ params }: { params: { country: string; name: string | null } }) => {
      return params.country === 'Switzerland' && params.name === 'David' ? { kind: 'nameTaken' } : null;
    });
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
    const fieldNode = field('David', [asyncValidator(async ({ node }) => {
      const api = node().api;
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
    const minLength = ({ value }: Context<string | null>) => {
      return value() !== null && value()!.length < 3
        ? { kind: 'minLength', minLength: 3, actualLength: value()!.length }
        : null;
    };
    const fieldNode = field('', [required, minLength]);
    expect(fieldNode.errors()).toMatchObject([
      { kind: 'required' },
      { kind: 'minLength', minLength: 3, actualLength: 0 },
    ]);
    expect(fieldNode.errors().every(error => error.targetNode === fieldNode)).toBe(true);
  });

  it('leaves out the keys of validators that pass', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const minLength = ({ value }: Context<string | null>) => {
      return value() !== null && value()!.length < 3 ? { kind: 'minLength' } : null;
    };
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

  it('reactively applies requiredIf validation and required metadata', () => {
    const enabled = signal(false);
    const fieldNode = field('', [requiredIf(() => enabled())]);

    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.required()).toBe(false);

    enabled.set(true);
    expect(fieldNode.getError('required')).toMatchObject({ kind: 'required' });
    expect(fieldNode.required()).toBe(true);

    fieldNode.set('David');
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.required()).toBe(true);

    enabled.set(false);
    expect(fieldNode.required()).toBe(false);
  });

  it('provides the complete reactive validator context to a built-in when option', () => {
    const enabled = signal(false);
    const fieldNode = field('', [required({
      when: ({ value, node }) => enabled() && value() === '' && node().touched(),
    })]);

    expect(fieldNode.valid()).toBe(true);
    expect(fieldNode.required()).toBe(false);

    enabled.set(true);
    expect(fieldNode.valid()).toBe(true);

    fieldNode.markAsTouched();
    expect(fieldNode.invalid()).toBe(true);
    expect(fieldNode.required()).toBe(true);
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

  it('patches like it sets through the API and the runtime field member', () => {
    const fieldNode = field('David');
    fieldNode.api.patch('Ana');
    expect(fieldNode()).toBe('Ana');
    expect(fieldNode.dirty()).toBe(false);

    const { patch } = fieldNode as typeof fieldNode & Pick<typeof fieldNode.api, 'patch'>;
    patch('Bea');
    expect(fieldNode()).toBe('Bea');
    expect(fieldNode.controlValue()).toBe('Bea');
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
