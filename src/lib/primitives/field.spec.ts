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
import { notNil } from '../validation/validators/not-nil';
import { pattern } from '../validation/validators/pattern';
import { integer } from '../validation/validators/integer';
import { between } from '../validation/validators/between';
import { equalTo } from '../validation/validators/equal-to';
import { maxDate } from '../validation/validators/max-date';
import { minDate } from '../validation/validators/min-date';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import type { InternalNode, AnyNode } from '../types/node.type';
import { createFormPrimitives } from './create-form-primitives';
import { maxLength } from '../validation/validators/max-length';
import { minLength } from '../validation/validators/min-length';
import { requiredIf } from '../validation/validators/required-if';
import { dateBetween } from '../validation/validators/date-between';
import { requiredTrue } from '../validation/validators/required-true';
import type { ValidatorNodeView } from '../validation/validator-node-view.type';
import { provideFormNodesConfig } from '../form-node/provide-form-nodes-config';
import { configureGlobalFormNodes } from '../configuration/configure-global-form-nodes';

type Context<TValue> = { readonly value: Signal<TValue> };

describe('field submission errors', () => {
  it('exposes targeted errors, preserves siblings, and clears only edited values', async () => {
    const profile = form({ email: field('old@example.com'), name: field('Ada') }, {
      onSubmit: (_value, node) => [
        { kind: 'taken', message: 'Already registered.', targetNode: node.email },
        { kind: 'reserved', targetNode: node.email },
        { kind: 'name', targetNode: node.name },
      ],
    });
    expect(await profile.submit()).toBe(false);
    expect(profile.email.errors().map(error => error.kind)).toEqual(['taken', 'reserved']);
    expect(profile.email.getError('taken')?.message).toBe('Already registered.');
    expect(profile.email.touched()).toBe(true);
    expect(profile.email.dirty()).toBe(false);
    expect(profile.email.invalid()).toBe(true);
    expect(profile.allErrors()).toHaveLength(3);
    profile.email.set('old@example.com');
    expect(profile.email.errors()).toHaveLength(2);
    profile.email.set('new@example.com');
    expect(profile.email.valid()).toBe(true);
    expect(profile.name.invalid()).toBe(true);
    profile.name.reset();
    expect(profile.valid()).toBe(true);
  });

  it.each(['edit', 'revert', 'reset', 'initial', 'draft'] as const)('discards a late field error after %s', async (change) => {
    let finish!: () => void;
    const wait = new Promise<void>((resolve) => { finish = resolve; });
    const profile = form({ email: field('old', { debounce: 'blur', equal: () => true }) }, {
      onSubmit: async (_value, node) => {
        await wait;
        return { kind: 'taken', targetNode: node.email };
      },
    });
    const pending = profile.submit();
    expect(profile.email.submitting()).toBe(true);
    if (change === 'edit' || change === 'revert') profile.email.set('new');
    if (change === 'revert') profile.email.set('old');
    if (change === 'reset') profile.email.reset();
    if (change === 'initial') profile.email.resetToInitial();
    if (change === 'draft') profile.email.value.control.set('new');
    finish();
    expect(await pending).toBe(false);
    expect(profile.email.errors()).toEqual([]);
    expect(profile.email.submitting()).toBe(false);
    expect(profile.valid()).toBe(true);
  });

  it('clears accepted errors on buffered edits without waiting for committed validation', async () => {
    const validate = vi.fn(({ value }: Context<string | null>) => { value(); return null; });
    const profile = form({ email: field('old', { debounce: 'blur', validators: validate }) }, {
      onSubmit: (_value, node) => ({ kind: 'taken', targetNode: node.email }),
    });
    expect(await profile.submit()).toBe(false);
    const count = validate.mock.calls.length;
    profile.email.value.control.set('new');
    expect(profile.email()).toBe('old');
    expect(profile.email.value.control()).toBe('new');
    expect(profile.email.errors()).toEqual([]);
    expect(profile.email.dirty()).toBe(true);
    expect(validate).toHaveBeenCalledTimes(count);
    profile.email.flush();
    expect(profile.email.valid()).toBe(true);
    expect(validate).toHaveBeenCalledTimes(count + 1);
  });

  it('keeps submission errors when async validation finishes and suppresses them while disabled', async () => {
    let finish!: (value: null) => void;
    const validate = vi.fn(() => new Promise<null>((resolve) => { finish = resolve; }));
    const profile = form({ email: field('old', [asyncValidator(validate)]) }, {
      onSubmit: (_value, node) => ({ kind: 'taken', targetNode: node.email }),
    });
    expect(profile.email.pending()).toBe(true);
    await vi.waitFor(() => expect(validate).toHaveBeenCalledTimes(1));
    expect(await profile.submit()).toBe(false);
    expect(profile.email.pending()).toBe(true);
    finish(null);
    await vi.waitFor(() => expect(profile.email.pending()).toBe(false));
    expect(profile.email.getError('taken')).toBeDefined();
    profile.email.disable();
    expect(profile.email.errors()).toEqual([]);
    profile.email.enable();
    expect(profile.email.getError('taken')).toBeDefined();
    profile.reset();
    expect(profile.email.errors()).toEqual([]);
  });
});

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
  const restore = configureGlobalFormNodes({ validatorMessages: { required: () => globalMessage() } });
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
    const name = field.strict('Marco', { debounce: 'blur', equal: (a, b) => a?.toLowerCase() === b?.toLowerCase() });
    const observe = <T>(source: Signal<T>) => computed(() => source());
    const observed = observe(name);
    const read = vi.fn(() => observed());
    const value = computed(read);
    expect(isSignal(name)).toBe(true);
    expect(value()).toBe('Marco');
    name.value.control.set('Lia');
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
    const selected = computed(source, { equal: (a, b) => a?.toLowerCase() === b?.toLowerCase() });
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
    expect(name.value.control()).toBe(equivalent);
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
      return a?.toLowerCase() === b?.toLowerCase();
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
      return a?.toLowerCase() === b?.toLowerCase();
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
    name.value.control.set({ name: 'Lia' });
    const next = { name: 'Marco' };
    name.value.control.set(next);
    expect(name.dirty()).toBe(true);
    expect(name.debouncing()).toBe(debounce !== 0);
    expect(name()).toBe(initial);
    name.markAsTouched();
    expect(name.debouncing()).toBe(false);
    expect(name.touched()).toBe(true);
    name.reset();
    expect(name.value.control()).toBe(next);
    const resetValue = { name: 'Marco' };
    name.reset(resetValue);
    expect(name.touched()).toBe(false);
    expect(name.pristine()).toBe(true);
    expect(name.value.control()).toBe(resetValue);
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
    expect(name.value.control()).toBe('Lia');
    expect(() => name()).toThrow(failure);
    name.reset();
    expect(name.value.control()).toBe('Lia');
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
    const name = field.strict('Marco', { equal: (a, b) => a?.toLowerCase() === b?.toLowerCase(), debounce });
    expect(name()).toBe('Marco');
    name.value.control.set('Lia');
    expect(name.debouncing()).toBe(true);
    name.value.control.set('MARCO');
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
    expect(name.value.control()).toBe('MARCO');
    expect(name.dirty()).toBe(true);
    name.value.control.set('Ada');
    name.value.control.set('MARCO');
    expect(runs[2]!.abortSignal.aborted).toBe(true);
    expect(debounce).toHaveBeenCalledTimes(3);
    expect(name.debouncing()).toBe(false);
    runs[2]!.finish();
    await Promise.resolve();
    name.reset();
    expect(name.value.control()).toBe('MARCO');
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
    const equal = vi.fn((a: string, b: string) => a?.toLowerCase() === b?.toLowerCase());
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
        observed.push([value(), node().value.control()]);
        return null;
      }, { debounce: 'blur' });
    });
    const node = model();
    expect(node()).toBe(initial);
    expect(node.value.control()).toBe(initial);
    expect(observed).toEqual([]);
    expect(node.valid()).toBe(true);
    expect(observed).toHaveLength(1);
    expect(observed[0]![0]).toBe(initial);
    expect(observed[0]![1]).toBe(initial);

    node.value.control.set('draft');
    expect(node()).toBe(initial);
    expect(node.value.control()).toBe('draft');
    expect(node.debouncing()).toBe(true);
    node.reset();
    expect(node()).toBe(initial);
    expect(node.value.control()).toBe(initial);
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
    expect(node.value.control()).toBe('x');
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
    expect(node.value.control()).toBe(initialValue);
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
    const validate = vi.fn((ctx: { node: Signal<ValidatorNodeView<AnyNode> & { touched: Signal<boolean>; dirty: Signal<boolean> }>; field: Signal<ValidatorNodeView<AnyNode> & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
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
    const params = vi.fn((ctx: { node: Signal<ValidatorNodeView<AnyNode> & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
      return ctx.node().dirty();
    });
    const states: boolean[] = [];
    const onError = vi.fn((_error: unknown, ctx: { node: Signal<ValidatorNodeView<AnyNode> & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
      return ctx.node().dirty() ? { kind: 'edited' } : null;
    });
    const validate = vi.fn(async (ctx: { params: boolean; field: Signal<ValidatorNodeView<AnyNode> & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
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
    const references: Signal<ValidatorNodeView<AnyNode>>[] = [];
    const validators = (context: { field: Signal<ValidatorNodeView<AnyNode>>; node: Signal<ValidatorNodeView<AnyNode>> }) => {
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
    const references: Signal<ValidatorNodeView<AnyNode>>[] = [];
    const params = vi.fn((context: { field: Signal<ValidatorNodeView<AnyNode>>; node: Signal<ValidatorNodeView<AnyNode>> }) => {
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
    expect(fieldNode.value.control()).toBeUndefined();
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

  it('exposes an empty path when it is a root node', () => {
    const name = field('David');

    expect(name.$api.path()).toEqual([]);
    expect(name.$api.parent()).toBeNull();
    expect(name.$api.form()).toBeNull();
    expect(name.$api.root()).toBe(name);
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
    const { set, update, flush, reset, setValidators, markAsTouched } = name;
    const { patch } = name.$api;
    const { set: setControlValue } = name.value.control;

    set('first');
    update(value => `${value}!`);
    expect(name()).toBe('first!');
    expect(name.pristine()).toBe(true);

    setControlValue('pending');
    expect(name()).toBe('first!');
    expect(name.value.control()).toBe('pending');
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
    expect(name.value.control()).toBe('ready');
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
    expect(fieldNode.value.control()).toBe(24);
    expect(fieldNode.pristine()).toBe(true);
  });

  it('updates control and model values immediately without control debounce', () => {
    const fieldNode = field('David');

    fieldNode.value.control.set('Daniel');

    expect(fieldNode.value.control()).toBe('Daniel');
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

      fieldNode.value.control.set('Daniel');

      expect(fieldNode.value.control()).toBe('Daniel');
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

    fieldNode.value.control.set('pending');
    expect(fieldNode.value.control()).toBe('pending');
    expect(fieldNode.value()).toBe('initial');
    expect(fieldNode.debouncing()).toBe(true);

    (fieldNode as unknown as InternalNode).$api._flushControlValueOnBlur();
    expect(fieldNode.value()).toBe('pending');
    expect(fieldNode.debouncing()).toBe(false);

    fieldNode.value.control.set('flushed');
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

    fieldNode.value.control.set('first');
    fieldNode.value.control.set('second');
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

    fieldNode.value.control.set('rejected');
    runs[2]!.reject();
    await Promise.resolve();
    expect(fieldNode()).toBe('second');
    expect(fieldNode.value.control()).toBe('rejected');
    expect(fieldNode.debouncing()).toBe(false);

    fieldNode.value.control.set('reset pending');
    fieldNode.reset();
    expect(runs[3]!.signal.aborted).toBe(true);
    expect(fieldNode()).toBe('second');
    expect(fieldNode.value.control()).toBe('second');

    runs[3]!.resolve();
    await Promise.resolve();
    expect(fieldNode()).toBe('second');
    expect(fieldNode.debouncing()).toBe(false);

    fieldNode.value.control.set('flushed');
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
    immediate.value.control.set('updated');
    expect(immediate()).toBe('updated');
    expect(immediate.debouncing()).toBe(false);

    const failure = new Error('Debouncer failed');
    const throwing = field('initial', { debounce: () => { throw failure; } });
    expect(() => throwing.value.control.set('pending')).toThrow(failure);
    expect(throwing()).toBe('initial');
    expect(throwing.value.control()).toBe('pending');
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

      fieldNode.value.control.set('Daniel');
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

      fieldNode.value.control.set('first');
      await vi.advanceTimersByTimeAsync(50);
      fieldNode.value.control.set('second');
      await vi.advanceTimersByTimeAsync(99);

      expect(fieldNode.value()).toBe('initial');
      expect(fieldNode.value.control()).toBe('second');

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

      fieldNode.value.control.set('stale');
      fieldNode.set('programmatic');
      await vi.runAllTimersAsync();

      expect(fieldNode.value()).toBe('programmatic');
      expect(fieldNode.value.control()).toBe('programmatic');
      expect(fieldNode.debouncing()).toBe(false);

      fieldNode.value.control.set('stale reset');
      fieldNode.reset();
      await vi.runAllTimersAsync();

      expect(fieldNode.value()).toBe('programmatic');
      expect(fieldNode.value.control()).toBe('programmatic');
      expect(fieldNode.pristine()).toBe(true);

      fieldNode.value.control.set('another stale value');
      fieldNode.reset('reset value');
      await vi.runAllTimersAsync();

      expect(fieldNode.value()).toBe('reset value');
      expect(fieldNode.value.control()).toBe('reset value');
      expect(fieldNode.pristine()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('flushes a pending control value when marked as touched', () => {
    const fieldNode = field('initial', { debounce: 'blur' });

    fieldNode.value.control.set('touched');
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
      validatorApi = context.node().$api;
      validatorField = context.field();
      disabled = context.node().disabled;
      disabledReasons = context.node().disabledReasons;
      return null;
    }]);

    expect(fieldNode.errors()).toEqual([]);
    expect(validatorApi).toBe(fieldNode.$api);
    expect(validatorField).toBe(fieldNode);
    expect(disabled).toBe(fieldNode.disabled);
    expect(disabledReasons).toBe(fieldNode.disabledReasons);
    expect(fieldNode.$api.path()).toEqual([]);
    expect(fieldNode.$api.parent()).toBeNull();
    expect(fieldNode.$api.form()).toBeNull();
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
      const api = node().$api;
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
    expect(fieldNode.$api.required()).toBe(true);

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
    expect(withoutValidators.$api.required()).toBe(false);
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
    expect(fieldNode.$api.getError('required')).toMatchObject({ kind: 'required' });
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
    expect(fieldNode.$api.allErrors()).toBe(fieldNode.allErrors());
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
    expect(fieldNode.$api.value()).toBe(fieldNode.value());
    expect(fieldNode.$api.valid()).toBe(fieldNode.valid());
    expect(fieldNode.$api.errors()).toEqual(fieldNode.errors());
    fieldNode.$api.set('David');
    expect(fieldNode()).toBe('David');
    expect(fieldNode.dirty()).toBe(false);
  });

  it('patches like it sets through the API and the runtime field member', () => {
    const fieldNode = field('David');
    fieldNode.$api.patch('Ana');
    expect(fieldNode()).toBe('Ana');
    expect(fieldNode.dirty()).toBe(false);

    const { patch } = fieldNode as typeof fieldNode & Pick<typeof fieldNode.$api, 'patch'>;
    patch('Bea');
    expect(fieldNode()).toBe('Bea');
    expect(fieldNode.value.control()).toBe('Bea');
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
    fieldNode.value.control.set('Ana');
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
    fieldNode.value.control.set('Ana');
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

it('tracks a class field referenced by its own composed validator', () => {
  const allowed = signal(['Acme']);
  const run = vi.fn();
  const matches = (items: string[], current: string | null) => {
    return validator<string | null>(() => {
      run(current);
      return items.includes(current ?? '') ? null : { kind: 'unmatched' };
    });
  };

  class Model {
    entry = field<string>('Acme', [() => {
      return matches(allowed(), this.entry());
    }]);
  }

  const model = new Model();
  expect(run).not.toHaveBeenCalled();
  expect(model.entry.valid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(1);
  expect(model.entry.pending()).toBe(false);
  expect(model.entry.errors()).toEqual([]);
  expect(run).toHaveBeenCalledTimes(1);
  allowed.set(['Other']);
  expect(model.entry.hasError('unmatched')).toBe(true);
  expect(run).toHaveBeenCalledTimes(2);
  model.entry.set('Other');
  expect(model.entry.valid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(3);
  expect(model.entry.dirty()).toBe(false);
  model.entry.markAsTouched();
  model.entry.reset('Acme');
  expect(model.entry.touched()).toBe(false);
  expect(model.entry.hasError('unmatched')).toBe(true);
  expect(run).toHaveBeenCalledTimes(4);
});

it('defers mixed self-referencing helpers and resumes asynchronous validation after synchronous errors clear', async () => {
  const run = vi.fn();
  const syncRun = vi.fn();
  class Model {
    ids = signal(['1']);

    value = field('1', [
      validator(() => {
        syncRun();
        return this.value() === 'blocked' ? { kind: 'blocked' } : null;
      }),
      asyncValidator(async () => {
        const value = this.value();
        const ids = this.ids();
        run(value, ids);
        return value !== null && ids.includes(value) ? null : { kind: 'unmatched' };
      }),
    ]);
  }
  const model = new Model();
  expect(syncRun).not.toHaveBeenCalled();
  expect(run).not.toHaveBeenCalled();
  expect(model.value.pending()).toBe(true);
  expect(syncRun).toHaveBeenCalledTimes(1);
  expect(run).not.toHaveBeenCalled();
  await Promise.resolve();
  await Promise.resolve();
  expect(model.value.valid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(1);
  model.value.set('blocked');
  await Promise.resolve();
  expect(model.value.errors()).toMatchObject([{ kind: 'blocked' }]);
  expect(model.value.pending()).toBe(false);
  model.ids.set([]);
  await Promise.resolve();
  expect(run).toHaveBeenCalledTimes(1);
  model.value.set('1');
  await Promise.resolve();
  await Promise.resolve();
  expect(run).toHaveBeenCalledTimes(2);
  expect(model.value.errors()).toMatchObject([{ kind: 'unmatched' }]);
  model.ids.set(['1']);
  await Promise.resolve();
  await Promise.resolve();
  expect(run).toHaveBeenCalledTimes(3);
  expect(model.value.errors()).toEqual([]);
  expect(model.value.pending()).toBe(false);
  expect(model.value.valid()).toBe(true);
  expect(model.value.dirty()).toBe(false);
  expect(model.value.touched()).toBe(false);
});

it('ignores malformed synchronous results while preserving valid errors and reactive transitions', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const result = signal<unknown>([{ kind: '', message: 'Kept' }, {}, 42, { kind: false }, null]);
    const run = vi.fn(() => result());
    const value = field('text', [run]);
    expect(value.errors()).toMatchObject([{ kind: '', message: 'Kept', targetNode: value }]);
    expect(value.invalid()).toBe(true);
    expect(run).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(3);
    expect(value.hasError('')).toBe(true);
    expect(run).toHaveBeenCalledTimes(1);
    result.set({ message: 'No kind' });
    expect(value.errors()).toEqual([]);
    expect(value.valid()).toBe(true);
    expect(value.pending()).toBe(false);
    expect(value.dirty()).toBe(false);
    expect(value.touched()).toBe(false);
    expect(run).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(4);
  } finally {
    warn.mockRestore();
  }
});

it('filters invalid entries and nodes from returned validator arrays without executing nodes', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const other = form({ kind: field('notAnError') });
    const value = field('', [() => [other, {}, required, null]]);
    expect(value.errors()).toMatchObject([{ kind: 'required' }]);
    expect(value.validators({ resolve: true })).toEqual([required]);
    expect(warn).toHaveBeenCalledTimes(2);
    value.set('text');
    expect(value.valid()).toBe(true);
    expect(warn).toHaveBeenCalledTimes(4);
  } finally {
    warn.mockRestore();
  }
});

it.each(['promise', 'observable', 'onError'] as const)('ignores malformed asynchronous field results from %s and finishes pending state', async (source) => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const result = signal<unknown>([{ kind: 'kept' }, {}, 42]);
    const run = vi.fn();
    const value = field('text', [asyncValidator(() => {
      run();
      const snapshot = result();
      if (source === 'onError') return Promise.reject(new Error('Offline'));
      if (source === 'observable') {
        return { subscribe: (observer: { next(value: unknown): void }) => {
          observer.next(snapshot);
          return { unsubscribe() {} };
        } };
      }
      return Promise.resolve(snapshot);
    }, { onError: () => result() as any })]);
    expect(value.pending()).toBe(true);
    await vi.waitFor(() => expect(value.pending()).toBe(false));
    expect(value.errors()).toMatchObject([{ kind: 'kept', targetNode: value }]);
    expect(value.invalid()).toBe(true);
    expect(run).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(2);
    result.set({ kind: false });
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(value.pending()).toBe(false));
    expect(value.errors()).toEqual([]);
    expect(value.valid()).toBe(true);
    expect(warn).toHaveBeenCalledTimes(3);
    expect(value.dirty()).toBe(false);
    expect(value.touched()).toBe(false);
  } finally {
    warn.mockRestore();
  }
});

it('normalizes reactive message validators and preserves composed rules and error queries', () => {
  const message = signal('Choose another name');
  const run = vi.fn(() => message());
  const rule = validator<string | null>(({ value }) => value() === 'admin' ? run() : null);
  const name = field('admin', () => [rule]);
  expect(name.errors()).toEqual([{ kind: 'custom', message: 'Choose another name', targetNode: name }]);
  expect(name.getError('custom')?.message).toBe('Choose another name');
  expect(name.hasError('custom')).toBe(true);
  expect(name.invalid()).toBe(true);
  expect(name.validators({ resolve: true })).toEqual([rule]);
  expect(run).toHaveBeenCalledTimes(1);
  message.set('');
  expect(name.getError('custom')?.message).toBe('');
  expect(name.invalid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(2);
  expect(name.dirty()).toBe(false);
  expect(name.touched()).toBe(false);
  name.set('Alex');
  expect(name.errors()).toEqual([]);
  expect(name.valid()).toBe(true);
  expect(name.pending()).toBe(false);
  expect(run).toHaveBeenCalledTimes(2);
});

it.each(['promise', 'observable', 'onError'] as const)('normalizes reactive asynchronous messages from %s', async (source) => {
  const result = signal<string | null>('Unavailable');
  const run = vi.fn();
  const name = field('Alex', [asyncValidator(() => {
    run();
    const snapshot = result();
    if (source === 'onError') return Promise.reject(new Error('Offline'));
    if (source === 'observable') {
      return { subscribe: (observer: { next(value: string | null): void }) => {
        observer.next(snapshot);
        return { unsubscribe() {} };
      } };
    }
    return Promise.resolve(snapshot);
  }, { onError: () => result() })]);
  expect(name.pending()).toBe(true);
  await vi.waitFor(() => expect(name.pending()).toBe(false));
  expect(name.errors()).toEqual([{ kind: 'custom', message: 'Unavailable', targetNode: name }]);
  expect(name.invalid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(1);
  result.set('');
  await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(2));
  await vi.waitFor(() => expect(name.pending()).toBe(false));
  expect(name.getError('custom')?.message).toBe('');
  expect(name.invalid()).toBe(true);
  result.set(null);
  await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(3));
  await vi.waitFor(() => expect(name.pending()).toBe(false));
  expect(name.errors()).toEqual([]);
  expect(name.valid()).toBe(true);
  expect(name.dirty()).toBe(false);
  expect(name.touched()).toBe(false);
});

it('suppresses async work for synchronous messages and discards cancelled async messages', async () => {
  const executions: { abortSignal: AbortSignal; resolve(value: string | null): void }[] = [];
  const run = vi.fn();
  const name = field('', [
    ({ value }) => value() ? null : 'Enter a name',
    asyncValidator(({ value, abortSignal }) => {
      run(value());
      return new Promise<string | null>((resolve) => {
        executions.push({ abortSignal, resolve });
      });
    }),
  ]);
  expect(name.invalid()).toBe(true);
  expect(name.pending()).toBe(false);
  expect(run).not.toHaveBeenCalled();
  name.set('Alex');
  await vi.waitFor(() => expect(run).toHaveBeenCalledExactlyOnceWith('Alex'));
  expect(name.pending()).toBe(true);
  name.set('Sam');
  await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(2));
  expect(executions[0]!.abortSignal.aborted).toBe(true);
  executions[0]!.resolve('Outdated error');
  await Promise.resolve();
  expect(name.errors()).toEqual([]);
  expect(name.pending()).toBe(true);
  executions[1]!.resolve('Choose another name');
  await vi.waitFor(() => expect(name.pending()).toBe(false));
  expect(name.getError('custom')?.message).toBe('Choose another name');
  expect(name.invalid()).toBe(true);
  name.reset('');
  expect(name.getError('custom')?.message).toBe('Enter a name');
  expect(name.pending()).toBe(false);
  expect(name.dirty()).toBe(false);
  expect(name.touched()).toBe(false);
  expect(run).toHaveBeenCalledTimes(2);
});

// Adapter commit hooks must observe complete public state, including ancestors.
it('notifies the originating adapter after a deferred control edit is committed', () => {
  const target = field.strict('initial', { debounce: 'blur' });
  const root = form({ target });
  const observations: unknown[] = [];
  const api = (target as unknown as InternalNode).$api;
  api._setControlValue('edited', () => observations.push({ value: target(), root: root(), dirty: root.dirty() }));
  expect(observations).toEqual([]);
  expect(target.$api.debouncing()).toBe(true);
  root.flush();
  expect(observations).toEqual([{ value: 'edited', root: { target: 'edited' }, dirty: true }]);
  root.flush();
  expect(observations).toHaveLength(1);
  api._setControlValue(api._value(), () => observations.push('same value'));
  expect(observations.at(-1)).toBe('same value');
});

describe('resetToInitial', () => {
  it('restores declaration values without redefining them through programmatic resets', () => {
    const name = field.strict('Marco', [required], { debounce: 'blur' });
    const profile = form({ name });
    name.reset('server');
    name.value.control.set('pending');
    name.markAsTouched();
    name.value.control.set('another pending');
    const { resetToInitial } = name;
    resetToInitial();
    expect(name()).toBe('Marco');
    expect(name.value.control()).toBe('Marco');
    expect(name.debouncing()).toBe(false);
    expect(name.pristine()).toBe(true);
    expect(name.untouched()).toBe(true);
    expect(profile()).toEqual({ name: 'Marco' });
    expect(profile.pristine()).toBe(true);
    expect(profile.valid()).toBe(true);
    const empty = field('', [required]);
    empty.set('valid');
    empty.resetToInitial();
    expect(empty.invalid()).toBe(true);
    const undefinedValue = field<string>(undefined);
    undefinedValue.set('changed');
    undefinedValue.resetToInitial();
    expect(undefinedValue()).toBeUndefined();
  });

  it('protects supported initial containers, cycles and aliases across repeated restores', () => {
    const key = { id: 1 };
    const initial = { list: [key], when: new Date(0), map: new Map([[key, key]]), set: new Set([key]), self: null as unknown };
    initial.self = initial;
    const node = field.strict(initial);
    key.id = 2;
    initial.when.setTime(100);
    initial.list.push({ id: 3 });
    node.resetToInitial();
    const restored = node();
    expect(restored).not.toBe(initial);
    expect(restored.self).toBe(restored);
    expect(restored.list).toEqual([{ id: 1 }]);
    expect(restored.when.getTime()).toBe(0);
    const restoredKey = restored.list[0]!;
    expect(restored.map.get(restoredKey)).toBe(restoredKey);
    expect(restored.set.has(restoredKey)).toBe(true);
    restoredKey.id = 99;
    restored.map.clear();
    node.resetToInitial();
    expect(node().list).toEqual([{ id: 1 }]);
    expect(node().map.size).toBe(1);
  });

  it('retains opaque instances and accessor descriptors without invoking getters', () => {
    class Opaque { value = 1; }
    const opaque = new Opaque();
    const getter = vi.fn(() => opaque.value);
    const symbol = Symbol('value');
    const initial = Object.create(null);
    Object.defineProperty(initial, 'read', { get: getter, enumerable: true });
    initial.opaque = opaque;
    initial[symbol] = { original: true };
    const node = field.strict(initial);
    expect(getter).not.toHaveBeenCalled();
    opaque.value = 2;
    node.resetToInitial();
    expect(getter).not.toHaveBeenCalled();
    expect(Object.getPrototypeOf(node())).toBeNull();
    expect(node().opaque).toBe(opaque);
    expect(node().read).toBe(2);
    expect(node()[symbol]).toEqual({ original: true });
  });

  it('cancels timed and custom debounce callbacks without later restoring stale edits', async () => {
    vi.useFakeTimers();
    try {
      const name = field.strict('initial', { debounce: 100 });
      name.value.control.set('pending');
      name.resetToInitial();
      vi.advanceTimersByTime(100);
      expect(name()).toBe('initial');
      let complete!: () => void;
      let abortSignal!: AbortSignal;
      const deferred = field.strict('initial', { debounce: (signal) => {
        abortSignal = signal;
        return new Promise<void>((resolve) => { complete = resolve; });
      } });
      deferred.value.control.set('pending');
      deferred.resetToInitial();
      expect(abortSignal.aborted).toBe(true);
      complete();
      await Promise.resolve();
      expect(deferred()).toBe('initial');
      expect(deferred.value.control()).toBe('initial');
    } finally { vi.useRealTimers(); }
  });
});

it('revalidates restored values and rejects stale async results outside injection context', async () => {
  const runs: { value: unknown; signal: AbortSignal; finish: (error: { kind: string } | null) => void }[] = [];
  const validate = asyncValidator(({ value, abortSignal }) => {
    const observed = value();
    return new Promise<{ kind: string } | null>((finish) => {
      runs.push({ value: observed, signal: abortSignal, finish });
    });
  });
  const target = field.strict('initial', [validate]);
  const root = form({ nested: form({ target }) });
  await Promise.resolve();
  await Promise.resolve();
  expect(runs).toHaveLength(1);
  target.set('edited');
  await Promise.resolve();
  await Promise.resolve();
  expect(runs).toHaveLength(2);
  expect(runs[0]!.signal.aborted).toBe(true);
  target.resetToInitial();
  await Promise.resolve();
  await Promise.resolve();
  expect(runs).toHaveLength(3);
  expect(runs[1]!.signal.aborted).toBe(true);
  expect(runs.map(run => run.value)).toEqual(['initial', 'edited', 'initial']);
  expect(target.pending()).toBe(true);
  expect(root.pending()).toBe(true);
  runs[1]!.finish({ kind: 'stale' });
  runs[0]!.finish({ kind: 'obsolete initial run' });
  runs[2]!.finish(null);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  expect(target.errors()).toEqual([]);
  expect(target.pending()).toBe(false);
  expect(root.pending()).toBe(false);
  expect(root.valid()).toBe(true);
  expect(root.pristine()).toBe(true);
});

it('exposes reactive committed and control views with independent equality and debounce', () => {
  const name = field('Ada', { equal: (a, b) => a?.toLowerCase() === b?.toLowerCase(), debounce: 'blur' });
  const committed = computed(() => name.value.committed());
  const control = computed(() => name.value.control());
  expect(isSignal(name.value)).toBe(true);
  expect(isSignal(name.value.committed)).toBe(true);
  expect(isSignal(name.value.control)).toBe(true);
  expect(name()).toBe('Ada');
  expect(committed()).toBe('Ada');
  expect(control()).toBe('Ada');
  const { set: input } = name.value.control;
  const { set } = name.value.committed;
  input('ADA');
  expect(control()).toBe('ADA');
  expect(committed()).toBe('Ada');
  expect(name.dirty()).toBe(true);
  expect(name.touched()).toBe(false);
  name.flush();
  expect(committed()).toBe('ADA');
  expect(name()).toBe('Ada');
  input('discarded');
  set('Grace');
  expect(name.debouncing()).toBe(false);
  expect(control()).toBe('Grace');
  expect(committed()).toBe('Grace');
  expect(name.dirty()).toBe(true);
  name.resetToInitial();
  expect(committed()).toBe('Ada');
  expect(control()).toBe('Ada');
  expect(name.pristine()).toBe(true);
  input('Ada');
  expect(name.dirty()).toBe(true);
});

it('observes its owner submission attempts without changing its own validation or reset contract', async () => {
  const name = field('', [required]);
  const profile = form({ name });
  const showErrors = computed(() => name.invalid() && (name.touched() || name.form()?.$api.submitted() === true));
  expect(showErrors()).toBe(false);
  await profile.submit();
  expect(name.form()?.$api.submitted()).toBe(true);
  expect(showErrors()).toBe(true);
  name.reset();
  expect(name.touched()).toBe(false);
  expect(showErrors()).toBe(true);
  const later = profile.add('email', field('', [required]));
  expect(later.touched()).toBe(false);
  expect(later.form()?.$api.submitted()).toBe(true);
  profile.resetToInitial();
  expect(name.form()?.$api.submitted()).toBe(false);
  expect(showErrors()).toBe(false);
});

it('exposes a stable callable API signal with public equality and separate committed/control views', () => {
  const name = field('Ada', { equal: (a, b) => a?.toLowerCase() === b?.toLowerCase(), debounce: 'blur' });
  const api = name.$api;
  const value = computed(() => api());
  expect(api).toBe(name.$api);
  expect(isSignal(api)).toBe(true);
  expect(value()).toBe('Ada');
  api.value.control.set('ADA');
  expect(api()).toBe('Ada');
  expect(api.value.control()).toBe('ADA');
  api.flush();
  expect(api()).toBe('Ada');
  expect(api.value.committed()).toBe('ADA');
  const { set } = api;
  set('Grace');
  expect(value()).toBe('Grace');
  expect(name()).toBe('Grace');
  api.resetToInitial();
  expect(value()).toBe('Ada');
  expect(name.$api).toBe(api);
});

it('infers and tracks requiredIf through a later declared computed self-reference', () => {
  class Model {
    name = field<string>(null, [requiredIf(() => this.needsName())]);

    needsName = computed(() => this.name() !== 'optional');
  }
  const model = new Model();
  expect(model.name.required()).toBe(true);
  expect(model.name.hasError('required')).toBe(true);
  model.name.set('optional');
  expect(model.name.required()).toBe(false);
  expect(model.name.valid()).toBe(true);
  model.name.set(null);
  expect(model.name.required()).toBe(true);
  expect(model.name.invalid()).toBe(true);
});

it('tracks a self-referencing when condition without evaluating it during construction', () => {
  const runs = vi.fn();
  class Model {
    name = field<string>(null, [required({ when: () => this.active() })]);

    active = computed(() => {
      runs();
      return this.name() !== 'optional';
    });
  }
  const model = new Model();
  expect(runs).not.toHaveBeenCalled();
  expect(model.name.required()).toBe(true);
  expect(model.name.invalid()).toBe(true);
  expect(runs).toHaveBeenCalledTimes(1);
  model.name.set('optional');
  expect(model.name.required()).toBe(false);
  expect(model.name.valid()).toBe(true);
  expect(runs).toHaveBeenCalledTimes(2);
  model.name.set(null);
  expect(model.name.hasError('required')).toBe(true);
  expect(runs).toHaveBeenCalledTimes(3);
});

it('keeps own and descendant error reads equivalent for fields and signal-compatible', () => {
  const name = field('', [required]);
  expect(isSignal(name.errors)).toBe(true);
  expect(name.errors({ descendants: true })).toBe(name.allErrors());
  expect(name.errors({ descendants: false })).toBe(name.errors());
  expect(name.errors({})).toBe(name.errors());
  const observed = computed(() => name.errors({ descendants: true }));
  expect(observed()).toHaveLength(1);
  name.set('Ada');
  expect(observed()).toEqual([]);
  name.set('');
  expect(observed()[0]?.targetNode).toBe(name);
});

it('requires replacing a mutated reference to notify derived values, independently of public equality', () => {
  const initial = { name: 'Ada' };
  const node = field(initial, { equal: () => false });
  const name = computed(() => node()?.name);
  expect(name()).toBe('Ada');
  initial.name = 'Grace';
  node.set(initial);
  expect(node()?.name).toBe('Grace');
  expect(name()).toBe('Ada');
  node.set({ ...initial });
  expect(name()).toBe('Grace');
});

it('normalizes numeric validator kinds through field validation, lookup and reset', () => {
  const value = field('', ({ value }) => value() ? null : { kind: 123, message: 'Missing', detail: true });
  expect(value.invalid()).toBe(true);
  expect(value.getError('123')).toMatchObject({ kind: '123', message: 'Missing', detail: true, targetNode: value });
  value.set('ready');
  expect(value.valid()).toBe(true);
  expect(value.errors()).toEqual([]);
  value.resetToInitial();
  expect(value.invalid()).toBe(true);
  expect(value.getError('123')?.kind).toBe('123');
});

it('normalizes asynchronous numeric errors before exposing field and parent state', async () => {
  const complete: ((result: { kind: number; message: string } | null) => void)[] = [];
  const observed: (string | null)[] = [];
  const value = field('', asyncValidator(({ value }) => {
    observed.push(value());
    return new Promise<{ kind: number; message: string } | null>((resolve) => { complete.push(resolve); });
  }));
  const owner = form({ value });
  expect(value.pending()).toBe(true);
  await vi.waitFor(() => expect(observed).toEqual(['']));
  complete[0]!({ kind: 456, message: 'Missing' });
  await vi.waitFor(() => expect(value.pending()).toBe(false));
  expect(value.getError('456')).toMatchObject({ kind: '456', targetNode: value });
  expect(owner.allErrors().map(error => error.kind)).toEqual(['456']);
  value.set('ready');
  await vi.waitFor(() => expect(observed).toEqual(['', 'ready']));
  expect(value.pending()).toBe(true);
  expect(owner.pending()).toBe(true);
  complete[1]!(null);
  await vi.waitFor(() => expect(value.pending()).toBe(false));
  expect(value.valid()).toBe(true);
  expect(owner.valid()).toBe(true);
});

describe('declaration configuration', () => {
  it('configures once with a callable safe API before returning, without tracking reads', () => {
    const dependency = signal(0);
    const configure = vi.fn((api: ReturnType<typeof field<string>>['$api']) => {
      expect(api()).toBe('');
      expect(api.parent()).toBeNull();
      dependency();
      api.setValidators(required);
    });
    const declaration = computed(() => field('', { configure }));
    const node = declaration();
    expect(node.hasError('required')).toBe(true);
    dependency.set(1);
    expect(declaration()).toBe(node);
    node.set('Ada');
    expect(node.valid()).toBe(true);
    node.markAsTouched();
    node.reset('');
    expect(node.hasError('required')).toBe(true);
    expect(node.touched()).toBe(false);
    expect(configure).toHaveBeenCalledTimes(1);
  });

  it('preserves nullable parent contracts before attachment and while attached', () => {
    let observed: unknown;
    const node = field('', (ctx) => {
      observed = ctx.parent<ReturnType<typeof form>>();
      return null;
    });
    node.errors();
    expect(observed).toBeNull();
    const parent = form();
    parent.add('node', node);
    node.errors();
    expect(observed).toBe(parent);
    parent.remove('node');
    node.errors();
    expect(observed).toBeNull();
  });
});

it('runs asynchronous validators installed by configure outside injection context', async () => {
  const calls: string[] = [];
  const node = field.strict('', {
    configure: (api) => {
      api.setValidators(asyncValidator(async ({ value }) => {
        calls.push(value());
        return value() ? null : { kind: 'empty' };
      }));
    },
  });
  await vi.waitFor(() => expect(node.pending()).toBe(false));
  expect(calls).toEqual(['']);
  expect(node.hasError('empty')).toBe(true);
  node.set('Ada');
  await vi.waitFor(() => expect(calls).toEqual(['', 'Ada']));
  await vi.waitFor(() => expect(node.pending()).toBe(false));
  expect(node.valid()).toBe(true);
});

it.each([false, true])('keeps value-triggered validation without external tracking (injector: %s)', (inContext) => {
  const injector = Injector.create({ providers: [] });
  const run = () => {
    const minimum = signal(3);
    const validate = vi.fn(({ value }: Context<number | null>) => {
      return value()! < minimum() ? { kind: 'minimum' } : null;
    });
    const count = field(2, validator(validate, { reactive: false }));
    expect(count()).toBe(2);
    expect(count.errors()).toMatchObject([{ kind: 'minimum', targetNode: count }]);
    expect(count.validationStatus()).toBe('invalid');
    expect(count.pending()).toBe(false);
    expect(count.dirty()).toBe(false);
    expect(count.touched()).toBe(false);
    expect(validate).toHaveBeenCalledTimes(1);

    minimum.set(1);
    expect(count.invalid()).toBe(true);
    expect(validate).toHaveBeenCalledTimes(1);
    count.set(4);
    expect(count.valid()).toBe(true);
    expect(validate).toHaveBeenCalledTimes(2);
    count.markAsTouched();
    count.markAsDirty();
    count.reset(0);
    expect(count.invalid()).toBe(true);
    expect(count.dirty()).toBe(false);
    expect(count.touched()).toBe(false);
    expect(validate).toHaveBeenCalledTimes(3);
    count.disable();
    expect(count.errors()).toEqual([]);
    expect(count.valid()).toBe(true);
    count.enable();
    expect(count.invalid()).toBe(true);
  };
  try {
    if (inContext) runInInjectionContext(injector, run);
    else run();
  } finally {
    injector.destroy();
  }
});

it('tracks the field value even when a non-reactive callback does not read it', () => {
  const active = signal(true);
  const validate = vi.fn(() => active() ? { kind: 'blocked' } : null);
  const count = field(1, validator(validate, { reactive: false }));
  expect(count.invalid()).toBe(true);
  active.set(false);
  expect(count.invalid()).toBe(true);
  expect(validate).toHaveBeenCalledTimes(1);
  count.set(2);
  expect(count.valid()).toBe(true);
  expect(validate).toHaveBeenCalledTimes(2);
});

it('isolates non-reactive compositions and preserves leaf references and metadata', () => {
  const active = signal(true);
  const minimum = signal(3);
  const leaf = min(() => minimum(), { when: () => active() });
  const choose = vi.fn(() => [() => leaf]);
  const count = field(2, validator(choose, { reactive: false }));
  expect(count.errors()).toMatchObject([{ kind: 'min', min: 3 }]);
  expect(count.validators({ resolve: true })).toEqual([leaf]);
  expect(count.min()).toBe(3);
  active.set(false);
  minimum.set(1);
  expect(count.invalid()).toBe(true);
  expect(choose).toHaveBeenCalledTimes(1);
  count.set(4);
  expect(count.valid()).toBe(true);
  expect(count.min()).toBeNull();
  expect(choose).toHaveBeenCalledTimes(2);
});

it('gates asynchronous field validation with the last value-triggered synchronous result', async () => {
  const minimum = signal(1);
  const guard = validator<number | null>(({ value }) => {
    return value()! < minimum() ? { kind: 'minimum' } : null;
  }, { reactive: false });
  const requests: { abortSignal: AbortSignal; resolve(result: null): void }[] = [];
  const remote = asyncValidator<number | null>(({ abortSignal }) => {
    return new Promise<null>(resolve => requests.push({ abortSignal, resolve }));
  });
  const model = field(0, [guard, remote]);
  expect(model.invalid()).toBe(true);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(requests).toHaveLength(0);
  minimum.set(-1);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(model.invalid()).toBe(true);
  expect(requests).toHaveLength(0);
  model.set(2);
  await vi.waitFor(() => expect(requests).toHaveLength(1));
  expect(model.validationStatus()).toBe('unknown');
  expect(model.pending()).toBe(true);
  minimum.set(3);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(requests[0]!.abortSignal.aborted).toBe(false);
  expect(model.pending()).toBe(true);
  model.reset(0);
  await vi.waitFor(() => expect(model.invalid()).toBe(true));
  expect(requests[0]!.abortSignal.aborted).toBe(true);
  expect(model.pending()).toBe(false);
  expect(model.touched()).toBe(false);
  expect(model.dirty()).toBe(false);
  requests[0]!.resolve(null);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(model.errors()).toMatchObject([{ kind: 'minimum' }]);
  expect(model.pending()).toBe(false);
});

describe('field onValueChange', () => {
  it('notifies committed public changes synchronously and skips initialization and equal values', () => {
    const notify = vi.fn();
    const node = field.strict('Ada', { onValueChange: notify, equal: (a, b) => a.toLowerCase() === b.toLowerCase(), configure: api => api.set('Grace') });
    expect(notify).not.toHaveBeenCalled();
    node.set('GRACE');
    expect(notify).not.toHaveBeenCalled();
    node.set('Lin');
    expect(notify).toHaveBeenLastCalledWith('Lin', node);
    expect(node()).toBe('Lin');
    node.update(value => value + '!');
    expect(notify).toHaveBeenLastCalledWith('Lin!', node);
    node.value.committed.set('Pat');
    expect(notify).toHaveBeenLastCalledWith('Pat', node);
    node.reset();
    expect(notify).toHaveBeenCalledTimes(3);
    node.resetToInitial();
    expect(notify).toHaveBeenLastCalledWith('Ada', node);
    expect(node.dirty()).toBe(false);
    expect(node.touched()).toBe(false);
    expect(notify).toHaveBeenCalledTimes(4);
  });

  it.each([0, 'blur', 20] as const)('respects control debounce %j and ignores canceled pending input', (debounce) => {
    vi.useFakeTimers();
    try {
      const notify = vi.fn();
      const node = field.strict('', { debounce, onValueChange: notify });
      node.value.control.set('first');
      expect(node.dirty()).toBe(true);
      if (debounce === 0) expect(notify).toHaveBeenCalledOnce();
      else {
        expect(notify).not.toHaveBeenCalled();
        expect(node()).toBe('');
        expect(node.debouncing()).toBe(true);
        if (debounce === 'blur') node.markAsTouched();
        else vi.advanceTimersByTime(20);
        expect(notify).toHaveBeenCalledOnce();
      }
      expect(notify).toHaveBeenLastCalledWith('first', node);
      expect(node.debouncing()).toBe(false);
      node.value.control.set('pending');
      node.set('programmatic');
      const calls = notify.mock.calls.length;
      vi.runAllTimers();
      node.flush();
      expect(node()).toBe('programmatic');
      expect(notify).toHaveBeenCalledTimes(calls);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not track callback reads in a surrounding computation', () => {
    const unrelated = signal(0);
    const trigger = signal(0);
    const notify = vi.fn(() => unrelated());
    const node = field.strict(0, { onValueChange: notify });
    const schedule = vi.fn();
    const writer = createWatch(() => node.set(trigger()), schedule, true);
    try {
      writer.run();
      trigger.set(1);
      writer.run();
      expect(notify).toHaveBeenCalledOnce();
      schedule.mockClear();
      unrelated.set(2);
      expect(schedule).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledOnce();
    } finally {
      writer.destroy();
    }
  });

  it('delivers callback writes after the current callback and detects non-settling cycles', () => {
    const values: number[] = [];
    const node = field.strict(0, { onValueChange(value, current) {
      values.push(value);
      if (value < 3) current.set(value + 1);
      expect(values.at(-1)).toBe(value);
    } });
    node.set(1);
    expect(values).toEqual([1, 2, 3]);
    const cyclic = field.strict(0, { onValueChange(value, current) { current.set(value + 1); } });
    expect(() => cyclic.set(1)).toThrow(/did not settle/);
    node.set(4);
    expect(values).toEqual([1, 2, 3, 4]);
  });

  it('reports values before asynchronous validation completes and does not react to validation state', async () => {
    let complete!: (result: null) => void;
    const validate = vi.fn(() => new Promise<null>((resolve) => { complete = resolve; }));
    const notify = vi.fn((_value: string, node: ReturnType<typeof field.strict<string>>) => {
      expect(node.pending()).toBe(true);
    });
    const node = field.strict('', { onValueChange: notify, validators: asyncValidator(validate) });
    node.set('Ada');
    expect(notify).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(validate).toHaveBeenCalledOnce());
    complete(null);
    await vi.waitFor(() => expect(node.pending()).toBe(false));
    expect(node.valid()).toBe(true);
    expect(notify).toHaveBeenCalledOnce();
  });
});

it('notifies only the latest successful custom-debounce commit', async () => {
  const completions: (() => void)[] = [];
  const notify = vi.fn();
  const node = field('', {
    debounce: () => new Promise<void>((resolve) => { completions.push(resolve); }),
    onValueChange: notify,
  });
  node.value.control.set('stale');
  node.value.control.set('latest');
  completions[0]!();
  await Promise.resolve();
  await Promise.resolve();
  expect(notify).not.toHaveBeenCalled();
  expect(node.debouncing()).toBe(true);
  completions[1]!();
  await Promise.resolve();
  await Promise.resolve();
  expect(notify).toHaveBeenCalledExactlyOnceWith('latest', node);
  expect(node.debouncing()).toBe(false);
});

it('recovers value-change delivery after public equality throws', () => {
  const notify = vi.fn();
  const node = field.strict('Ada', {
    equal: (previous, next) => {
      if (next === 'bad') throw new Error('Comparison failed');
      return previous === next;
    },
    onValueChange: notify,
  });
  expect(() => node.set('bad')).toThrow('Comparison failed');
  expect(node.value.committed()).toBe('bad');
  expect(notify).not.toHaveBeenCalled();
  node.set('Grace');
  expect(notify).toHaveBeenCalledExactlyOnceWith('Grace', node);
  expect(node()).toBe('Grace');
});

it('recovers a configured comparator failure before the first callback snapshot', () => {
  const notify = vi.fn();
  const node = field.strict('Ada', {
    equal: (previous, next) => {
      if (next === 'bad') throw new Error('Comparison failed');
      return previous === next;
    },
    configure(api) {
      api();
      api.set('bad');
    },
    onValueChange: notify,
  });
  node.set('Grace');
  expect(notify).toHaveBeenCalledExactlyOnceWith('Grace', node);
});

describe('file field values', () => {
  it('tracks file identity, validation, derived metadata, and reset outside injection', () => {
    const node = field<File>(null, [required]);
    const name = computed(() => node()?.name ?? 'No file');
    const first = new File(['a'], 'report.txt');
    const second = new File(['b'], 'report.txt');
    expect(node.invalid()).toBe(true);
    expect(name()).toBe('No file');
    node.set(first);
    expect(node()).toBe(first);
    expect(name()).toBe('report.txt');
    expect(node.valid()).toBe(true);
    expect(node.dirty()).toBe(false);
    node.set(second);
    expect(node()).toBe(second);
    node.markAsDirty();
    node.markAsTouched();
    node.reset();
    expect(node()).toBe(second);
    expect(node.dirty()).toBe(false);
    expect(node.touched()).toBe(false);
    node.resetToInitial();
    expect(node()).toBeNull();
    expect(name()).toBe('No file');
    expect(node.invalid()).toBe(true);
  });

  it('restores an initial file array while retaining opaque file instances', () => {
    const original = new File(['a'], 'original.txt');
    const replacement = new File(['b'], 'replacement.txt');
    const node = field<File[]>([original]);
    node.set([replacement]);
    node.resetToInitial();
    expect(node()).toEqual([original]);
    expect(node()![0]).toBe(original);
  });
});

describe('presence and acceptance validation', () => {
  it.each([false, true])('separates empty, absent, and unaccepted values with injection=%s', (injection) => {
    const check = () => {
      const presence = field<unknown>(null, [required]);
      const acceptance = field<unknown>(null, [requiredTrue]);
      const existence = field<unknown>(null, [notNil]);
      const cases = [
        { value: null, requiredValid: false, trueValid: false, nilValid: false },
        { value: undefined, requiredValid: false, trueValid: false, nilValid: false },
        { value: '', requiredValid: false, trueValid: false, nilValid: true },
        { value: Number.NaN, requiredValid: false, trueValid: false, nilValid: true },
        { value: false, requiredValid: true, trueValid: false, nilValid: true },
        { value: true, requiredValid: true, trueValid: true, nilValid: true },
        { value: 0, requiredValid: true, trueValid: false, nilValid: true },
        { value: 1, requiredValid: true, trueValid: false, nilValid: true },
        { value: 'true', requiredValid: true, trueValid: false, nilValid: true },
        { value: ' ', requiredValid: true, trueValid: false, nilValid: true },
        { value: [], requiredValid: true, trueValid: false, nilValid: true },
        { value: {}, requiredValid: true, trueValid: false, nilValid: true },
        { value: new Set(), requiredValid: true, trueValid: false, nilValid: true },
        { value: new Map(), requiredValid: true, trueValid: false, nilValid: true },
      ];
      for (const { value, requiredValid, trueValid, nilValid } of cases) {
        for (const [node, valid, kind, isRequired] of [
          [presence, requiredValid, 'required', true],
          [acceptance, trueValid, 'requiredTrue', true],
          [existence, nilValid, 'notNil', false],
        ] as const) {
          node.set(value);
          expect(node()).toBe(value);
          expect(node.valid()).toBe(valid);
          expect(node.invalid()).toBe(!valid);
          expect(node.validationStatus()).toBe(valid ? 'valid' : 'invalid');
          expect(node.errors().map(error => error.kind)).toEqual(valid ? [] : [kind]);
          expect(node.required()).toBe(isRequired);
          expect(node.pending()).toBe(false);
          expect(node.dirty()).toBe(false);
          expect(node.touched()).toBe(false);
        }
      }
    };
    if (injection) runInInjectionContext(Injector.create({ providers: [] }), check);
    else check();
  });

  it.each([requiredTrue, notNil])('tracks conditions and messages through disable, edits, and reset', (rule) => {
    const enabled = signal(true);
    const message = signal('Please answer.');
    const node = field<unknown>(null, [rule({ when: () => enabled(), message: () => message() })]);
    expect(node.errors()[0]?.message).toBe('Please answer.');
    message.set('Answer needed.');
    expect(node.errors()[0]?.message).toBe('Answer needed.');
    node.markAsTouched();
    node.markAsDirty();
    node.disable();
    expect(node.errors()).toEqual([]);
    enabled.set(false);
    expect(node.required()).toBe(false);
    node.enable();
    expect(node.valid()).toBe(true);
    enabled.set(true);
    expect(node.invalid()).toBe(true);
    node.set(true);
    expect(node.valid()).toBe(true);
    expect(node.required()).toBe(rule === requiredTrue);
    node.reset(null);
    expect(node.invalid()).toBe(true);
    expect(node.touched()).toBe(false);
    expect(node.dirty()).toBe(false);
    expect(node.pending()).toBe(false);
  });

  it('keeps requiredIf presence semantics when its condition changes', () => {
    const enabled = signal(true);
    const node = field<boolean>(false, [requiredIf(() => enabled())]);
    expect(node.valid()).toBe(true);
    expect(node.required()).toBe(true);
    node.set(null);
    expect(node.hasError('required')).toBe(true);
    enabled.set(false);
    expect(node.valid()).toBe(true);
    expect(node.required()).toBe(false);
    enabled.set(true);
    expect(node.invalid()).toBe(true);
    node.set(false);
    expect(node.valid()).toBe(true);
  });

  it('recognizes an explicit acceptance error as required state', () => {
    const node = field(true, [() => ({ kind: 'requiredTrue' })]);
    expect(node.required()).toBe(true);
  });
});
