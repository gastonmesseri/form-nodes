import moment from 'moment';
import { describe, expect, it, vi } from 'vitest';
import { computed, Injector, isSignal, signal, runInInjectionContext, type Signal } from '@angular/core';

import { form } from './form';
import { field } from './field';
import { array } from './array';
import { group } from './group';
import { validator } from '../validation/validator';
import { oneOf } from '../validation/validators/one-of';
import { between } from '../validation/validators/between';
import { equalTo } from '../validation/validators/equal-to';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import { createFormPrimitives } from './create-form-primitives';
import { minLength } from '../validation/validators/min-length';
import { requiredIf } from '../validation/validators/required-if';
import { uniqueItems } from '../validation/validators/unique-items';
import { dateBetween } from '../validation/validators/date-between';
import type { InternalNode, AnyNode, NodeType } from '../types/node.type';
import { provideFormNodesConfig } from '../form-node/provide-form-nodes-config';
import { configureGlobalFormNodes } from '../configuration/configure-global-form-nodes';

type Context<TValue> = { readonly value: Signal<TValue> };

const nodeTypeOf = (node: AnyNode): NodeType => {
  return node.$api.nodeType();
};

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
  const node = runInInjectionContext(bindingsOnly, () => form({ nested: form({ name: field('', [required]) }) }));
  const localNode = runInInjectionContext(messagesOnly, () => form({ nested: form({ name: field('', [required]) }) }));
  expect(node.nested.name.getError('required')?.message).toBe('Parent message');
  expect(localNode.nested.name.getError('required')?.message).toBe('Local message');
  node.nested.name.set('Marco');
  expect(node.nested.name.errors()).toEqual([]);
  node.nested.name.reset('');
  expect(node.nested.name.getError('required')?.message).toBe('Parent message');
  message.set('Updated message');
  expect(node.nested.name.getError('required')?.message).toBe('Updated message');
  expect(localNode.nested.name.getError('required')?.message).toBe('Local message');
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
    const node = runInInjectionContext(resetInjector, () => form({ nested: form({ name: field('', [required]) }) }));
    expect(node.nested.name.getError('required')?.message).toBe('Global required');
    expect(providerFactory).not.toHaveBeenCalled();
    globalMessage.set('Updated global required');
    expect(node.nested.name.getError('required')?.message).toBe('Updated global required');
    node.nested.name.set('Marco');
    expect(node.nested.name.errors()).toEqual([]);
    node.nested.name.reset('');
    expect(node.nested.name.getError('required')?.message).toBe('Updated global required');
    const parentForm = runInInjectionContext(parent, () => form({ branch: node }));
    expect(node.nested.name.getError('required')?.message).toBe('Ancestor provider required');
    expect(providerFactory).toHaveBeenCalledTimes(1);
    form({ parentForm }, { validatorMessages: { required: 'Form-tree required' } });
    expect(node.nested.name.getError('required')?.message).toBe('Form-tree required');
  } finally {
    restore();
    resetInjector.destroy();
    parent.destroy();
  }
});

describe('resolved validator queries', () => {
  it('resolves each aggregate locally across nested forms, groups, arrays, and API collisions', () => {
    const enabled = signal(true);
    const leaf = () => ({ kind: 'local' });
    const alternate = () => null;
    const composed = () => enabled() ? leaf : alternate;
    const profile = form({
      nested: form({ name: field('Marco') }, { validators: composed }),
      address: group({ city: field('Zurich') }, { validators: composed }),
      rows: array({ name: field('') }, { initialValue: 1, validators: composed }),
    });
    for (const node of [profile.nested, profile.address, profile.rows]) {
      expect(node.validators()).toEqual([composed]);
      expect(node.validators({ resolve: true })).toEqual([leaf]);
      expect(node.hasValidator(leaf, { resolve: true })).toBe(true);
    }
    expect(profile.validators({ resolve: true })).toEqual([]);
    expect(profile.hasValidator(leaf, { resolve: true })).toBe(false);
    expect(profile.allErrors()).toHaveLength(3);
    enabled.set(false);
    for (const node of [profile.nested, profile.address, profile.rows]) {
      expect(node.validators({ resolve: true })).toEqual([alternate]);
      expect(node.hasValidator(leaf, { resolve: true })).toBe(false);
    }
    expect(profile.allErrors()).toEqual([]);
    const collision = form({ validators: field('child'), hasValidator: field('child') }, { validators: composed });
    expect(collision.validators()).toBe('child');
    expect(collision.$api.validators({ resolve: true })).toEqual([alternate]);
    expect(collision.$api.hasValidator(alternate, { resolve: true })).toBe(true);
  });

  it('shares synchronous evaluation, tracks branches, and preserves order and duplicates', () => {
    const enabled = signal(true);
    const leaf = vi.fn(() => ({ kind: 'policy' }));
    const alternate = vi.fn(() => null);
    const composed = vi.fn(() => enabled() ? [leaf, leaf] : alternate);
    const node = form({ name: field('Marco') }, { validators: composed });
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
    const node = form({ name: field('Marco') }, { validators: composed });
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
    const node = form({ name: field('Marco') }, { validators: composed, [state]: true });
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
    const node = form({ name: field('Marco') }, { validators: remote, disabled: true });
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
    const node = form({ name: field('Marco') }, { validators: [composed, remote] });
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

describe('form', () => {
  it('enumerates an initially empty record through add, updates, and removal', () => {
    const parent = form({ record: form({}) });
    const record = parent.record;
    const visit = vi.fn();
    expect(Object.values(record.children)).toEqual([]);
    record.forEachChild(visit);
    expect(visit).not.toHaveBeenCalled();
    const name = record.add('name', field('Marco'));
    const age = record.add('age', field(18));
    expect(Object.values(record.children)).toEqual([name, age]);
    record.forEachChild(visit);
    expect(visit).not.toHaveBeenCalled();
    record.forEachChild(visit, { includeDynamic: true });
    expect(visit.mock.calls).toEqual([[name, 'name'], [age, 'age']]);
    record.forEachChild(child => child.markAsTouched(), { includeDynamic: true });
    expect(name.touched()).toBe(true);
    expect(age.touched()).toBe(true);
    name.set('Lia');
    expect(parent()).toEqual({ record: { name: 'Lia', age: 18 } });
    record.remove('age');
    expect(Object.values(record.children)).toEqual([name]);
    expect(record.get('age')).toBeUndefined();
    expect(parent()).toEqual({ record: { name: 'Lia' } });
  });

  it('keeps hasError and hasValidator scoped to each node across groups, arrays, and nested forms', () => {
    const profile = form({
      nested: form({ name: field('', [required]) }),
      address: group({ city: field('', [required]) }),
      rows: array(field('', [required]), { initialValue: 1 }),
    });
    expect(profile.invalid()).toBe(true);
    for (const node of [profile, profile.nested, profile.address, profile.rows]) {
      expect(node.hasError('required')).toBe(false);
      expect(node.hasValidator(required)).toBe(false);
      node.setValidators(required);
      expect(node.hasValidator(required)).toBe(true);
      expect(node.hasError('required')).toBe(false);
      node.setValidators(() => ({ kind: 'ownError' }));
      expect(node.hasError('ownError')).toBe(true);
      expect(node.hasValidator(required)).toBe(false);
      node.setValidators([]);
      expect(node.hasError('ownError')).toBe(false);
    }
    expect(profile.nested.name.hasError('required')).toBe(true);
    expect(profile.address.city.hasError('required')).toBe(true);
    expect(profile.rows[0]!.hasError('required')).toBe(true);
    const minimum = minLength(2);
    profile.rows.setValidators(minimum);
    expect(profile.rows.hasValidator(minimum)).toBe(true);
    expect(profile.rows.hasValidator(minLength(2))).toBe(false);
    expect(profile.rows.hasError('minLength')).toBe(true);
    profile.rows.push('ready');
    expect(profile.rows.hasError('minLength')).toBe(false);
    const collisions = form({ hasError: field('error'), hasValidator: field('validator') });
    expect(collisions.hasError()).toBe('error');
    expect(collisions.$api.hasError('missing')).toBe(false);
    expect(collisions.$api.hasValidator(required)).toBe(false);
  });

  it('reactively queries own errors and directly registered validator identities', () => {
    const blocked = signal(true);
    const check = vi.fn(() => blocked() ? { kind: 'blocked' } : null);
    const node = form({ name: field('Marco') }, { validators: [check] });
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
    const node = form({ nested: form({ name: field('Marco') }) }, { validators: [check] });
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

  it('exposes missing, added, and removed children through the runtime map', () => {
    const parent = form({ branch: form({ name: field('Marco'), age: field(30) }) });
    const branch = parent.branch;
    expect(Object.values(branch.children)).toEqual([branch.name, branch.age]);
    expect(branch.children.active?.value()).toBeUndefined();
    const active = branch.add('active', field(true));
    expect(branch.children.active).toBe(active);
    expect(branch.children.active?.value()).toBe(true);
    expect(branch.$api.children.active).toBe(active);
    expect(Object.values(branch.children)).toEqual([branch.name, branch.age, active]);
    expect(branch.get('active')).toBe(active);
    branch.remove('active');
    expect(branch.children.active?.value()).toBeUndefined();
    expect(Object.values(branch.children)).toEqual([branch.name, branch.age]);
    expect(branch.get('active')).toBeUndefined();
  });

  it('visits only declared children by default and includes dynamic nodes only when requested', () => {
    const branch = form({ name: field('Marco'), age: field(30) });
    const added = branch.add('extra', field(true));
    const visit = vi.fn((child: { markAsTouched(): void }) => child.markAsTouched());
    branch.forEachChild(visit);
    expect(visit.mock.calls.map(([child]) => child)).toEqual([branch.name, branch.age]);
    expect(branch.name.touched()).toBe(true);
    expect(added.touched()).toBe(false);
    visit.mockClear();
    branch.forEachChild(visit, { includeDynamic: false });
    expect(visit.mock.calls.map(([child]) => child)).toEqual([branch.name, branch.age]);
    visit.mockClear();
    branch.forEachChild(visit, {});
    expect(visit.mock.calls.map(([child]) => child)).toEqual([branch.name, branch.age]);
    visit.mockClear();
    branch.forEachChild(visit, { includeDynamic: true });
    expect(visit.mock.calls.map(([child]) => child)).toEqual([branch.name, branch.age, added]);
    expect(added.touched()).toBe(true);
    expect(Object.values(branch.children)).toEqual([branch.name, branch.age, added]);
    expect(branch()).toEqual({ name: 'Marco', age: 30, extra: true });
  });

  it('tracks runtime inclusion options without reading excluded dynamic values', () => {
    const branch = form({ name: field('Marco'), age: field(30) });
    const extra = branch.add('extra', field(true));
    const includeDynamic = signal(false);
    const read = vi.fn(() => {
      const values: unknown[] = [];
      branch.forEachChild(child => values.push(child()), { includeDynamic: includeDynamic() });
      return values;
    });
    const values = computed(read);
    expect(values()).toEqual(['Marco', 30]);
    extra.set(false);
    expect(values()).toEqual(['Marco', 30]);
    expect(read).toHaveBeenCalledTimes(1);
    includeDynamic.set(true);
    expect(values()).toEqual(['Marco', 30, false]);
    extra.set(true);
    expect(values()).toEqual(['Marco', 30, true]);
    branch.remove('extra');
    expect(values()).toEqual(['Marco', 30]);
    expect(read).toHaveBeenCalledTimes(4);
  });

  it('visits only direct child nodes, including dynamic children, in a stable snapshot', () => {
    const branch = form({ name: field('Marco'), address: { city: field('Zurich') }, tags: array(field('')) });
    const removed = branch.add('removed', field(1));
    const visited: unknown[] = [];
    const result = branch.forEachChild((child, key) => {
      visited.push([key, child]);
      if (key === 'name') {
        branch.remove('removed');
        branch.add('later', field(2));
      }
    }, { includeDynamic: true });
    expect(result).toBeUndefined();
    expect(visited).toEqual([
      ['name', branch.name], ['address', branch.address], ['tags', branch.tags], ['removed', removed],
    ]);
    const keys: string[] = [];
    branch.forEachChild((_child, key) => keys.push(key), { includeDynamic: true });
    expect(keys).toEqual(['name', 'address', 'tags', 'later']);
  });

  it('tracks structural changes and callback value reads without reading other child values', () => {
    const branch = form({ name: field('Marco'), age: field(30) });
    const visits = vi.fn(() => {
      const values: unknown[] = [];
      branch.forEachChild((child, key) => values.push(key === 'name' ? child() : key), { includeDynamic: true });
      return values;
    });
    const observed = computed(visits);
    expect(observed()).toEqual(['Marco', 'age']);
    branch.age.set(31);
    expect(observed()).toEqual(['Marco', 'age']);
    expect(visits).toHaveBeenCalledTimes(1);
    branch.name.set('Lia');
    expect(observed()).toEqual(['Lia', 'age']);
    branch.add('extra', field(true));
    expect(observed()).toEqual(['Lia', 'age', 'extra']);
    branch.remove('extra');
    expect(observed()).toEqual(['Lia', 'age']);
    expect(visits).toHaveBeenCalledTimes(4);
  });

  it('handles empty nodes, child-name collisions, and callback errors', () => {
    const visit = vi.fn();
    form({}).forEachChild(visit);
    expect(visit).not.toHaveBeenCalled();
    const branch = form({ forEachChild: field('child'), next: field('next') });
    expect(branch.forEachChild()).toBe('child');
    branch.$api.forEachChild(visit);
    expect(visit.mock.calls).toEqual([[branch.forEachChild, 'forEachChild'], [branch.next, 'next']]);
    const fail = vi.fn(() => { throw new Error('Iteration failed'); });
    expect(() => branch.$api.forEachChild(fail)).toThrow('Iteration failed');
    expect(fail).toHaveBeenCalledTimes(1);
  });

  it('exposes aggregate signals through nested forms, groups, and array proxies', () => {
    const profile = form({
      name: field('Marco'),
      address: group({ city: field('Zurich') }),
      preferences: form({ dark: field(false) }),
      tags: array(field('')),
    });
    const observe = <T>(source: Signal<T>) => computed(() => source());
    const snapshot = observe(profile);
    const city = observe(profile.address);
    const preferences = observe(profile.preferences);
    const tags = observe(profile.tags);
    for (const node of [profile, profile.address, profile.preferences, profile.tags]) expect(isSignal(node)).toBe(true);
    expect(snapshot()).toEqual({ name: 'Marco', address: { city: 'Zurich' }, preferences: { dark: false }, tags: [] });
    profile.address.city.set('Bern');
    profile.preferences.dark.set(true);
    profile.tags.push('admin');
    expect(city()).toEqual({ city: 'Bern' });
    expect(preferences()).toEqual({ dark: true });
    expect(tags()).toEqual(['admin']);
    expect(snapshot()).toEqual({ name: 'Marco', address: { city: 'Bern' }, preferences: { dark: true }, tags: ['admin'] });
    profile.tags[0]!.set('editor');
    expect(tags()).toEqual(['editor']);
    profile.tags.clear();
    expect(tags()).toEqual([]);
    profile.reset({ name: 'Marco', address: { city: 'Zurich' }, preferences: { dark: false }, tags: [] });
    expect(snapshot()).toEqual({ name: 'Marco', address: { city: 'Zurich' }, preferences: { dark: false }, tags: [] });
  });

  it('reconciles keyed array order and invalidates a parent buffer when public equality ignores order', () => {
    const profile = form({ people: array({ id: field.strict<number>(0), name: field.strict<string>('') }, {
      initialValue: [{ id: 1, name: 'Marco' }, { id: 2, name: 'Lia' }],
      trackBy: 'id',
      equal: (a, b) => a.length === b.length && a.every(item => b.some(next => item.id === next.id && item.name === next.name)),
    }) }, { debounce: 'blur' });
    const people = profile.people;
    const first = people[0]!;
    const second = people[1]!;
    const initial = profile();
    first.markAsTouched();
    (profile as unknown as InternalNode).$api._setControlValue({ people: [{ id: 3, name: 'Pending' }] });
    expect(profile.debouncing()).toBe(true);
    people.set([{ id: 2, name: 'Lia' }, { id: 1, name: 'Marco' }]);
    expect(profile()).toBe(initial);
    expect(profile.debouncing()).toBe(false);
    profile.flush();
    expect(people.items()).toEqual([second, first]);
    expect(first.path()).toEqual(['people', '1']);
    expect(first.touched()).toBe(true);
    expect(people.map(item => item.id())).toEqual([2, 1]);
    expect(profile.value.control().people.map(item => item.id)).toEqual([2, 1]);
    first.name.set('Ada');
    expect(profile().people).toEqual([{ id: 2, name: 'Lia' }, { id: 1, name: 'Ada' }]);
  });

  it('retains exposed array values through nested forms while children, controls and validation stay independent', async () => {
    const externalError = signal(false);
    const contexts: unknown[][] = [];
    const action = vi.fn();
    const validateParent = vi.fn(({ value }: Context<unknown>) => { value(); return null; });
    const profile = form({ details: form({
      people: array({ name: field.strict<string>('Marco', [({ value }) => {
        return value() === '' ? { kind: 'emptyName' } : null;
      }]) }, {
        initialValue: 1,
        equal: (a, b) => a.length === b.length && a.every((item, index) => item.name.toLowerCase() === b[index]!.name.toLowerCase()),
        validators: (ctx) => {
          contexts.push([ctx.value(), ctx.node()(), ctx.field().value()]);
          return externalError() ? { kind: 'external' } : null;
        },
      }),
    }, [validateParent]) }, { validators: [validateParent], onSubmit: action });
    const people = profile.details.people;
    const initial = profile();
    expect(profile.valid()).toBe(true);
    people[0]!.name.value.control.set('MARCO');
    expect(people[0]!.name()).toBe('MARCO');
    expect(profile()).toBe(initial);
    expect(profile.value.control()).toEqual({ details: { people: [{ name: 'MARCO' }] } });
    expect(profile.valid()).toBe(true);
    expect(contexts).toEqual([[initial.details.people, initial.details.people, initial.details.people]]);
    expect(validateParent).toHaveBeenCalledTimes(2);
    expect(await profile.submit()).toBe(true);
    expect(action).toHaveBeenCalledExactlyOnceWith(initial, profile);
    externalError.set(true);
    expect(profile.invalid()).toBe(true);
    expect(people.getError('external')).toBeDefined();
    expect(contexts).toHaveLength(2);
    externalError.set(false);
    profile.markAsTouched();
    profile.reset();
    expect(people[0]!.name()).toBe('MARCO');
    expect(profile()).toBe(initial);
    expect(profile.pristine()).toBe(true);
    expect(profile.untouched()).toBe(true);
    const updater = vi.fn(value => value.map((item: { name: string }) => ({ name: `${item.name}!` })));
    people.update(updater);
    expect(updater).toHaveBeenCalledExactlyOnceWith(initial.details.people);
    expect(people[0]!.name()).toBe('Marco!');
    people[0]!.name.set('');
    expect(profile.invalid()).toBe(true);
    expect(people[0]!.name.getError('emptyName')).toBeDefined();
  });

  it.each([false, true])('preserves pending array validation for equivalent values and cancels changed values (injector: %s)', async (withInjector) => {
    const injector = withInjector ? Injector.create({ providers: [] }) : undefined;
    const runs: { abortSignal: AbortSignal; finish: (result: null | { kind: string }) => void }[] = [];
    const profile = form({ details: { people: array({ name: field.strict<string>('Marco') }, {
      initialValue: 1,
      equal: 'deep',
      validators: asyncValidator<{ name: string }[]>((ctx) => {
        ctx.value();
        return new Promise<null | { kind: string }>((finish) => { runs.push({ abortSignal: ctx.abortSignal, finish }); });
      }),
    }) } }, injector ? { injector } : {});
    const people = profile.details.people;
    expect(profile.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(runs).toHaveLength(1);
    const removed = people.removeAt(0);
    people.insert(0, { name: 'Marco' });
    expect(removed!.parent()).toBeNull();
    await Promise.resolve();
    await Promise.resolve();
    expect(runs).toHaveLength(1);
    expect(runs[0]!.abortSignal.aborted).toBe(false);
    people[0]!.name.set('Lia');
    await Promise.resolve();
    await Promise.resolve();
    expect(runs).toHaveLength(2);
    expect(runs[0]!.abortSignal.aborted).toBe(true);
    runs[0]!.finish({ kind: 'stale' });
    await Promise.resolve();
    await Promise.resolve();
    expect(profile.pending()).toBe(true);
    expect(people.errors()).toEqual([]);
    runs[1]!.finish(null);
    await Promise.resolve();
    await Promise.resolve();
    expect(profile.pending()).toBe(false);
    expect(profile.valid()).toBe(true);
    injector?.destroy();
  });

  it('uses exposed field values for validation, parent composition, updates, and submission', async () => {
    const externalError = signal(false);
    const contexts: unknown[][] = [];
    const action = vi.fn();
    const validateParent = vi.fn(({ value }: Context<unknown>) => { value(); return null; });
    const profile = form({
      details: form({ name: field.strict('Marco', {
        equal: (a, b) => a.toLowerCase() === b.toLowerCase(),
        validators: (ctx) => {
          contexts.push([ctx.value(), ctx.node()(), ctx.field().value()]);
          return externalError() ? { kind: 'external' } : null;
        },
      }) }, [validateParent]),
    }, { validators: [validateParent], onSubmit: action });
    const name = profile.details.name;
    const initial = profile();
    expect(profile.valid()).toBe(true);
    name.value.control.set('MARCO');
    expect(profile()).toBe(initial);
    expect(profile.value.control()).toEqual({ details: { name: 'MARCO' } });
    expect(profile.valid()).toBe(true);
    expect(contexts).toEqual([['Marco', 'Marco', 'Marco']]);
    expect(validateParent).toHaveBeenCalledTimes(2);
    expect(await profile.submit()).toBe(true);
    expect(action).toHaveBeenCalledExactlyOnceWith(initial, profile);
    externalError.set(true);
    expect(profile.invalid()).toBe(true);
    expect(name.getError('external')).toBeDefined();
    expect(contexts).toHaveLength(2);
    externalError.set(false);
    profile.markAsTouched();
    profile.reset();
    expect(profile.value.control()).toEqual({ details: { name: 'MARCO' } });
    expect(profile()).toBe(initial);
    expect(profile.pristine()).toBe(true);
    expect(profile.untouched()).toBe(true);
    const updater = vi.fn(value => `${value}!`);
    name.update(updater);
    expect(updater).toHaveBeenCalledExactlyOnceWith('Marco');
    expect(profile()).toEqual({ details: { name: 'Marco!' } });
    expect(profile.valid()).toBe(true);
    expect(validateParent).toHaveBeenCalledTimes(4);
  });

  it.each(['form', 'array'] as const)('invalidates pending %s control input when a field changes only internally', (kind) => {
    const name = field.strict('Marco', { equal: (a, b) => a.toLowerCase() === b.toLowerCase() });
    const target = kind === 'form'
      ? form({ name }, { debounce: 'blur' })
      : array(() => name, { initialValue: 1, debounce: 'blur' });
    const initial = target();
    const pending = kind === 'form' ? { name: 'Pending' } : ['Pending'];
    (target as unknown as InternalNode).$api._setControlValue(pending);
    expect(target.debouncing()).toBe(true);
    name.set('MARCO');
    expect(target()).toBe(initial);
    expect(target.debouncing()).toBe(false);
    target.flush();
    expect(name.value.control()).toBe('MARCO');
    expect(target.value.control()).toEqual(kind === 'form' ? { name: 'MARCO' } : ['MARCO']);
    target.reset();
    expect(name.value.control()).toBe('MARCO');
    expect(target()).toBe(initial);
  });

  it.each(['form', 'group'] as const)('retains exposed %s values while preserving child validation and interaction', (kind) => {
    const externalError = signal(false);
    const validateChild = vi.fn(({ value }: Context<string>) => value() === 'MARCO' ? { kind: 'uppercase' } : null);
    const validateAggregate = vi.fn(({ value }: Context<{ name: string }>) => {
      value();
      return externalError() ? { kind: 'external' } : null;
    });
    const definitions = { name: field.strict<string>('Marco', [validateChild]) };
    const options = {
      equal: (a: { name: string }, b: { name: string }) => a.name.toLowerCase() === b.name.toLowerCase(),
      validators: [validateAggregate],
    };
    const target = kind === 'form' ? form(definitions, options) : group(definitions, options);
    const parent = form({ target });
    const initial = parent();
    expect(parent.valid()).toBe(true);
    expect(validateAggregate).toHaveBeenCalledOnce();
    expect(validateChild).toHaveBeenCalledOnce();

    target.name.value.control.set('MARCO');
    expect(target.name()).toBe('MARCO');
    expect(target()).toBe(initial.target);
    expect(target.value()).toBe(target());
    expect(target.$api.value()).toBe(target());
    expect(parent()).toBe(initial);
    expect(target.value.control()).toEqual({ name: 'MARCO' });
    expect(parent.value.control()).toEqual({ target: { name: 'MARCO' } });
    expect(parent.dirty()).toBe(true);
    expect(parent.invalid()).toBe(true);
    expect(target.errors()).toEqual([]);
    expect(target.name.errors().some(error => error.kind === 'uppercase')).toBe(true);
    expect(validateChild).toHaveBeenCalledTimes(2);
    expect(validateAggregate).toHaveBeenCalledOnce();

    externalError.set(true);
    expect(target.errors().some(error => error.kind === 'external')).toBe(true);
    expect(validateAggregate).toHaveBeenCalledTimes(2);
    target.markAsTouched();
    expect(parent.touched()).toBe(true);
    parent.reset();
    expect(parent.pristine()).toBe(true);
    expect(parent.untouched()).toBe(true);
    expect(target.name()).toBe('MARCO');
    expect(target.value.control()).toEqual({ name: 'MARCO' });
    expect(parent()).toBe(initial);
  });

  it('uses the exposed value consistently in validation, update callbacks, and submission', async () => {
    const contexts: unknown[][] = [];
    const action = vi.fn();
    const target = form({ name: field.strict<string>('Marco') }, {
      equal: (a, b) => a.name.toLowerCase() === b.name.toLowerCase(),
      validators: (ctx) => { contexts.push([ctx.value(), ctx.node()(), ctx.field().value()]); return null; },
      onSubmit: action,
    });
    const initial = target();
    expect(target.valid()).toBe(true);
    target.name.set('MARCO');
    expect(target.valid()).toBe(true);
    expect(contexts).toEqual([[initial, initial, initial]]);
    expect(await target.submit()).toBe(true);
    expect(action).toHaveBeenCalledExactlyOnceWith(initial, target);
    const updater = vi.fn(value => ({ name: `${value.name}!` }));
    target.update(updater);
    expect(updater).toHaveBeenCalledExactlyOnceWith(initial);
    expect(target.name()).toBe('Marco!');
    expect(target()).toEqual({ name: 'Marco!' });
    expect(target.valid()).toBe(true);
    expect(contexts).toHaveLength(2);
    target.reset({ name: 'MARCO!' });
    expect(target().name).toBe('Marco!');
    expect(target.name()).toBe('MARCO!');
    expect(target.value.control().name).toBe('MARCO!');
    expect(target.pristine()).toBe(true);
    expect(target.untouched()).toBe(true);
  });

  it('keeps public parent composition independent of internal changes through groups and arrays', () => {
    const makeItem = () => {
      return group({ name: field.strict<string>('Marco') }, { equal: (a, b) => a.name.toLowerCase() === b.name.toLowerCase() });
    };
    const target = form({
      details: { person: makeItem(), city: field('Zurich') },
      people: array(makeItem, { initialValue: 1 }),
    });
    const initial = target();
    target.details.person.name.set('MARCO');
    target.people[0]!.name.set('MARCO');
    expect(target()).toBe(initial);
    expect(target.people()).toBe(initial.people);
    expect(target.value.control().details.person.name).toBe('MARCO');
    expect(target.value.control().people[0]!.name).toBe('MARCO');
    target.details.city.set('Bern');
    target.people.push({ name: 'Lia' });
    expect(target().details).toEqual({ person: { name: 'Marco' }, city: 'Bern' });
    expect(target().people).toEqual([{ name: 'Marco' }, { name: 'Lia' }]);
    expect(target().people[0]).toBe(target.people[0]!());
    const extra = target.add('extra', makeItem());
    expect(target()).toHaveProperty('extra.name', 'Marco');
    expect(target.value.control()).toHaveProperty('extra.name', 'Marco');
    extra.name.set('MARCO');
    expect(target.value.control()).toHaveProperty('extra.name', 'MARCO');
    expect(target()).toHaveProperty('extra.name', 'Marco');
    target.remove('extra');
    expect(target()).not.toHaveProperty('extra');
    expect(extra.parent()).toBeNull();
  });

  it.each(['target', 'parent', 'array'] as const)('invalidates pending %s control input when an equal public child changes internally', (bufferOwner) => {
    const target = form({ name: field.strict<string>('Marco') }, {
      equal: (a, b) => a.name.toLowerCase() === b.name.toLowerCase(),
    });
    const parent = bufferOwner === 'array'
      ? array(() => target, { initialValue: 1, debounce: 'blur' })
      : form({ target }, { debounce: 'blur' });
    const owner = bufferOwner === 'target' ? target : parent;
    const initial = parent();
    const pending = bufferOwner === 'target' ? { name: 'Pending' }
      : bufferOwner === 'array' ? [{ name: 'Pending' }] : { target: { name: 'Pending' } };
    (owner as unknown as InternalNode).$api._setControlValue(pending);
    expect(owner.debouncing()).toBe(true);
    target.name.set('MARCO');
    expect(parent()).toBe(initial);
    expect(owner.debouncing()).toBe(false);
    owner.flush();
    expect(target.name()).toBe('MARCO');
    expect(target()).toEqual({ name: 'Marco' });
  });

  it.each(['form', 'group'] as const)('preserves pending %s validation across equivalent writes and cancels stale non-equivalent work', async (kind) => {
    const runs: { value: { name: string }; abortSignal: AbortSignal; finish: (result: null | { kind: string }) => void }[] = [];
    const validate = asyncValidator<{ name: string }>((ctx) => {
      const value = ctx.value();
      return new Promise<null | { kind: string }>((finish) => { runs.push({ value, abortSignal: ctx.abortSignal, finish }); });
    });
    const definitions = { name: field.strict<string>('Marco') };
    const options = {
      equal: (a: { name: string }, b: { name: string }) => a.name.toLowerCase() === b.name.toLowerCase(),
      validators: [validate],
    };
    const target = kind === 'form' ? form(definitions, options) : group(definitions, options);
    const parent = form({ details: form({ target }) });
    expect(parent.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(runs).toHaveLength(1);
    target.name.set('MARCO');
    await Promise.resolve();
    await Promise.resolve();
    expect(runs).toHaveLength(1);
    expect(runs[0]!.abortSignal.aborted).toBe(false);
    expect(runs[0]!.value).toBe(target());
    target.name.set('Lia');
    await Promise.resolve();
    await Promise.resolve();
    expect(runs).toHaveLength(2);
    expect(runs[0]!.abortSignal.aborted).toBe(true);
    runs[0]!.finish({ kind: 'stale' });
    await Promise.resolve();
    await Promise.resolve();
    expect(parent.pending()).toBe(true);
    expect(target.errors()).toEqual([]);
    runs[1]!.finish(null);
    await Promise.resolve();
    await Promise.resolve();
    expect(parent.pending()).toBe(false);
    expect(parent.valid()).toBe(true);
  });

  it.each(['shallow', 'deep'] as const)('supports %s aggregate equality without changing child storage', (equal) => {
    const target = form({ person: field.strict({ name: 'Marco' }) }, { equal });
    const initial = target();
    const replacement = { name: 'Marco' };
    target.person.set(replacement);
    expect(target.person()).toBe(replacement);
    expect(target() === initial).toBe(equal === 'deep');
    expect(target.value.control().person).toBe(replacement);
    const flat = form({ name: field.strict<string>('Marco') }, { equal });
    const flatInitial = flat();
    flat.name.set('Lia');
    flat.name.set('Marco');
    expect(flat()).toBe(flatInitial);
  });

  it('captures aggregate equality without tracking comparator reads or comparing initial storage', () => {
    const dependency = signal(0);
    const equal = vi.fn((a: { name: string }, b: { name: string }) => { dependency(); return a.name === b.name; });
    const options: { equal: (a: { name: string }, b: { name: string }) => boolean } = { equal };
    const declaration = computed(() => form({ name: field.strict<string>('Marco') }, options));
    const target = declaration();
    expect(target()).toEqual({ name: 'Marco' });
    expect(equal).not.toHaveBeenCalled();
    const observer = vi.fn(() => target());
    const observed = computed(observer);
    observed();
    target.name.set('Lia');
    observed();
    expect(equal).toHaveBeenCalledOnce();
    dependency.set(1);
    expect(declaration()).toBe(target);
    observed();
    expect(observer).toHaveBeenCalledTimes(2);
    expect(equal).toHaveBeenCalledOnce();
    options.equal = () => true;
    target.name.set('Mark');
    expect(target().name).toBe('Mark');
    expect(equal).toHaveBeenCalledTimes(2);
  });

  it('keeps committed model access usable when an exposed comparator throws and recovers on a later change', () => {
    const failure = new Error('Equality failed');
    let shouldThrow = true;
    const target = form({ name: field.strict<string>('Marco') }, {
      equal: (a, b) => { if (shouldThrow) throw failure; return a.name === b.name; },
    });
    target();
    target.name.set('Lia');
    expect(target.value.control()).toEqual({ name: 'Lia' });
    expect(() => target()).toThrow(failure);
    expect(target.name()).toBe('Lia');
    expect(() => target()).toThrow(failure);
    shouldThrow = false;
    target.name.set('Mark');
    expect(target()).toEqual({ name: 'Mark' });
  });

  it('keeps public and control values synchronized without configured equality', () => {
    const target = form({ name: field('Marco'), people: array({ name: field('Lia') }, { initialValue: 1 }) });
    expect(target()).toEqual(target.value.control());
    expect(target.people()).toEqual(target.people.value.control());
    target.name.set('Mark');
    target.people[0]!.name.set('Ada');
    expect(target()).toEqual({ name: 'Mark', people: [{ name: 'Ada' }] });
    expect(target()).toEqual(target.value.control());
    expect(target.people()).toEqual(target.people.value.control());
  });

  it('preserves aggregate values and validation when a field receives an equal value', () => {
    const validateField = vi.fn(({ value }: Context<unknown>) => { value(); return null; });
    const validateForm = vi.fn(({ value }: Context<unknown>) => { value(); return null; });
    const profile = form({
      details: form({ person: field({ name: 'Marco' }, [validateField], { equal: 'deep' }) }, [validateForm]),
    }, [validateForm]);
    const initial = profile();
    expect(profile.valid()).toBe(true);
    expect(validateField).toHaveBeenCalledOnce();
    expect(validateForm).toHaveBeenCalledTimes(2);
    profile.patch({ details: { person: { name: 'Marco' } } });
    expect(profile()).toBe(initial);
    expect(profile.valid()).toBe(true);
    expect(validateForm).toHaveBeenCalledTimes(2);
    profile.details.person.value.control.set({ name: 'Marco' });
    expect(profile.dirty()).toBe(true);
    expect(profile()).toBe(initial);
    profile.markAsTouched();
    profile.reset({ details: { person: { name: 'Marco' } } });
    expect(profile.pristine()).toBe(true);
    expect(profile.untouched()).toBe(true);
    expect(profile()).toBe(initial);
    profile.details.person.set({ name: 'Lia' });
    expect(profile.valid()).toBe(true);
    expect(profile()).not.toBe(initial);
    expect(validateField).toHaveBeenCalledTimes(2);
    expect(validateForm).toHaveBeenCalledTimes(4);
  });

  it.each([
    { target: 'field', withInjector: false },
    { target: 'field', withInjector: true },
    { target: 'form', withInjector: false },
    { target: 'form', withInjector: true },
  ])('keeps pending $target validation for equal values and cancels it for different values (injector: $withInjector)', async ({ target, withInjector }) => {
    const injector = withInjector ? Injector.create({ providers: [] }) : undefined;
    const abortSignals: AbortSignal[] = [];
    const finish: Array<(result: null) => void> = [];
    const validate = vi.fn((ctx: Context<unknown> & { abortSignal: AbortSignal }) => {
      ctx.value();
      abortSignals.push(ctx.abortSignal);
      return new Promise<null>((resolve) => { finish.push(resolve); });
    });
    const profile = form({
      details: { person: field({ name: 'Marco' }, target === 'field' ? [asyncValidator(validate)] : [], { equal: 'deep' }) },
    }, target === 'form' ? [asyncValidator(validate)] : [], injector ? { injector } : {});
    expect(profile.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();
    profile.details.person.set({ name: 'Marco' });
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();
    expect(abortSignals[0]!.aborted).toBe(false);
    profile.details.person.set({ name: 'Lia' });
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledTimes(2);
    expect(abortSignals[0]!.aborted).toBe(true);
    finish[0]!(null);
    expect(profile.pending()).toBe(true);
    finish[1]!(null);
    await Promise.resolve();
    await Promise.resolve();
    expect(profile.pending()).toBe(false);
    expect(profile.valid()).toBe(true);
    injector?.destroy();
  });

  it('preserves field equality in configured factories and cloned array templates', () => {
    const configured = createFormPrimitives({ nullable: false });
    const profile = configured.form({
      people: configured.array(configured.field({ name: 'Marco' }, { equal: 'deep' }), { initialValue: 1 }),
    });
    const first = profile.people[0]!;
    const initial = first();
    first.set({ name: 'Marco' });
    expect(first()).toBe(initial);
    const second = profile.people.push();
    const secondInitial = second();
    second.set({ name: 'Marco' });
    expect(second()).toBe(secondInitial);
  });

  it.each(['form', 'group'] as const)('constructs nested %s nodes in computed without tracking their mutable state', (kind) => {
    const initialName = signal('Marco');
    const locked = signal(false);
    const create = vi.fn(() => {
      const definitions = {
        details: { name: field(initialName(), [required]) },
        workflow: form({ city: field('Zurich') }),
      };
      const options = { get disabled() { return locked(); } };
      return kind === 'form' ? form(definitions, options) : group(definitions, options);
    });
    const model = computed(create);
    const first = model();
    expect(first()).toEqual({ details: { name: 'Marco' }, workflow: { city: 'Zurich' } });
    expect(first.details.parent()).toBe(first);
    expect(first.details.name.path()).toEqual(['details', 'name']);
    expect(first.details.name.root()).toBe(first);
    expect(first.workflow.city.form()).toBe(first.workflow);
    expect(first.valid()).toBe(true);

    first.details.name.set('');
    first.markAsTouched();
    first.details.name.setValidators([required]);
    first.setValidators([]);
    expect(first.invalid()).toBe(true);
    expect(first.details.name.touched()).toBe(true);
    expect(model()).toBe(first);
    expect(create).toHaveBeenCalledOnce();

    locked.set(true);
    const second = model();
    expect(second).not.toBe(first);
    expect(second.details.name.disabled()).toBe(true);
    expect(second.valid()).toBe(true);
    initialName.set('Noa');
    const third = model();
    expect(third.details.name()).toBe('Noa');
    expect(third.details.name.parent()).toBe(third.details);
    expect(create).toHaveBeenCalledTimes(3);
    expect(first.details.name()).toBe('');
  });

  it('tracks configured shorthand normalization while constructing a computed form', () => {
    const message = signal('First message');
    const configured = createFormPrimitives({
      get validatorMessages() { return { required: message() }; },
    });
    const model = computed(() => configured.form({ details: { name: '' } }));
    const first = model();
    first.details.name.setValidators([required]);
    expect(first.details.name.getError('required')?.message).toBe('First message');
    first.details.add('nickname', field('Lia'));
    expect(model()).toBe(first);

    message.set('Second message');
    const second = model();
    expect(second).not.toBe(first);
    second.details.name.setValidators([required]);
    expect(second.details.name.getError('required')?.message).toBe('Second message');
  });

  it.each(['field', 'form'] as const)('preserves reactive %s validation and injector ownership in computed forms', async (target) => {
    const firstInjector = Injector.create({ providers: [] });
    const secondInjector = Injector.create({ providers: [] });
    const owner = signal(firstInjector);
    const revision = signal(0);
    const abortSignals: AbortSignal[] = [];
    const validate = vi.fn((ctx: Context<unknown> & { abortSignal: AbortSignal }) => {
      ctx.value();
      revision();
      abortSignals.push(ctx.abortSignal);
      return new Promise<null>(() => {});
    });
    const create = vi.fn(() => {
      return form({
        details: { name: field('Marco', target === 'field' ? [asyncValidator(validate)] : []) },
      }, {
        validators: target === 'form' ? [asyncValidator(validate)] : [],
        get injector() { return owner(); },
      });
    });
    const model = computed(create);

    let firstDestroyed = false;
    try {
      const first = model();
      expect(first.pending()).toBe(true);
      expect(validate).not.toHaveBeenCalled();
      await Promise.resolve();
      await Promise.resolve();
      expect(validate).toHaveBeenCalledOnce();

      revision.set(1);
      await Promise.resolve();
      await Promise.resolve();
      expect(validate).toHaveBeenCalledTimes(2);
      expect(abortSignals[0]!.aborted).toBe(true);
      expect(model()).toBe(first);
      expect(create).toHaveBeenCalledOnce();

      owner.set(secondInjector);
      const second = model();
      expect(second).not.toBe(first);
      expect(second.pending()).toBe(true);
      await Promise.resolve();
      await Promise.resolve();
      expect(validate).toHaveBeenCalledTimes(3);
      firstInjector.destroy();
      firstDestroyed = true;
      expect(abortSignals[1]!.aborted).toBe(true);
      expect(abortSignals[2]!.aborted).toBe(false);
      expect(first.pending()).toBe(false);
      expect(second.pending()).toBe(true);
      expect(model()).toBe(second);
      expect(create).toHaveBeenCalledTimes(2);
    } finally {
      if (!firstDestroyed) firstInjector.destroy();
      secondInjector.destroy();
    }
    expect(abortSignals.every(controller => controller.aborted)).toBe(true);
  });

  it.each(['form', 'group'] as const)('initializes empty %s nodes inside computed declarations and tracks option getters', (kind) => {
    const locked = signal(false);
    const validate = vi.fn(() => ({ kind: 'required' }));
    const model = computed(() => {
      const options = {
        validators: validate,
        get disabled() { return locked(); },
        readonly: true,
        hidden: true,
      };
      return kind === 'form' ? form({}, options) : group({}, options);
    });
    const first = model();
    expect(first()).toEqual({});
    expect(first.value.control()).toEqual({});
    expect(first.disabled()).toBe(false);
    expect(first.readonly()).toBe(true);
    expect(first.hidden()).toBe(true);
    expect(first.valid()).toBe(true);
    expect(validate).not.toHaveBeenCalled();
    first.markAsWritable();
    first.show();
    expect(first.invalid()).toBe(true);
    expect(first.required()).toBe(true);
    expect(validate).toHaveBeenCalledOnce();

    locked.set(true);
    const second = model();
    expect(second).not.toBe(first);
    expect(second.disabled()).toBe(true);
    expect(second.readonly()).toBe(true);
    expect(second.hidden()).toBe(true);
    expect(second.valid()).toBe(true);
    expect(validate).toHaveBeenCalledOnce();
    second.enable();
    second.markAsWritable();
    second.show();
    expect(second.invalid()).toBe(true);
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('keeps extracted actions bound through child-name collisions and submission', async () => {
    const action = vi.fn();
    const profile = form({ set: field('initial'), details: { city: field('Zurich') } }, { onSubmit: action });
    const { set, update, patch, reset, add, remove, submit } = profile.$api;

    set({ set: 'next', details: { city: 'Bern' } });
    update(value => ({ ...value, set: `${value.set}!` }));
    patch({ details: { city: 'Basel' } });
    expect(profile()).toEqual({ set: 'next!', details: { city: 'Basel' } });

    const nickname = add('nickname', field('', [required]));
    expect(nickname.parent()).toBe(profile);
    expect(profile.invalid()).toBe(true);
    expect(await submit()).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(nickname.touched()).toBe(true);
    expect(profile.details.city.touched()).toBe(true);

    expect(remove('nickname')).toBe(nickname);
    expect(nickname.parent()).toBeNull();
    expect(profile.valid()).toBe(true);
    reset();
    expect(profile()).toEqual({ set: 'next!', details: { city: 'Basel' } });
    expect(profile.untouched()).toBe(true);
    reset({ set: 'ready', details: { city: 'Geneva' } });
    expect(await submit()).toBe(true);
    expect(action).toHaveBeenCalledExactlyOnceWith({ set: 'ready', details: { city: 'Geneva' } }, profile);
    expect(profile.submitting()).toBe(false);
  });

  it('exposes complete initial child values before the first aggregate validation', () => {
    const payload = { name: 'ready' };
    const expected = { details: { count: 0, enabled: false, payload, missing: undefined } };
    const observed: unknown[] = [];
    const profile = form({
      details: form({
        count: field.strict(0),
        enabled: field.strict(false),
        payload: field.strict(payload),
        missing: field(undefined),
      }),
    }, {
      validators: ({ value }) => {
        observed.push(value());
        return null;
      },
    });
    expect(profile()).toStrictEqual(expected);
    expect(profile.value.control()).toStrictEqual(expected);
    expect(profile().details.payload).toBe(payload);
    expect(profile.value.control().details.payload).toBe(payload);
    expect(observed).toEqual([]);
    expect(profile.valid()).toBe(true);
    expect(observed).toStrictEqual([expected]);
    expect(profile.pristine()).toBe(true);
    expect(profile.untouched()).toBe(true);
  });

  it.each([false, true])('aggregates the first async field validation after nested form construction (computed: %s)', async (inComputed) => {
    const observed: Array<string | null> = [];
    const validate = vi.fn(async ({ value }: Context<string | null>) => {
      observed.push(value());
      return { kind: 'unavailable' };
    });
    const create = () => {
      return form({ details: form({ name: field('initial', asyncValidator(validate)) }) });
    };
    const profile = inComputed ? computed(create)() : create();
    expect(profile()).toEqual({ details: { name: 'initial' } });
    expect(profile.value.control()).toEqual({ details: { name: 'initial' } });
    expect(profile.details.name.pending()).toBe(true);
    expect(profile.details.pending()).toBe(true);
    expect(profile.pending()).toBe(true);
    expect(validate).not.toHaveBeenCalled();

    await Promise.resolve();
    await Promise.resolve();

    expect(observed).toEqual(['initial']);
    expect(validate).toHaveBeenCalledOnce();
    expect(profile.pending()).toBe(false);
    expect(profile.details.pending()).toBe(false);
    expect(profile.details.name.pending()).toBe(false);
    expect(profile.invalid()).toBe(true);
    expect(profile.details.invalid()).toBe(true);
    expect(profile.allErrors()).toMatchObject([{ kind: 'unavailable', targetNode: profile.details.name }]);
    expect(profile.pristine()).toBe(true);
  });

  it('propagates validation from a computed field with initial availability through nested forms', () => {
    const validate = vi.fn(() => ({ kind: 'required' }));
    const model = computed(() => field('', [validate], { disabled: 'Locked', readonly: true, hidden: true }));
    const name = model();
    const profile = form({ details: form({ name }) });
    expect(profile.valid()).toBe(true);
    expect(profile.details.valid()).toBe(true);
    expect(profile.allErrors()).toEqual([]);
    expect(validate).not.toHaveBeenCalled();

    name.enable();
    name.markAsWritable();
    expect(profile.valid()).toBe(true);
    expect(validate).not.toHaveBeenCalled();
    name.show();
    expect(profile.invalid()).toBe(true);
    expect(profile.details.invalid()).toBe(true);
    expect(profile.allErrors()).toMatchObject([{ kind: 'required', targetNode: name }]);
    expect(validate).toHaveBeenCalledOnce();
    expect(profile.pristine()).toBe(true);
    expect(profile.untouched()).toBe(true);
    expect(model()).toBe(name);
  });

  it('tracks interaction state read through validator node aliases', () => {
    const validate = vi.fn((ctx: { node: Signal<AnyNode & { touched: Signal<boolean>; dirty: Signal<boolean> }>; field: Signal<AnyNode & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
      return ctx.node().touched() && ctx.field().dirty() ? { kind: 'edited' } : null;
    });
    const model = form({ name: field('initial') }, { validators: validate });

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
    const params = vi.fn((ctx: { node: Signal<AnyNode & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
      return ctx.node().dirty();
    });
    const states: boolean[] = [];
    const onError = vi.fn((_error: unknown, ctx: { node: Signal<AnyNode & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
      return ctx.node().dirty() ? { kind: 'edited' } : null;
    });
    const validate = vi.fn(async (ctx: { params: boolean; field: Signal<AnyNode & { touched: Signal<boolean>; dirty: Signal<boolean> }> }) => {
      states.push(ctx.field().dirty());
      throw new Error('Unavailable');
    });
    const validators = asyncValidator({
      when: ctx => ctx.node().touched(),
      params,
      validate,
      onError,
    });
    const model = form({ name: field('initial') }, { validators });

    expect(model.valid()).toBe(true);
    expect(params).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    model.markAsTouched({ skipDescendants: true });
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
    const references: Signal<AnyNode>[] = [];
    const validators = (context: { field: Signal<AnyNode>; node: Signal<AnyNode> }) => {
      references.push(context.field);
      expect(context.node).toBe(context.field);
      expect(isSignal(context.field)).toBe(true);
      expect(Object.hasOwn(context.field, 'set')).toBe(false);
      return null;
    };
    const node = form({ name: field('initial') }, { validators });
    expect(node.errors()).toEqual([]);
    const readIdentity = vi.fn(() => references[0]!());
    const identity = computed(readIdentity);
    const readValue = vi.fn(() => references[0]!()());
    const value = computed(readValue);
    expect(identity()).toBe(node);
    expect(value()).toEqual(node());

    node.set({ name: 'updated' });
    expect(node.errors()).toEqual([]);
    expect(references.at(-1)).toBe(references[0]);
    expect(identity()).toBe(node);
    expect(value()).toEqual({ name: 'updated' });
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
    const references: Signal<AnyNode>[] = [];
    const params = vi.fn((context: { field: Signal<AnyNode>; node: Signal<AnyNode> }) => {
      references.push(context.field);
      expect(context.node).toBe(context.field);
      return readValue() ? context.field()() : context.field();
    });
    const validate = vi.fn(async () => null);
    const validators = asyncValidator({ params, validate });
    const node = form({ name: field('initial') }, { validators });
    expect(node.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(params).toHaveBeenCalledTimes(1);
    expect(node.pending()).toBe(false);
    expect(references[0]!()).toBe(node);

    node.set({ name: 'updated' });
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

    node.set({ name: 'final' });
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

  it('creates shorthand descendants with configured field defaults', () => {
    const { form: configuredForm } = createFormPrimitives({ nullable: false });
    const explicit = field('existing');
    const birthday = new Date('1990-06-15T00:00:00.000Z');
    const profile = configuredForm({
      name: '',
      birthday,
      roles: ['admin'],
      explicit,
      address: { city: '' },
    });

    expect(profile()).toEqual({
      name: '',
      birthday,
      roles: ['admin'],
      explicit: 'existing',
      address: { city: '' },
    });
    expect(profile.name.nodeType()).toBe('field');
    expect(profile.address.nodeType()).toBe('group');
  });

  it('lets explicit subtree messages override configured primitive defaults', () => {
    const { form: configuredForm } = createFormPrimitives({
      validatorMessages: { required: 'Configured required.' },
    });
    const profile = configuredForm({
      name: field('', [required]),
    }, {
      validatorMessages: { required: 'Profile required.' },
    });

    expect(profile.name.getError('required')?.message).toBe('Profile required.');
  });

  it('accepts positional validators and options on configured forms', () => {
    const { form: configuredForm } = createFormPrimitives({ inheritInjector: false });
    const profile = configuredForm(
      { name: field('') },
      [required],
      { inheritInjector: true },
    );

    expect(profile.invalid()).toBe(false);
  });

  it('keeps configured defaults for dynamically added shorthand descendants', () => {
    const { form: configuredForm } = createFormPrimitives({ nullable: false });
    const profile = configuredForm({ name: '' });

    const added = profile.add({ nickname: '', address: { city: '' } });

    expect(added.nickname()).toBe('');
    expect(added.address.city()).toBe('');
  });

  it('exposes its public node type', () => {
    const profile = form({ name: field('') });

    expect(profile.nodeType()).toBe('form');
    expect(profile.$api.nodeType()).toBe('form');
  });

  it('normalizes concise values to fields and plain objects to groups', () => {
    const birthday = new Date('1990-06-15T00:00:00.000Z');
    const profile = form({
      name: '',
      age: null,
      siblings: 2,
      birthday,
      sister: undefined,
      address: {
        city: 'Zurich',
      },
    });

    expect(profile()).toEqual({
      name: '',
      age: null,
      siblings: 2,
      birthday,
      sister: undefined,
      address: { city: 'Zurich' },
    });
    profile.name.set('Marco');
    profile.address.city.set('Bern');

    expect(profile.name()).toBe('Marco');
    expect(profile.address.city()).toBe('Bern');
  });

  it('normalizes every supported atomic shorthand category consistently', () => {
    const uniqueValue = Symbol('value');
    const calculate = (value: number) => value * 2;
    const createdAt = new Date('2026-09-03T00:00:00.000Z');
    const roles = ['admin'];
    const values = form({
      text: 'draft',
      count: 1,
      enabled: false,
      largeCount: 1n,
      uniqueValue,
      empty: null,
      missing: undefined,
      createdAt,
      calculate,
      roles,
    });

    expect(values()).toEqual({
      text: 'draft',
      count: 1,
      enabled: false,
      largeCount: 1n,
      uniqueValue,
      empty: null,
      missing: undefined,
      createdAt,
      calculate,
      roles,
    });
    expect([
      values.text,
      values.count,
      values.enabled,
      values.largeCount,
      values.uniqueValue,
      values.empty,
      values.missing,
      values.createdAt,
      values.calculate,
      values.roles,
    ].map(nodeTypeOf)).toEqual(Array.from({ length: 10 }, () => 'field'));
    expect(values.roles()).toBe(roles);
  });

  it('normalizes a real Moment instance to a field and preserves its identity', () => {
    const appointment = moment('2026-09-03T14:30:00Z');
    const booking = form({ appointment });

    expect(nodeTypeOf(booking.appointment)).toBe('field');
    expect(booking.appointment()).toBe(appointment);
    expect(booking.appointment()?.toISOString()).toBe('2026-09-03T14:30:00.000Z');
  });

  it('normalizes empty, populated, tuple, and nested array values to fields', () => {
    const coordinates = [47.37, 8.54] as const;
    const companies = [{ companyId: 23, companyName: 'Apple' }];
    const values = form({ empty: [], roles: ['admin'], coordinates, matrix: [[1, 2], [3, 4]], companies });

    expect(values()).toEqual({ empty: [], roles: ['admin'], coordinates, matrix: [[1, 2], [3, 4]], companies });
    expect([values.empty, values.roles, values.coordinates, values.matrix, values.companies].map(nodeTypeOf))
      .toEqual(['field', 'field', 'field', 'field', 'field']);
    expect(values.coordinates()).toBe(coordinates);
    expect(values.companies()).toBe(companies);
  });

  it('preserves special atomic shorthand values at every nested depth', () => {
    const invalidDate = new Date(Number.NaN);
    const marker = Symbol('marker');
    const values = form({
      emptyText: '',
      disabledFlag: false,
      notANumber: Number.NaN,
      positiveInfinity: Number.POSITIVE_INFINITY,
      negativeInfinity: Number.NEGATIVE_INFINITY,
      negativeZero: -0,
      largeCount: 1n,
      marker,
      invalidDate,
      empty: null,
      missing: undefined,
      nested: {
        invalidDate,
        negativeZero: -0,
      },
    });

    expect(values.emptyText()).toBe('');
    expect(values.disabledFlag()).toBe(false);
    expect(values.notANumber()).toBeNaN();
    expect(values.positiveInfinity()).toBe(Number.POSITIVE_INFINITY);
    expect(values.negativeInfinity()).toBe(Number.NEGATIVE_INFINITY);
    expect(Object.is(values.negativeZero(), -0)).toBe(true);
    expect(values.largeCount()).toBe(1n);
    expect(values.marker()).toBe(marker);
    expect(values.invalidDate()).toBe(invalidDate);
    expect(values.empty()).toBeNull();
    expect(values.missing()).toBeUndefined();
    expect(values.nested.invalidDate()).toBe(invalidDate);
    expect(Object.is(values.nested.negativeZero(), -0)).toBe(true);
  });

  it('validates structural declaration surfaces without evaluating accessors', () => {
    const read = vi.fn(() => 'unsafe');
    const accessorDefinition = {
      profile: Object.defineProperty({}, 'name', { enumerable: true, get: read }),
    };
    const nonIdentifierAccessorDefinition = {
      profile: Object.defineProperty({}, 'postal-code', { enumerable: true, get: read }),
    };
    const symbolKey = Symbol('secret');
    const symbolDefinition = { [symbolKey]: field('hidden') };
    const prototypeDefinition = Object.fromEntries([['__proto__', field('unsafe')]]);

    expect(() => form(accessorDefinition as never)).toThrow(
      'form: accessor shorthand is not supported at "profile.name"; declare a data property with an explicit node or, if this object is intended as a field value, wrap it with field(value)',
    );
    expect(read).not.toHaveBeenCalled();
    expect(() => form(nonIdentifierAccessorDefinition as never)).toThrow(
      'form: accessor shorthand is not supported at "profile[\\"postal-code\\"]"; declare a data property with an explicit node or, if this object is intended as a field value, wrap it with field(value)',
    );
    expect(read).not.toHaveBeenCalled();
    expect(() => form(symbolDefinition as never)).toThrow(
      'form: symbol child key Symbol(secret) is not supported; use a string key, or if this object is intended as a field value, wrap it with field(value)',
    );
    expect(() => form(prototypeDefinition as never)).toThrow(
      'form: unsafe child key "__proto__" is not supported at "__proto__"; if this object is intended as a field value, wrap it with field(value)',
    );
    const nestedArray = form({ profile: { 'postal-code': ['8000'] } });
    expect(nestedArray.profile['postal-code'].nodeType()).toBe('field');
  });

  it('uses only own enumerable properties from a declaration', () => {
    const inherited = { inherited: field('ignored') };
    const own = field('included');
    const definitions = Object.create(inherited) as { own: typeof own; inherited?: typeof own };
    definitions.own = own;
    Object.defineProperty(definitions, 'hidden', { enumerable: false, value: field('ignored') });

    const values = form(definitions);

    expect(values()).toEqual({ own: 'included' });
    expect(Reflect.get(values.children, 'inherited')).toBeUndefined();
    expect(Reflect.get(values.children, 'hidden')).toBeUndefined();
  });

  it('makes an implicit field behaviorally equivalent to field(value)', () => {
    const profile = form({ implicit: '', explicit: field('') });

    expect(profile.implicit.nodeType()).toBe('field');
    expect(profile.implicit.parent()).toBe(profile);
    expect(profile.explicit.parent()).toBe(profile);
    expect(profile.implicit.form()).toBe(profile);
    expect(profile.implicit.path()).toEqual(['implicit']);
    expect(profile.explicit.path()).toEqual(['explicit']);

    profile.implicit.setValidators(required);
    profile.explicit.setValidators(required);
    expect(profile.implicit.errors().map(({ kind, message }) => ({ kind, message }))).toEqual(
      profile.explicit.errors().map(({ kind, message }) => ({ kind, message })),
    );

    profile.set({ implicit: 'set', explicit: 'set' });
    expect(profile.implicit()).toBe(profile.explicit());
    profile.patch({ implicit: 'patched', explicit: 'patched' });
    expect(profile.implicit()).toBe(profile.explicit());

    profile.implicit.markAsTouched();
    profile.explicit.markAsTouched();
    profile.implicit.markAsDirty();
    profile.explicit.markAsDirty();
    profile.reset({ implicit: 'reset', explicit: 'reset' });

    expect(profile.implicit()).toBe(profile.explicit());
    expect(profile.implicit.touched()).toBe(profile.explicit.touched());
    expect(profile.implicit.dirty()).toBe(profile.explicit.dirty());
    expect(profile.implicit.errors().map(({ kind, message }) => ({ kind, message }))).toEqual(
      profile.explicit.errors().map(({ kind, message }) => ({ kind, message })),
    );
  });

  it('propagates availability and injector ownership equally to implicit and explicit fields', async () => {
    const dependency = signal(0);
    const implicitValidator = vi.fn(async () => {
      dependency();
      return null;
    });
    const explicitValidator = vi.fn(async () => {
      dependency();
      return null;
    });
    const injector = Injector.create({ providers: [] });
    const unavailable = form({ implicit: '', explicit: field('') }, {
      disabled: true,
      readonly: true,
    });

    expect(unavailable.implicit.disabled()).toBe(true);
    expect(unavailable.explicit.disabled()).toBe(true);
    expect(unavailable.implicit.readonly()).toBe(true);
    expect(unavailable.explicit.readonly()).toBe(true);

    const profile = form({ implicit: '', explicit: field('') }, { injector });
    profile.implicit.setValidators(asyncValidator(implicitValidator));
    profile.explicit.setValidators(asyncValidator(explicitValidator));

    expect(profile.implicit.pending()).toBe(true);
    expect(profile.explicit.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(implicitValidator).toHaveBeenCalledOnce();
    expect(explicitValidator).toHaveBeenCalledOnce();

    injector.destroy();
    dependency.set(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(implicitValidator).toHaveBeenCalledOnce();
    expect(explicitValidator).toHaveBeenCalledOnce();
  });

  it.each([
    new RegExp('forms'),
    new URL('https://example.com'),
    new Map([['name', 'Marco']]),
    new Set(['admin']),
    new Uint8Array([1, 2]),
    new (class { })(),
    new (class Account { name = 'Marco'; })(),
    () => 'computed',
  ])('normalizes non-plain objects and functions to fields', (value) => {
    const concise = form({ value });
    expect(nodeTypeOf(concise.value)).toBe('field');
    expect(concise.value()).toBe(value);
  });

  it('accepts null-prototype objects as structural group shorthand', () => {
    const address = Object.assign(Object.create(null), { city: 'Zurich' }) as { city: string };
    const profile = form({ address });

    expect(nodeTypeOf(profile.address)).toBe('group');
    expect(profile.address.city()).toBe('Zurich');
    expect(profile()).toEqual({ address: { city: 'Zurich' } });
  });

  it('normalizes inline and pretyped plain objects to equivalent groups', () => {
    type Company = { companyId: number; companyName: string };
    const defaultCompany: Company = { companyId: 23, companyName: 'Apple' };
    const profile = form({
      inlineCompany: { companyId: 7, companyName: 'Google' },
      company: defaultCompany,
    });

    expect(profile()).toEqual({
      inlineCompany: { companyId: 7, companyName: 'Google' },
      company: { companyId: 23, companyName: 'Apple' },
    });
    expect(nodeTypeOf(profile.inlineCompany)).toBe('group');
    expect(nodeTypeOf(profile.company)).toBe('group');
    expect(profile.inlineCompany.companyName()).toBe('Google');
    expect(profile.company.companyName()).toBe('Apple');
  });

  it('normalizes an inline company object to a group and a class instance to a field', () => {
    class User { }
    const user = new User();
    const myForm = form({
      company: { companyId: 23, companyName: 'Apple' },
      user,
    });

    expect(myForm.company.nodeType()).toBe('group');
    expect(myForm.company()).toEqual({ companyId: 23, companyName: 'Apple' });
    expect(myForm.user.nodeType()).toBe('field');
    expect(myForm.user()).toBe(user);
  });

  it('uses the runtime prototype when a structural annotation hides a class instance', () => {
    type Company = { companyId: number; companyName: string };
    class CompanyModel implements Company {
      companyId = 23;
      companyName = 'Apple';
    }
    const company: Company = new CompanyModel();

    const profile = form({ company });
    expect(profile.company()).toBe(company);
    expect(profile.company.nodeType()).toBe('field');
  });

  it('preserves every explicit node definition without wrapping it', () => {
    const explicitField = field('Marco');
    const explicitGroup = group({ city: field('Zurich') });
    const explicitForm = form({ step: field(1) });
    const explicitArray = array(field(''));
    const root = form({ explicitField, explicitGroup, explicitForm, explicitArray });

    expect(root.explicitField).toBe(explicitField);
    expect(root.explicitGroup).toBe(explicitGroup);
    expect(root.explicitForm).toBe(explicitForm);
    expect(root.explicitArray).toBe(explicitArray);
    expect([
      nodeTypeOf(root.explicitField),
      nodeTypeOf(root.explicitGroup),
      nodeTypeOf(root.explicitForm),
      nodeTypeOf(root.explicitArray),
    ]).toEqual(['field', 'group', 'form', 'array']);
  });

  it('aggregates between errors from nested numeric fields', () => {
    const reservation = form({ guests: field(11, [between(1, 10)]) });

    expect(reservation.invalid()).toBe(true);
    expect(reservation.errors()).toEqual([]);
    expect(reservation.allErrors()).toContainEqual(expect.objectContaining({
      kind: 'between',
      min: 1,
      max: 10,
      actual: 11,
      targetNode: reservation.guests,
    }));
    reservation.guests.set(10);
    expect(reservation.valid()).toBe(true);
  });

  it('aggregates dateBetween errors from nested date fields', () => {
    const booking = form({
      departure: field<Date>(new Date('2027-01-01'), [dateBetween('2026-01-01', '2026-12-31')]),
    });

    expect(booking.invalid()).toBe(true);
    expect(booking.allErrors()).toContainEqual(expect.objectContaining({
      kind: 'dateBetween',
      minDate: new Date('2026-01-01T00:00:00.000Z'),
      maxDate: new Date('2026-12-31T00:00:00.000Z'),
      actual: new Date('2027-01-01T00:00:00.000Z'),
      targetNode: booking.departure,
    }));
    booking.departure.set(new Date('2026-06-01'));
    expect(booking.valid()).toBe(true);
  });

  it('reactively validates a field against a sibling without exposing either value', () => {
    const password = field('secret');
    const profile = form({
      password,
      confirmation: field('different', [equalTo(() => password())]),
    });

    expect(profile.confirmation.errors()).toEqual([{
      kind: 'equalTo',
      message: 'Please enter the matching value.',
      targetNode: profile.confirmation,
    }]);
    expect(profile.confirmation.errors()[0]).not.toHaveProperty('actual');
    expect(profile.confirmation.errors()[0]).not.toHaveProperty('expected');

    profile.confirmation.set('secret');
    expect(profile.confirmation.errors()).toEqual([]);

    profile.password.set('changed');
    expect(profile.confirmation.getError('equalTo')?.message).toBe('Please enter the matching value.');
  });

  it('submits valid forms, exposes submitting state through the tree, and prevents concurrent submissions', async () => {
    let resolve!: () => void;
    const pendingAction = new Promise<void>((done) => { resolve = done; });
    const action = vi.fn(() => pendingAction);
    const profile = form({ name: field('Marco'), details: form({ age: field(42) }) }, { onSubmit: action });

    const first = profile.submit();

    expect(profile.submitting()).toBe(true);
    expect(profile.name.submitting()).toBe(true);
    expect(profile.details.submitting()).toBe(true);
    expect(profile.touched()).toBe(true);
    expect(profile.name.touched()).toBe(true);
    expect(action).toHaveBeenCalledWith({ name: 'Marco', details: { age: 42 } }, profile);
    expect(await profile.submit()).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);

    resolve();
    expect(await first).toBe(true);
    expect(profile.submitting()).toBe(false);
    expect(profile.name.submitting()).toBe(false);
    expect(profile.details.submitting()).toBe(false);
  });

  it('blocks invalid submissions by default and supports validation override options', async () => {
    const action = vi.fn();
    const onSubmitBlocked = vi.fn();
    const blocked = form({ name: field('', [required]) }, { onSubmit: action, onSubmitBlocked });

    expect(await blocked.submit()).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(onSubmitBlocked).toHaveBeenCalledWith(blocked);
    expect(blocked.name.touched()).toBe(true);

    const forced = form({ name: field('', [required]) }, {
      onSubmit: action, submitWhen: 'always',
    });
    expect(await forced.submit()).toBe(true);
    expect(action).toHaveBeenCalledWith({ name: '' }, forced);
    expect(forced.invalid()).toBe(true);
    expect(forced.name.getError('required')).toBeDefined();
  });

  it('allows pending validation by default and can require fully valid state', async () => {
    const action = vi.fn();
    const unresolved = new Promise<null>(() => { });
    const allowingPending = form({
      name: field('Marco', [asyncValidator(() => unresolved)]),
    }, { onSubmit: action });
    const requiringValid = form({
      name: field('Marco', [asyncValidator(() => unresolved)]),
    }, { onSubmit: action, submitWhen: 'valid' });

    expect(allowingPending.pending()).toBe(true);
    expect(await allowingPending.submit()).toBe(true);
    expect(await requiringValid.submit()).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('blocks pending nested validation immediately and submits only on a later explicit attempt', async () => {
    let resolveValidation!: (result: null) => void;
    const validation = new Promise<null>((resolve) => { resolveValidation = resolve; });
    const validate = vi.fn(() => validation);
    const onSubmit = vi.fn();
    const onSubmitBlocked = vi.fn();
    const nestedSubmit = vi.fn();
    const profile = form({
      details: form({ name: field('Marco', [asyncValidator(validate)]) }, { onSubmit: nestedSubmit }),
    }, { onSubmit, onSubmitBlocked, submitWhen: 'valid' });

    expect(profile.pending()).toBe(true);
    await vi.waitFor(() => expect(validate).toHaveBeenCalledTimes(1));
    expect(profile.invalid()).toBe(false);
    expect(await profile.submit()).toBe(false);
    expect(onSubmitBlocked).toHaveBeenCalledExactlyOnceWith(profile);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(profile.submitting()).toBe(false);
    expect(profile.details.name.touched()).toBe(true);

    resolveValidation(null);
    await vi.waitFor(() => expect(profile.valid()).toBe(true));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(await profile.submit()).toBe(true);
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ details: { name: 'Marco' } }, profile);
    expect(nestedSubmit).not.toHaveBeenCalled();
    expect(onSubmitBlocked).toHaveBeenCalledTimes(1);
    expect(profile.submitting()).toBe(false);
    expect(profile.details.submitting()).toBe(false);

    expect(await profile.details.submit()).toBe(true);
    expect(nestedSubmit).toHaveBeenCalledExactlyOnceWith({ name: 'Marco' }, profile.details);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('allows explicit not-invalid submission while pending and does not report concurrent attempts as blocked', async () => {
    let finish!: () => void;
    const saving = new Promise<void>((resolve) => { finish = resolve; });
    const onSubmit = vi.fn(() => saving);
    const onSubmitBlocked = vi.fn();
    const profile = form({
      name: field('Marco', [asyncValidator(() => new Promise<null>(() => {}))]),
    }, { onSubmit, onSubmitBlocked, submitWhen: 'not-invalid' });

    const result = profile.submit();
    expect(profile.pending()).toBe(true);
    expect(profile.submitting()).toBe(true);
    expect(profile.name.submitting()).toBe(true);
    expect(await profile.submit()).toBe(false);
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ name: 'Marco' }, profile);
    expect(onSubmitBlocked).not.toHaveBeenCalled();

    finish();
    expect(await result).toBe(true);
    expect(profile.submitting()).toBe(false);
    expect(profile.name.submitting()).toBe(false);
    expect(profile.pending()).toBe(true);
  });

  it('tolerates submission without an action and always clears submitting after rejection', async () => {
    const onSubmitBlocked = vi.fn();
    const withoutSubmission = form({ name: field('Marco') }, { onSubmitBlocked, submitWhen: 'valid' });
    expect(await withoutSubmission.submit()).toBe(false);
    expect(onSubmitBlocked).not.toHaveBeenCalled();
    expect(withoutSubmission.touched()).toBe(true);
    expect(withoutSubmission.name.touched()).toBe(true);

    const failure = new Error('submit failed');
    const profile = form({ name: field('Marco') }, {
      onSubmit: () => Promise.reject(failure),
    });
    await expect(profile.submit()).rejects.toBe(failure);
    expect(profile.submitting()).toBe(false);
  });

  it('starts synchronous submission actions immediately and clears state on promise completion', async () => {
    const action = vi.fn();
    const profile = form({ details: { name: field('Marco') } }, { onSubmit: action });

    const completion = profile.submit();
    expect(action).toHaveBeenCalledExactlyOnceWith({ details: { name: 'Marco' } }, profile);
    expect(profile.submitting()).toBe(true);
    expect(profile.details.submitting()).toBe(true);
    expect(profile.details.name.touched()).toBe(true);
    const concurrent = profile.submit();
    expect(action).toHaveBeenCalledOnce();

    await Promise.resolve();
    expect(profile.submitting()).toBe(false);
    expect(profile.details.submitting()).toBe(false);
    expect(await completion).toBe(true);
    expect(await concurrent).toBe(false);
  });

  it('rejects synchronous action failures and clears submitting before returning', async () => {
    const failure = new Error('Synchronous action failure');
    const action = vi.fn(() => { throw failure; });
    const profile = form({ name: field('Marco') }, { onSubmit: action });

    const completion = profile.submit();
    expect(action).toHaveBeenCalledOnce();
    expect(profile.submitting()).toBe(false);
    expect(profile.name.submitting()).toBe(false);
    expect(profile.name.touched()).toBe(true);
    await expect(completion).rejects.toBe(failure);
  });

  it('rejects synchronous invalid-submission callback failures without starting the action', async () => {
    const failure = new Error('Invalid submission callback failure');
    const action = vi.fn();
    const onSubmitBlocked = vi.fn(() => { throw failure; });
    const profile = form({ name: field('', [required]) }, { onSubmit: action, onSubmitBlocked });

    const completion = profile.submit();
    expect(onSubmitBlocked).toHaveBeenCalledExactlyOnceWith(profile);
    expect(action).not.toHaveBeenCalled();
    expect(profile.submitting()).toBe(false);
    expect(profile.name.touched()).toBe(true);
    await expect(completion).rejects.toBe(failure);
  });

  it('waits for promise-like submission actions before clearing inherited submitting state', async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    const then = vi.fn();
    const promiseLike: PromiseLike<void> = {
      then(onfulfilled, onrejected) {
        then();
        return pending.then(onfulfilled, onrejected);
      },
    };
    const action = vi.fn(() => promiseLike);
    const profile = form({ details: form({ name: field('Marco') }) }, { onSubmit: action });

    const completion = profile.submit();
    expect(action).toHaveBeenCalledOnce();
    expect(then).not.toHaveBeenCalled();
    expect(profile.details.submitting()).toBe(true);
    await Promise.resolve();
    expect(then).toHaveBeenCalledOnce();
    expect(profile.details.submitting()).toBe(true);

    finish();
    expect(await completion).toBe(true);
    expect(profile.submitting()).toBe(false);
    expect(profile.details.submitting()).toBe(false);
  });

  it('aggregates a dynamic array child through the public form api', () => {
    const profile = form({
      name: field('Marco'),
      sons: array(() => ({ name: field(''), age: field(23) }), [{ name: 'Mono', age: 11 }]),
    });

    expect(profile()).toEqual({ name: 'Marco', sons: [{ name: 'Mono', age: 11 }] });
    profile.sons.push({ name: 'Lia', age: 7 });
    expect(profile()).toEqual({
      name: 'Marco',
      sons: [{ name: 'Mono', age: 11 }, { name: 'Lia', age: 7 }],
    });
    expect(profile.dirty()).toBe(false);
  });

  it('aggregates a unique-items error owned by a nested array', () => {
    const profile = form({
      names: array(field(''), ['Marco', 'Marco'], [uniqueItems()]),
    });

    expect(profile.invalid()).toBe(true);
    expect(profile.errors()).toEqual([]);
    expect(profile.allErrors()).toMatchObject([{
      kind: 'uniqueItems',
      duplicateIndexes: [0, 1],
      targetNode: profile.names,
    }]);

    profile.names[1]!.set('Lia');
    expect(profile.valid()).toBe(true);
  });

  it('grows an array child through form.set and propagates the complete value', () => {
    const factory = vi.fn(() => ({ name: field(''), age: field(0) }));
    const profile = form({
      owner: field('Marco'),
      sons: array(factory, [{ name: 'son1', age: 11 }]),
    });
    const first = profile.sons[0]!;

    profile.set({
      owner: 'Marcos',
      sons: [{ name: 'son1 updated', age: 12 }, { name: 'son2', age: 15 }],
    });

    expect(profile()).toEqual({
      owner: 'Marcos',
      sons: [{ name: 'son1 updated', age: 12 }, { name: 'son2', age: 15 }],
    });
    expect(profile.value()).toEqual(profile());
    expect(profile.sons.length()).toBe(2);
    expect(profile.sons[0]).toBe(first);
    expect(profile.sons[1]!.parent()).toBe(profile.sons);
    expect(profile.sons[1]!.path()).toEqual(['sons', '1']);
    expect(profile.sons[1]!.name.path()).toEqual(['sons', '1', 'name']);
    expect(profile.sons[1]!.form()).toBe(profile);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(profile.dirty()).toBe(false);
  });

  it('normalizes a null array branch passed through form.set', () => {
    const profile = form({ sons: array(field(''), ['Marco']) });
    const first = profile.sons[0]!;

    profile.set({ sons: null });

    expect(profile()).toEqual({ sons: [] });
    expect(profile.sons.length()).toBe(0);
    expect(first.parent()).toBeNull();
  });

  it('shrinks and empties an array child through form.set while detaching removed nodes', () => {
    const profile = form({
      sons: array(
        { name: field(''), age: field(0) },
        [{ name: 'son1', age: 11 }, { name: 'son2', age: 15 }, { name: 'son3', age: 18 }],
      ),
    });
    const first = profile.sons[0]!;
    const second = profile.sons[1]!;
    const third = profile.sons[2]!;

    profile.set({ sons: [{ name: 'only son', age: 12 }] });

    expect(profile()).toEqual({ sons: [{ name: 'only son', age: 12 }] });
    expect(profile.sons.length()).toBe(1);
    expect(profile.sons[0]).toBe(first);
    expect(second.parent()).toBeNull();
    expect(second.path()).toEqual([]);
    expect(third.parent()).toBeNull();
    expect(third.path()).toEqual([]);

    profile.set({ sons: [] });

    expect(profile()).toEqual({ sons: [] });
    expect(profile.sons.length()).toBe(0);
    expect(profile.sons[0]).toBeUndefined();
    expect(first.parent()).toBeNull();
    expect(first.path()).toEqual([]);
  });

  it('can regrow an array child through form.set after it was emptied', () => {
    const profile = form({ sons: array({ name: field(''), age: field(0) }) });

    profile.set({ sons: [] });
    profile.set({ sons: [{ name: 'son1', age: 11 }, { name: 'son2', age: 15 }] });

    expect(profile()).toEqual({
      sons: [{ name: 'son1', age: 11 }, { name: 'son2', age: 15 }],
    });
    expect(profile.sons[0]!.path()).toEqual(['sons', '0']);
    expect(profile.sons[1]!.path()).toEqual(['sons', '1']);
    expect(profile.sons.every(son => son.parent() === profile.sons)).toBe(true);
  });

  it('exposes its public api directly on the form', () => {
    const profile = form({ age: field(23) });

    expect(profile.value).toBe(profile.api.value);
    expect(profile.disabled).toBe(profile.api.disabled);
    expect(profile.set).toBe(profile.api.set);
    expect(profile.patch).toBe(profile.api.patch);
    expect(profile.reset).toBe(profile.api.reset);

    profile.disable();
    expect(profile.disabled()).toBe(true);
    profile.enable();
    expect(profile.enabled()).toBe(true);
    profile.patch({ age: 30 });
    expect(profile()).toEqual({ age: 30 });
  });

  it('exposes a stable children map with the same node instances', () => {
    const profile = form({
      name: field('David'),
      address: { city: field('Zurich') },
    });

    expect(profile.children).toBe(profile.api.children);
    expect(profile.children.name).toBe(profile.name);
    expect(profile.children.address).toBe(profile.address);
    expect(profile.children.address.children.city).toBe(profile.address.city);
  });

  it('gives a child named api precedence while preserving $api', () => {
    const apiField = field('child api');
    const profile = form({ api: apiField, age: field(23) });

    expect(profile.api).toBe(apiField);
    expect(profile.api()).toBe('child api');
    expect(profile.$api.children.api).toBe(apiField);
    expect(profile.$api.value()).toEqual({ api: 'child api', age: 23 });

    profile.$api.patch({ api: 'updated' });
    expect(profile()).toEqual({ api: 'updated', age: 23 });
  });

  it('gives a child named root precedence while preserving the ancestry lookup through $api', () => {
    const rootField = field('child root');
    const profile = form({ root: rootField, age: field(23) });

    expect(profile.root).toBe(rootField);
    expect(profile.root()).toBe('child root');
    expect(profile.$api.root()).toBe(profile);
  });

  it('gives the real $api runtime precedence over illegally declared children', () => {
    const illegalRootField = field('root child');
    const illegalNestedField = field('nested child');
    const profile = form({
      $api: illegalRootField,
      nested: { $api: illegalNestedField },
    } as any) as any;

    expect(profile.$api).not.toBe(illegalRootField);
    expect(profile.$api.value()).toEqual({
      $api: 'root child',
      nested: { $api: 'nested child' },
    });
    expect(profile.$api.children.$api).toBe(illegalRootField);

    expect(profile.nested.$api).not.toBe(illegalNestedField);
    expect(profile.nested.$api.value()).toEqual({ $api: 'nested child' });
    expect(profile.nested.$api.children.$api).toBe(illegalNestedField);
  });

  it('gives a child named children precedence while preserving api.children', () => {
    const childrenField = field('child');
    const profile = form({ children: childrenField, age: field(23) });

    expect(profile.children).toBe(childrenField);
    expect(profile.children()).toBe('child');
    expect(profile.api.children.children).toBe(childrenField);
    expect(profile.api.children.age).toBe(profile.age);
  });

  it('gives children precedence over native function members', () => {
    const controls = {
      apply: field('apply'),
      arguments: field('arguments'),
      bind: field('bind'),
      call: field('call'),
      caller: field('caller'),
      constructor: field('constructor'),
      length: field('length'),
      name: field('name'),
      prototype: field('prototype'),
      toString: field('toString'),
    };
    const formGroup = form(controls);

    expect(formGroup.apply).toBe(controls.apply);
    expect(formGroup.arguments).toBe(controls.arguments);
    expect(formGroup.bind).toBe(controls.bind);
    expect(formGroup.call).toBe(controls.call);
    expect(formGroup.caller).toBe(controls.caller);
    expect(formGroup.constructor).toBe(controls.constructor);
    expect(formGroup.length).toBe(controls.length);
    expect(formGroup.name).toBe(controls.name);
    expect(formGroup.prototype).toBe(controls.prototype);
    expect(formGroup.toString).toBe(controls.toString);
    expect(formGroup.apply()).toBe('apply');
    expect(formGroup.arguments()).toBe('arguments');
    expect(formGroup.constructor()).toBe('constructor');
    expect(formGroup.name()).toBe('name');
  });

  it('gives child nodes precedence over colliding direct api members', () => {
    const readonlyField = field(false);
    const disabledField = field('child');
    const resetField = field('reset child');
    const profile = form({
      age: field(23),
      readonly: readonlyField,
      disabled: disabledField,
      reset: resetField,
    });

    expect(profile.readonly).toBe(readonlyField);
    expect(profile.disabled).toBe(disabledField);
    expect(profile.reset).toBe(resetField);
    expect(profile.readonly()).toBe(false);
    expect(profile.disabled()).toBe('child');
    expect(profile.reset()).toBe('reset child');
    expect(profile.api.readonly()).toBe(false);
    expect(profile.api.disabled()).toBe(false);

    profile.api.markAsReadonly();
    profile.api.disable();
    profile.api.reset({ age: 30, readonly: true, disabled: 'updated', reset: 'updated reset' });

    expect(profile.readonly()).toBe(true);
    expect(profile.disabled()).toBe('updated');
    expect(profile.reset()).toBe('updated reset');
    expect(profile.api.readonly()).toBe(true);
    expect(profile.api.disabled()).toBe(true);
  });

  it('allows a synchronous field validator to read its owning class form on its first execution', () => {
    class ProfileComponent {
      readonly profile = form({
        name: field<string>(undefined, [required]),
        age: field(23, {
          validators: [({ value }) => {
            if (!this.profile.name()) return { kind: 'missingSiblingName' };
            return value()! > 120 ? { kind: 'maximumAge' } : null;
          }],
        }),
      });
    }

    const component = new ProfileComponent();

    expect(() => component.profile.age.errors()).not.toThrow();
    expect(component.profile.age.errors()).toMatchObject([{ kind: 'missingSiblingName' }]);
    component.profile.name.set('David');
    expect(component.profile.age.errors()).toEqual([]);
  });

  it('allows an asynchronous field validator to read its owning class form on its first execution', async () => {
    const validate = vi.fn(async (name: string | null | undefined) => {
      return name === null || name === undefined ? { kind: 'missingSiblingName' } : null;
    });
    class ProfileComponent {
      readonly profile = form({
        name: field<string>(undefined, [required]),
        age: field(23, [asyncValidator(async (): Promise<{ kind: string } | null> => {
          return validate(this.profile.name());
        },
        )]),
      });
    }

    const component = new ProfileComponent();

    expect(validate).not.toHaveBeenCalled();
    expect(component.profile.age.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(component.profile.age.errors()).toMatchObject([{ kind: 'missingSiblingName' }]);
    component.profile.name.set('David');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledTimes(2);
    expect(component.profile.age.errors()).toEqual([]);
  });

  it('exposes paths from the root to nested nodes', () => {
    const profile = form({
      name: field('David'),
      address: {
        city: field('Zurich'),
      },
    });

    expect(profile.api.path()).toEqual([]);
    expect(profile.name.api.path()).toEqual(['name']);
    expect(profile.address.api.path()).toEqual(['address']);
    expect(profile.address.city.api.path()).toEqual(['address', 'city']);
    expect(profile.keyInParent()).toBeNull();
    expect(profile.name.keyInParent()).toBe('name');
    expect(profile.address.keyInParent()).toBe('address');
    expect(profile.address.city.keyInParent()).toBe('city');
    expect(profile.api.parent()).toBeNull();
    expect(profile.name.api.parent()).toBe(profile);
    expect(profile.address.api.parent()).toBe(profile);
    expect(profile.address.city.api.parent()).toBe(profile.address);
    expect(profile.api.form()).toBe(profile);
    expect(profile.api.root()).toBe(profile);
    expect(profile.name.api.form()).toBe(profile);
    expect(profile.name.api.root()).toBe(profile);
    expect(profile.address.api.form()).toBe(profile);
    expect(profile.address.api.root()).toBe(profile);
    expect(profile.address.city.api.form()).toBe(profile);
    expect(profile.address.city.api.root()).toBe(profile);
  });

  it('exposes tree navigation through a field synchronous validator api', () => {
    let validatorApi: unknown;
    let validatorField: unknown;
    let validatorForm: unknown;
    let validatorRoot: unknown;
    let validatorParent: unknown;
    let validatorPath: readonly string[] = [];
    const profile = form({
      address: {
        city: field('Zurich', [(context) => {
          validatorApi = context.node().api;
          validatorField = context.field();
          validatorForm = context.node().form();
          validatorRoot = context.node().root();
          validatorParent = context.parent();
          validatorPath = context.path();
          return null;
        }]),
      },
    });

    expect(profile.address.city.errors()).toEqual([]);
    expect(validatorApi).toBe(profile.address.city.api);
    expect(validatorField).toBe(profile.address.city);
    expect(validatorForm).toBe(profile);
    expect(validatorRoot).toBe(profile);
    expect(validatorParent).toBe(profile.address);
    expect(validatorPath).toEqual(['address', 'city']);
    expect(profile.address.city.api.path()).toEqual(['address', 'city']);
    expect(profile.address.city.api.parent()).toBe(profile.address);
    expect(profile.address.city.api.form()).toBe(profile);
  });

  it('exposes form and root ancestry to synchronous form validators', () => {
    let validatorApi: unknown;
    let validatorField: unknown;
    const profile = form({ name: field('David') }, [(context) => {
      validatorApi = context.node().api;
      validatorField = context.field();
      return null;
    }]);

    expect(profile.api.errors()).toEqual([]);
    expect(validatorApi).toBe(profile.api);
    expect(validatorField).toBe(profile);
    expect(profile.api.path()).toEqual([]);
    expect(profile.api.parent()).toBeNull();
    expect(profile.api.form()).toBe(profile);
  });

  it('keeps a nested form as validator workflow owner while tracking its structural root', async () => {
    const ancestry: [unknown, unknown][] = [];
    const payment = form({ card: field('4242') }, {
      validators: asyncValidator(async ({ node }) => {
        ancestry.push([node().form(), node().root()]);
        return null;
      }),
    });
    const checkout = form({ cartId: field('cart') });

    expect(payment.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(ancestry.at(-1)).toEqual([payment, payment]);

    checkout.add('payment', payment);
    await Promise.resolve();
    await Promise.resolve();
    expect(ancestry.at(-1)).toEqual([payment, checkout]);

    checkout.remove('payment');
    await Promise.resolve();
    await Promise.resolve();
    expect(ancestry.at(-1)).toEqual([payment, payment]);
  });

  it('exposes each field under its own key', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    expect(formGroup.age()).toBe(23);
    expect(formGroup.city.value()).toBe('Zurich');
  });

  it('aggregates the value of its fields', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    expect(formGroup.api.value()).toEqual({ age: 23, city: 'Zurich' });
    expect(formGroup()).toEqual({ age: 23, city: 'Zurich' });
  });

  it('reflects a field change in the form value', () => {
    const formGroup = form({ age: field(23) });
    formGroup.age.set(30);
    expect(formGroup.api.value()).toEqual({ age: 30 });
  });

  it('aggregates only committed values while a nested control update is debouncing', async () => {
    vi.useFakeTimers();
    try {
      const validate = vi.fn(({ value }: Context<{ address: { city: string | null } }>) => {
        value();
        return null;
      });
      const profile = form(
        { address: { city: field('Zurich', { debounce: 100 }) } },
        { validators: [validate] },
      );

      expect(profile.errors()).toEqual([]);
      expect(validate).toHaveBeenCalledOnce();

      profile.address.city.value.control.set('Bern');

      expect(profile.address.city.value.control()).toBe('Bern');
      expect(profile.address.city.value()).toBe('Zurich');
      expect(profile.address.value()).toEqual({ city: 'Zurich' });
      expect(profile.value()).toEqual({ address: { city: 'Zurich' } });
      expect(profile.value.control()).toEqual({ address: { city: 'Zurich' } });
      expect(validate).toHaveBeenCalledOnce();

      profile.address.city.flush();

      expect(profile.address.value()).toEqual({ city: 'Bern' });
      expect(profile.value()).toEqual({ address: { city: 'Bern' } });
      expect(profile.value.control()).toEqual({ address: { city: 'Bern' } });
      expect(profile.errors()).toEqual([]);
      expect(validate).toHaveBeenCalledTimes(2);
      await vi.runAllTimersAsync();
      expect(profile.value()).toEqual({ address: { city: 'Bern' } });
    } finally {
      vi.useRealTimers();
    }
  });

  it('inherits control debounce and flushes only the requested form subtree', async () => {
    vi.useFakeTimers();
    try {
      const profile = form({
        name: field('Marco'),
        address: form({
          city: field('Zurich'),
          country: field('Switzerland', { debounce: 0 }),
        }),
      }, { debounce: 100 });

      profile.name.value.control.set('Mark');
      profile.address.city.value.control.set('Bern');
      profile.address.country.value.control.set('Germany');

      expect(profile()).toEqual({
        name: 'Marco',
        address: { city: 'Zurich', country: 'Germany' },
      });
      expect(profile.debouncing()).toBe(true);
      expect(profile.address.debouncing()).toBe(true);
      expect(profile.address.country.debouncing()).toBe(false);

      profile.address.flush();

      expect(profile()).toEqual({
        name: 'Marco',
        address: { city: 'Bern', country: 'Germany' },
      });
      expect(profile.address.debouncing()).toBe(false);
      expect(profile.debouncing()).toBe(true);

      profile.flush();

      expect(profile()).toEqual({
        name: 'Mark',
        address: { city: 'Bern', country: 'Germany' },
      });
      expect(profile.debouncing()).toBe(false);
      await vi.runAllTimersAsync();
    } finally {
      vi.useRealTimers();
    }
  });

  it('debounces a control bound directly to the form independently from its children', async () => {
    vi.useFakeTimers();
    try {
      const profile = form({ name: field('Marco', { debounce: 0 }) }, { debounce: 100 });
      const internal = profile as unknown as InternalNode;

      internal.$api._setControlValue({ name: 'Mark' });

      expect(profile.value.control()).toEqual({ name: 'Mark' });
      expect(profile()).toEqual({ name: 'Marco' });
      expect(profile.name.value.control()).toBe('Marco');
      expect(profile.debouncing()).toBe(true);
      expect(profile.dirty()).toBe(true);

      await vi.advanceTimersByTimeAsync(100);

      expect(profile()).toEqual({ name: 'Mark' });
      expect(profile.name.dirty()).toBe(false);
      expect(profile.debouncing()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('discards a pending direct form control value after a descendant changes', async () => {
    vi.useFakeTimers();
    try {
      const profile = form({ name: field('Marco') }, { debounce: 100 });
      (profile as unknown as InternalNode).$api._setControlValue({ name: 'stale' });

      profile.name.set('current');

      expect(profile.value.control()).toEqual({ name: 'current' });
      expect(profile.debouncing()).toBe(false);
      await vi.runAllTimersAsync();
      expect(profile()).toEqual({ name: 'current' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('flushes its own and selected descendant buffers when marked as touched', () => {
    const profile = form({ name: field('Marco') }, { debounce: 'blur' });
    profile.name.value.control.set('child');

    profile.markAsTouched({ skipDescendants: true });

    expect(profile()).toEqual({ name: 'Marco' });
    expect(profile.name.value.control()).toBe('child');
    expect(profile.name.touched()).toBe(false);
    expect(profile.debouncing()).toBe(true);

    profile.markAsTouched();

    expect(profile()).toEqual({ name: 'child' });
    expect(profile.name.touched()).toBe(true);
    expect(profile.debouncing()).toBe(false);

    (profile as unknown as InternalNode).$api._setControlValue({ name: 'aggregate' });
    profile.markAsTouched({ skipDescendants: true });

    expect(profile()).toEqual({ name: 'aggregate' });
    expect(profile.debouncing()).toBe(false);
  });

  it('completes only current custom control work and propagates reset and rejection', async () => {
    const completions = Array.from({ length: 4 }, () => {
      let resolve!: () => void;
      let reject!: (reason: Error) => void;
      const promise = new Promise<void>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
      });
      return { promise, resolve, reject };
    });
    const abortSignals: AbortSignal[] = [];
    const debounce = vi.fn((signal: AbortSignal) => {
      abortSignals.push(signal);
      return completions[abortSignals.length - 1]!.promise;
    });
    const root = form({ target: form({ name: field('initial') }, { debounce }) });
    const target = root.target;
    const { _setControlValue: setControlValue } = (target as unknown as InternalNode).$api;

    setControlValue({ name: 'first' });
    setControlValue({ name: 'latest' });
    expect(debounce).toHaveBeenCalledTimes(2);
    expect(abortSignals.map(signal => signal.aborted)).toEqual([true, false]);
    expect(target()).toEqual({ name: 'initial' });
    expect(target.value.control()).toEqual({ name: 'latest' });
    expect(root.debouncing()).toBe(true);
    expect(root.dirty()).toBe(true);

    completions[0]!.reject(new Error('Stale completion'));
    await Promise.resolve();
    expect(target()).toEqual({ name: 'initial' });
    expect(root.debouncing()).toBe(true);

    completions[1]!.resolve();
    await Promise.resolve();
    expect(target()).toEqual({ name: 'latest' });
    expect(target.value.control()).toEqual({ name: 'latest' });
    expect(root.debouncing()).toBe(false);

    setControlValue({ name: 'cancelled' });
    root.reset();
    expect(abortSignals[2]!.aborted).toBe(true);
    expect(root.debouncing()).toBe(false);
    expect(root.pristine()).toBe(true);
    completions[2]!.resolve();
    await Promise.resolve();
    expect(target()).toEqual({ name: 'latest' });

    setControlValue({ name: 'rejected' });
    completions[3]!.reject(new Error('Current completion'));
    await Promise.resolve();
    expect(debounce).toHaveBeenCalledTimes(4);
    expect(target()).toEqual({ name: 'latest' });
    expect(target.value.control()).toEqual({ name: 'latest' });
    expect(root.debouncing()).toBe(false);
    expect(root.dirty()).toBe(true);
  });

  it('aborts and restores a pending direct control value on reset', () => {
    let abortSignal!: AbortSignal;
    const profile = form({ name: field('Marco') }, {
      debounce: (signal) => {
        abortSignal = signal;
        return new Promise<void>(() => { });
      },
    });
    (profile as unknown as InternalNode).$api._setControlValue({ name: 'pending' });

    profile.reset();

    expect(abortSignal.aborted).toBe(true);
    expect(profile.value.control()).toEqual({ name: 'Marco' });
    expect(profile()).toEqual({ name: 'Marco' });
    expect(profile.pristine()).toBe(true);
    expect(profile.debouncing()).toBe(false);
  });

  it('uses the nearest configured ancestor control debounce', async () => {
    vi.useFakeTimers();
    try {
      const profile = form({
        name: field('Marco'),
        address: form({ city: field('Zurich') }, { debounce: 50 }),
      }, { debounce: 100 });

      profile.name.value.control.set('Mark');
      profile.address.city.value.control.set('Bern');
      await vi.advanceTimersByTimeAsync(50);

      expect(profile.name()).toBe('Marco');
      expect(profile.address.city()).toBe('Bern');
      expect(profile.debouncing()).toBe(true);

      await vi.advanceTimersByTimeAsync(50);

      expect(profile.name()).toBe('Mark');
      expect(profile.debouncing()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('inherits blur debounce and reports it through the form', () => {
    const profile = form({ name: field('initial') }, { debounce: 'blur' });

    profile.name.value.control.set('pending');
    expect(profile.name()).toBe('initial');
    expect(profile.debouncing()).toBe(true);

    (profile.name as unknown as InternalNode).$api._flushControlValueOnBlur();
    expect(profile()).toEqual({ name: 'pending' });
    expect(profile.debouncing()).toBe(false);
  });

  it('inherits an asynchronous control debouncer into descendant fields', async () => {
    let resolve!: () => void;
    const profile = form({ name: field('initial') }, {
      debounce: () => new Promise<void>((done) => { resolve = done; }),
    });

    profile.name.value.control.set('pending');
    expect(profile()).toEqual({ name: 'initial' });
    expect(profile.debouncing()).toBe(true);

    resolve();
    await Promise.resolve();
    expect(profile()).toEqual({ name: 'pending' });
    expect(profile.debouncing()).toBe(false);
  });

  it('includes the value of nested forms', () => {
    const formGroup = form({
      age: field(23),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    expect(formGroup.api.value()).toEqual({
      age: 23,
      address: { city: 'Zurich', country: 'CH' },
    });
  });

  it('creates nested forms from plain objects', () => {
    const formGroup = form({
      name: field('David'),
      address: {
        city: field('Moscow'),
        country: field('Russia'),
      },
    });
    expect(formGroup.api.value()).toEqual({
      name: 'David',
      address: { city: 'Moscow', country: 'Russia' },
    });
    expect(formGroup.address.city()).toBe('Moscow');
    expect(formGroup.address.api.value()).toEqual({ city: 'Moscow', country: 'Russia' });
  });

  it('supports shorthand objects at multiple nesting levels', () => {
    const formGroup = form({
      profile: {
        address: {
          city: field('Moscow'),
        },
      },
    });
    formGroup.profile.address.city.set('Zurich');
    expect(formGroup()).toEqual({ profile: { address: { city: 'Zurich' } } });
  });

  it('propagates parent state through shorthand nested groups', () => {
    const formGroup = form({ address: { city: field('Moscow') } });
    formGroup.api.disable();
    expect(formGroup.address.api.disabled()).toBe(true);
    expect(formGroup.address.city.disabled()).toBe(true);
    formGroup.api.enable();
    formGroup.api.markAsReadonly();
    expect(formGroup.address.api.readonly()).toBe(true);
    expect(formGroup.address.city.readonly()).toBe(true);
  });

  it('gives access to nested fields', () => {
    const formGroup = form({
      address: form({ city: field('Zurich') }),
    });
    expect(formGroup.address.city()).toBe('Zurich');
    expect(formGroup.address.api.value()).toEqual({ city: 'Zurich' });
  });

  it('propagates a nested field change up to the root', () => {
    const formGroup = form({
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.city.set('Madrid');
    expect(formGroup.api.value()).toEqual({ address: { city: 'Madrid' } });
  });

  it('assigns every value through set', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    formGroup.api.set({ age: 30, city: 'Madrid' });
    expect(formGroup.api.value()).toEqual({ age: 30, city: 'Madrid' });
  });

  it('walks down into nested forms on set', () => {
    const formGroup = form({
      age: field(23),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.set({ age: 30, address: { city: 'Madrid', country: 'ES' } });
    expect(formGroup.api.value()).toEqual({
      age: 30,
      address: { city: 'Madrid', country: 'ES' },
    });
  });

  it('updates programmatically from the complete form value', () => {
    const formGroup = form({
      name: field('Marco'),
      address: form({ city: field('Zurich') }),
    });

    formGroup.update(value => ({
      ...value,
      name: 'Mark',
      address: { ...value.address, city: 'Bern' },
    }));

    expect(formGroup()).toEqual({ name: 'Mark', address: { city: 'Bern' } });
    expect(formGroup.pristine()).toBe(true);
  });

  it('only touches the given keys on patch', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    formGroup.api.patch({ age: 30 });
    expect(formGroup.api.value()).toEqual({ age: 30, city: 'Zurich' });
  });

  it('patches nested forms partially', () => {
    const formGroup = form({
      age: field(23),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.patch({ address: { country: 'ES' } });
    expect(formGroup.api.value()).toEqual({
      age: 23,
      address: { city: 'Zurich', country: 'ES' },
    });
  });

  it('ignores unknown keys on patch', () => {
    const formGroup = form({ age: field(23) });
    formGroup.api.patch({ age: 30, nope: 1 } as any);
    expect(formGroup.api.value()).toEqual({ age: 30 });
  });

  it('is valid with no validators and no invalid children', () => {
    const formGroup = form({ age: field(23) });
    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
    expect(formGroup.api.invalid()).toBe(false);
  });

  it('reports its own validator through errors', () => {
    const sameCity = ({ value }: Context<{ city: string | null; billingCity: string | null }>) => {
      return value().city === value().billingCity ? null : { kind: 'sameCity' };
    };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [sameCity],
    );
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'sameCity' }]);
    expect(formGroup.api.errors()[0]!.targetNode).toBe(formGroup);
    expect(formGroup.api.valid()).toBe(false);
  });

  it('reevaluates a cross-field validator when a field changes', () => {
    const sameCity = ({ value }: Context<{ city: string | null; billingCity: string | null }>) => {
      return value().city === value().billingCity ? null : { kind: 'sameCity' };
    };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [sameCity],
    );
    formGroup.billingCity.set('Zurich');
    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
  });

  it('reacts to external signals read by a synchronous form validator', () => {
    const blocked = signal(false);
    const validate = vi.fn(() => blocked() ? { kind: 'blocked' } : null);
    const formGroup = form({ name: field('David') }, [validate]);

    expect(formGroup.api.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledOnce();

    blocked.set(true);

    expect(formGroup.api.errors()).toMatchObject([{ kind: 'blocked' }]);
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('conditionally applies a synchronous form validator returned by another validator', () => {
    const enabled = signal(false);
    const sameCity = vi.fn(({ value }: Context<{ city: string | null; billingCity: string | null }>) => {
      return value().city === value().billingCity ? null : { kind: 'sameCity' };
    });
    const formGroup = form(
      { city: field('Zurich'), billingCity: field('Madrid') },
      [() => enabled() ? sameCity : null],
    );

    expect(formGroup.api.errors()).toEqual([]);
    expect(sameCity).not.toHaveBeenCalled();

    enabled.set(true);

    expect(formGroup.api.errors()).toMatchObject([{ kind: 'sameCity' }]);
    expect(sameCity).toHaveBeenCalledOnce();

    enabled.set(false);

    expect(formGroup.api.errors()).toEqual([]);
    expect(sameCity).toHaveBeenCalledOnce();
  });

  it('accepts one form validator and conditionally resolves a returned validator array', () => {
    const enabled = signal(false);
    const first = () => ({ kind: 'first' });
    const second = () => ({ kind: 'second' });
    const validate = () => enabled() ? [first, second] : null;
    const formGroup = form({ name: field('David') }, validate);

    expect(formGroup.api.validators()).toEqual([validate]);
    expect(formGroup.api.errors()).toEqual([]);

    enabled.set(true);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'first' }, { kind: 'second' }]);

    formGroup.api.setValidators(first);
    expect(formGroup.api.validators()).toEqual([first]);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'first' }]);
  });

  it('filters empty entries from the configured form-validator array', () => {
    const invalid = () => ({ kind: 'invalid' });
    const formGroup = form({ name: field('David') }, [invalid, null, undefined]);

    expect(formGroup.api.validators()).toEqual([invalid]);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'invalid' }]);
  });

  it('filters empty entries from a returned form-validator array', () => {
    const invalid = () => ({ kind: 'invalid' });
    const formGroup = form({ name: field('David') }, () => [invalid, null, undefined]);

    expect(formGroup.api.errors()).toMatchObject([{ kind: 'invalid' }]);
  });

  it('is invalid when a child is invalid, even without own errors', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({ city: field('', [required]) });
    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(false);
    expect(formGroup.api.invalid()).toBe(true);
  });

  it('reports only its own active required error', () => {
    const ownRequired = form({ name: field('David') }, [() => ({ kind: 'required' })]);
    const configuredRequired = form({ name: field('David') }, [required]);
    const childRequired = form({ name: field('', [required]) });

    expect(ownRequired.required()).toBe(true);
    expect(ownRequired.api.required()).toBe(true);
    expect(configuredRequired.errors()).toEqual([]);
    expect(configuredRequired.required()).toBe(true);
    expect(childRequired.name.required()).toBe(true);
    expect(childRequired.required()).toBe(false);
  });

  it('is not required without an own required validator or required error', () => {
    const withoutValidators = form({ name: field('David') });
    const unrelatedValidator = form({ name: field('David') }, [() => ({ kind: 'unrelated' })]);

    expect(withoutValidators.required()).toBe(false);
    expect(withoutValidators.api.required()).toBe(false);
    expect(unrelatedValidator.required()).toBe(false);
  });

  it('aggregates a child requiredIf rule when its condition changes', () => {
    const requireName = signal(false);
    const formGroup = form({
      name: field('', [requiredIf(() => requireName())]),
    });

    expect(formGroup.valid()).toBe(true);
    expect(formGroup.name.required()).toBe(false);

    requireName.set(true);
    expect(formGroup.invalid()).toBe(true);
    expect(formGroup.name.getError('required')).toMatchObject({ kind: 'required' });
    expect(formGroup.name.required()).toBe(true);

    formGroup.name.set('David');
    expect(formGroup.valid()).toBe(true);
  });

  it('aggregates a child built-in validator controlled by when', () => {
    const requireName = signal(false);
    const formGroup = form({
      name: field('', [required({ when: () => requireName() })]),
    });

    expect(formGroup.valid()).toBe(true);

    requireName.set(true);
    expect(formGroup.invalid()).toBe(true);
    expect(formGroup.name.required()).toBe(true);

    requireName.set(false);
    expect(formGroup.valid()).toBe(true);
    expect(formGroup.name.required()).toBe(false);
  });

  it('returns only the first matching own form error', () => {
    const formGroup = form({
      name: field('', [required]),
    }, [
      () => ({ kind: 'formError', message: 'First' }),
      () => ({ kind: 'formError', message: 'Second' }),
    ]);

    expect(formGroup.getError('formError')).toMatchObject({ kind: 'formError', message: 'First' });
    expect(formGroup.getError('formError')?.targetNode).toBe(formGroup);
    expect(formGroup.api.getError('formError')).toBe(formGroup.getError('formError'));
    expect(formGroup.getError('required')).toBeUndefined();
  });

  it('collects own and descendant errors in structural tree order', () => {
    const formGroup = form({
      name: field('', [required]),
      address: form({
        city: field('', [() => ({ kind: 'cityError' })]),
      }, [() => ({ kind: 'addressError' })]),
    }, [() => ({ kind: 'formError' })]);

    expect(formGroup.errors().map(error => error.kind)).toEqual(['formError']);
    expect(formGroup.allErrors().map(error => error.kind)).toEqual([
      'formError',
      'required',
      'addressError',
      'cityError',
    ]);
    expect(formGroup.allErrors().map(error => error.targetNode)).toEqual([
      formGroup,
      formGroup.name,
      formGroup.address,
      formGroup.address.city,
    ]);

    formGroup.name.set('David');

    expect(formGroup.allErrors().map(error => error.kind)).toEqual([
      'formError',
      'addressError',
      'cityError',
    ]);
    expect(formGroup.api.allErrors()).toBe(formGroup.allErrors());
  });

  it('gives a child named getError precedence over the form method', () => {
    const getErrorField = field('child');
    const formGroup = form({ getError: getErrorField }, [() => ({ kind: 'formError' })]);

    expect(formGroup.getError).toBe(getErrorField);
    expect(formGroup.getError()).toBe('child');
    expect(formGroup.api.getError('formError')).toMatchObject({ kind: 'formError' });
  });

  it('gives a child named allErrors precedence over the form signal', () => {
    const allErrorsField = field('child');
    const formGroup = form({ allErrors: allErrorsField }, [() => ({ kind: 'formError' })]);

    expect(formGroup.allErrors).toBe(allErrorsField);
    expect(formGroup.allErrors()).toBe('child');
    expect(formGroup.api.allErrors().map(error => error.kind)).toEqual(['formError']);
  });

  it('gives a child named required precedence over the form required signal', () => {
    const requiredField = field('child');
    const formGroup = form({ required: requiredField }, [() => ({ kind: 'required' })]);

    expect(formGroup.required).toBe(requiredField);
    expect(formGroup.required()).toBe('child');
    expect(formGroup.api.required()).toBe(true);
  });

  it('focuses safely without bindings and gives a child named focus precedence', () => {
    const focusField = field('child');
    const formGroup = form({ focus: focusField, name: field('David') });

    expect(formGroup.focus).toBe(focusField);
    expect(formGroup.focus()).toBe('child');
    expect(() => formGroup.api.focus()).not.toThrow();
  });

  it('derives validationStatus from synchronous child validation', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({ city: field('', [required]) });

    expect(formGroup.api.validationStatus()).toBe('invalid');
    expect(formGroup.api.valid()).toBe(false);
    expect(formGroup.api.invalid()).toBe(true);

    formGroup.city.set('Zurich');

    expect(formGroup.api.validationStatus()).toBe('valid');
    expect(formGroup.api.valid()).toBe(true);
    expect(formGroup.api.invalid()).toBe(false);
  });

  it('runs its own asynchronous validator and exposes its validation state', async () => {
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [
        asyncValidator(async ({ value }) => {
          return value().city === value().billingCity ? null : { kind: 'citiesDoNotMatch' };
        },
        ),
      ],
    );

    expect(formGroup.api.pending()).toBe(true);
    expect(formGroup.api.validationStatus()).toBe('unknown');

    await Promise.resolve();
    await Promise.resolve();

    expect(formGroup.api.pending()).toBe(false);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'citiesDoNotMatch' }]);
    expect(formGroup.api.validationStatus()).toBe('invalid');
  });

  it('suppresses aggregate pending state while non-interactive and restores it afterwards', () => {
    const formGroup = form({
      name: field('David', [asyncValidator(() => new Promise<null>(() => { }))]),
    });
    expect(formGroup.pending()).toBe(true);

    formGroup.disable();
    expect(formGroup.pending()).toBe(false);
    expect(formGroup.valid()).toBe(true);
    formGroup.enable();
    expect(formGroup.pending()).toBe(true);

    formGroup.markAsReadonly();
    expect(formGroup.pending()).toBe(false);
    expect(formGroup.valid()).toBe(true);
    formGroup.markAsWritable();
    expect(formGroup.pending()).toBe(true);

    formGroup.hide();
    expect(formGroup.pending()).toBe(false);
    expect(formGroup.valid()).toBe(true);
    formGroup.show();
    expect(formGroup.pending()).toBe(true);
  });

  it('remains pending until every form-level asynchronous validator finishes', async () => {
    let resolveFirst!: (result: { kind: string }) => void;
    let resolveSecond!: (result: { kind: string }) => void;
    const formGroup = form({ country: field('Switzerland') }, [
      asyncValidator(() => new Promise<{ kind: string }>((resolve) => { resolveFirst = resolve; })),
      asyncValidator(() => new Promise<{ kind: string }>((resolve) => { resolveSecond = resolve; })),
    ]);

    await Promise.resolve();
    resolveSecond({ kind: 'second' });
    await Promise.resolve();
    await Promise.resolve();

    expect(formGroup.api.errors()).toMatchObject([{ kind: 'second' }]);
    expect(formGroup.api.pending()).toBe(true);
    expect(formGroup.api.validationStatus()).toBe('invalid');

    resolveFirst({ kind: 'first' });
    await Promise.resolve();
    await Promise.resolve();

    expect(formGroup.api.errors()).toMatchObject([{ kind: 'first' }, { kind: 'second' }]);
    expect(formGroup.api.pending()).toBe(false);
  });

  it('reruns its asynchronous validator when a signal read by it changes', async () => {
    const allowedCountry = signal('Switzerland');
    const validate = vi.fn(async ({ value }: Context<{ country: string | null }>) => {
      return value().country === allowedCountry() ? null : { kind: 'countryNotAllowed' };
    });
    const formGroup = form({ country: field('Switzerland') }, [asyncValidator(validate)]);

    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(formGroup.api.errors()).toEqual([]);

    allowedCountry.set('Germany');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledTimes(2);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'countryNotAllowed' }]);
  });

  it('stops form-level reactive validation when its owning injector is destroyed', async () => {
    const allowedCountry = signal('Switzerland');
    const validate = vi.fn(async ({ value }: Context<{ country: string | null }>) => {
      return value().country === allowedCountry() ? null : { kind: 'countryNotAllowed' };
    });
    const injector = Injector.create({ providers: [] });
    const formGroup = form(
      { country: field('Switzerland') },
      [asyncValidator(validate)],
      { injector },
    );

    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    injector.destroy();
    allowedCountry.set('Germany');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(formGroup.api.pending()).toBe(false);
    expect(formGroup.api.errors()).toEqual([]);
  });

  it('inherits async-validation ownership from an ancestor form injector', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const address = form(
      { city: field('Zurich') },
      [asyncValidator(validate)],
    );
    const injector = Injector.create({ providers: [] });
    form({ address }, { injector });

    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(address.pending()).toBe(false);
  });

  it('stops injector inheritance at a nested form boundary', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const city = field('Zurich', [asyncValidator(validate)]);
    const address = form({ city }, { inheritInjector: false });
    const injector = Injector.create({ providers: [] });
    form({ address }, { injector });

    await Promise.resolve();
    await Promise.resolve();
    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('aborts pending form-level validation when its owning injector is destroyed', async () => {
    let abortSignal: AbortSignal | undefined;
    let resolveValidation!: (result: { kind: string } | null) => void;
    const injector = Injector.create({ providers: [] });
    const formGroup = form(
      { country: field('Switzerland') },
      [asyncValidator(({ abortSignal: currentSignal }) => {
        abortSignal = currentSignal;
        return new Promise((resolve) => { resolveValidation = resolve; });
      })],
      { injector },
    );

    await Promise.resolve();
    expect(formGroup.api.pending()).toBe(true);

    injector.destroy();
    expect(abortSignal?.aborted).toBe(true);
    expect(formGroup.api.pending()).toBe(false);

    resolveValidation({ kind: 'lateError' });
    await Promise.resolve();
    await Promise.resolve();
    expect(formGroup.api.errors()).toEqual([]);
  });

  it('restarts its debounced asynchronous validation when a descendant changes', async () => {
    vi.useFakeTimers();
    const validate = vi.fn(async ({ value }: Context<{ country: string | null }>) => {
      return value().country === 'Germany' ? { kind: 'countryNotAllowed' } : null;
    });
    const formGroup = form(
      { country: field('Switzerland') },
      [asyncValidator(validate, { debounce: 100 })],
    );

    await Promise.resolve();
    formGroup.country.set('Germany');
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(100);

    expect(validate).toHaveBeenCalledTimes(2);
    expect(formGroup.api.pending()).toBe(false);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'countryNotAllowed' }]);
    vi.useRealTimers();
  });

  it('passes an explicit reactive params snapshot to its asynchronous validator', async () => {
    const allowedCountry = signal('Switzerland');
    const validate = vi.fn(async ({ params }: { params: { allowed: string; country: string | null } }) => {
      return params.country === params.allowed ? null : { kind: 'countryNotAllowed' };
    });
    const formGroup = form({ country: field('Switzerland') }, [asyncValidator({
      params: ({ value }) => ({ allowed: allowedCountry(), country: value().country }),
      validate,
    })]);

    await Promise.resolve();
    await Promise.resolve();
    expect(formGroup.api.errors()).toEqual([]);

    allowedCountry.set('Germany');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { allowed: 'Germany', country: 'Switzerland' },
    }));
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'countryNotAllowed' }]);
  });

  it('reactively includes or excludes its asynchronous validator through when', async () => {
    const enabled = signal(false);
    const validate = vi.fn(async () => ({ kind: 'countryNotAllowed' }));
    const formGroup = form({ country: field('Switzerland') }, [asyncValidator(validate, {
      when: () => enabled(),
    })]);

    expect(formGroup.api.valid()).toBe(true);
    expect(validate).not.toHaveBeenCalled();

    enabled.set(true);
    await Promise.resolve();
    expect(formGroup.api.pending()).toBe(true);
    await Promise.resolve();
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'countryNotAllowed' }]);

    enabled.set(false);
    await Promise.resolve();
    expect(formGroup.api.pending()).toBe(false);
    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
  });

  it('exposes its aggregate interaction state to an asynchronous validator', async () => {
    const states: Array<{ dirty: boolean; touched: boolean }> = [];
    const formGroup = form({ country: field('Switzerland') }, [asyncValidator(async ({ node }) => {
      const api = node().api;
      states.push({ dirty: api.dirty(), touched: api.touched() });
      return null;
    })]);

    await Promise.resolve();
    await Promise.resolve();
    formGroup.country.markAsDirty();
    formGroup.country.markAsTouched();
    await Promise.resolve();
    await Promise.resolve();

    expect(states).toEqual([
      { dirty: false, touched: false },
      { dirty: true, touched: true },
    ]);
  });

  it('is invalid when a grandchild is invalid', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({
      address: form({ city: field('', [required]) }),
    });
    expect(formGroup.address.api.valid()).toBe(false);
    expect(formGroup.api.valid()).toBe(false);
  });

  it('becomes valid once the failing child is fixed', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({ city: field('', [required]) });
    formGroup.city.set('Zurich');
    expect(formGroup.api.valid()).toBe(true);
  });

  it('recomputes its errors after setValidators', () => {
    const sameCity = ({ value }: Context<{ city: string | null; billingCity: string | null }>) => {
      return value().city === value().billingCity ? null : { kind: 'sameCity' };
    };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [sameCity],
    );
    expect(formGroup.api.valid()).toBe(false);
    formGroup.api.setValidators([]);
    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
  });

  it('adds validators to a form declared without them', () => {
    const formGroup = form({
      city: field('Zurich'),
      billingCity: field('Madrid'),
    });
    expect(formGroup.api.valid()).toBe(true);
    formGroup.api.setValidators([
      ({ value }) => (value().city === value().billingCity ? null : { kind: 'sameCity' }),
    ]);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'sameCity' }]);
    expect(formGroup.api.valid()).toBe(false);
  });

  it('runs a reusable aggregate validator authored with validator()', () => {
    const matchingCities = validator<{ city: string | null; billingCity: string | null }>(({ value }) => {
      return value().city === value().billingCity ? null : { kind: 'citiesDoNotMatch' };
    });
    const formGroup = form(
      { city: field('Zurich'), billingCity: field('Madrid') },
      [matchingCities],
    );

    expect(formGroup.getError('citiesDoNotMatch')).toMatchObject({ kind: 'citiesDoNotMatch' });
    formGroup.billingCity.set('Zurich');
    expect(formGroup.getError('citiesDoNotMatch')).toBeUndefined();
  });

  it('updates a reactive built-in validator message on the aggregate value', () => {
    const message = signal('Choose the expected profile');
    const formGroup = form(
      { name: field('David') },
      [oneOf([{ name: 'Marco' as string | null }], { message: () => message() })],
    );

    expect(formGroup.getError('oneOf')?.message).toBe('Choose the expected profile');

    message.set('Select another profile');
    expect(formGroup.getError('oneOf')?.message).toBe('Select another profile');
  });

  it('accepts validators and state in a second-argument options object', () => {
    const sameCity = ({ value }: Context<{ city: string | null; billingCity: string | null }>) => {
      return value().city === value().billingCity ? null : { kind: 'sameCity' };
    };
    const formGroup = form(
      {
        city: field('Moscow'),
        billingCity: field('Zurich'),
      },
      {
        validators: [sameCity],
        hidden: true,
      });
    expect(formGroup.api.validators()).toEqual([sameCity]);
    expect(formGroup.api.hidden()).toBe(true);
    expect(formGroup.api.errors()).toEqual([]);
    formGroup.api.show();
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'sameCity' }]);
  });

  it('accepts second-argument options without validators', () => {
    const formGroup = form({ name: field('David') }, { disabled: true });
    expect(formGroup.api.validators()).toEqual([]);
    expect(formGroup.api.disabled()).toBe(true);
  });

  it('starts untouched', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.untouched()).toBe(true);
  });

  it('is touched as soon as one child is touched', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.markAsTouched();
    expect(formGroup.api.touched()).toBe(true);
    expect(formGroup.api.untouched()).toBe(false);
    expect(formGroup.age.touched()).toBe(false);
  });

  it('is touched when a grandchild is touched', () => {
    const formGroup = form({
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.city.markAsTouched();
    expect(formGroup.address.api.touched()).toBe(true);
    expect(formGroup.api.touched()).toBe(true);
  });

  it('marks every descendant as touched', () => {
    const formGroup = form({
      name: field('David'),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.markAsTouched();
    expect(formGroup.name.touched()).toBe(true);
    expect(formGroup.address.city.touched()).toBe(true);
    expect(formGroup.address.country.touched()).toBe(true);
    expect(formGroup.address.api.touched()).toBe(true);
  });

  it('can mark an empty form as touched through its own interaction state', () => {
    const formGroup = form({});

    formGroup.markAsTouched();

    expect(formGroup.touched()).toBe(true);
    formGroup.markAsUntouched();
    expect(formGroup.untouched()).toBe(true);
  });

  it('can mark only the form itself as touched', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });

    formGroup.markAsTouched({ skipDescendants: true });

    expect(formGroup.touched()).toBe(true);
    expect(formGroup.name.untouched()).toBe(true);
    expect(formGroup.address.untouched()).toBe(true);
    expect(formGroup.address.city.untouched()).toBe(true);
  });

  it('only clears its own touched state through markAsUntouched', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.markAsTouched();
    formGroup.api.markAsUntouched();
    expect(formGroup.name.touched()).toBe(true);
    expect(formGroup.address.city.touched()).toBe(true);
    expect(formGroup.api.touched()).toBe(true);
  });

  it('only marks its own subtree as touched', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.api.markAsTouched();
    expect(formGroup.address.city.touched()).toBe(true);
    expect(formGroup.name.touched()).toBe(false);
  });

  it('goes back to untouched when the only touched child is reset', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.markAsTouched();
    formGroup.name.markAsUntouched();
    expect(formGroup.api.touched()).toBe(false);
  });

  it('stays untouched when values change through set and patch', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid' } });
    formGroup.api.patch({ name: 'Leo' });
    expect(formGroup.api.touched()).toBe(false);
  });

  it('starts pristine', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    expect(formGroup.api.dirty()).toBe(false);
    expect(formGroup.api.pristine()).toBe(true);
  });

  it('is dirty as soon as one child is dirty', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.value.control.set('Ana');
    expect(formGroup.api.dirty()).toBe(true);
    expect(formGroup.api.pristine()).toBe(false);
    expect(formGroup.age.dirty()).toBe(false);
  });

  it('is dirty when a grandchild is dirty', () => {
    const formGroup = form({
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.city.value.control.set('Madrid');
    expect(formGroup.address.api.dirty()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('stays pristine through programmatic set', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.api.set({ name: 'Ana', age: 30 });
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.age.dirty()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
  });

  it('preserves existing descendant dirty state through programmatic set', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.markAsDirty();

    formGroup.set({ name: 'Ana', age: 30 });

    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.age.dirty()).toBe(false);
    expect(formGroup.dirty()).toBe(true);
  });

  it('stays pristine through programmatic patch', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.api.patch({ name: 'Ana' });
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.age.dirty()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
  });

  it('keeps every branch pristine through a nested programmatic patch', () => {
    const formGroup = form({
      name: field('David'),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.patch({ address: { country: 'ES' } });
    expect(formGroup.address.country.dirty()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.name.dirty()).toBe(false);
  });

  it('marks only the form itself as dirty, including when empty', () => {
    const formGroup = form({
      name: field('David'),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.markAsDirty();
    expect(formGroup.dirty()).toBe(true);
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.address.country.dirty()).toBe(false);
    expect(formGroup.address.api.dirty()).toBe(false);

    const emptyForm = form({});
    emptyForm.markAsDirty();
    expect(emptyForm.dirty()).toBe(true);
  });

  it('only clears the form own dirty state through markAsPristine', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.markAsDirty();
    formGroup.name.markAsDirty();
    formGroup.api.markAsPristine();
    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('keeps the values after markAsPristine', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid' } });
    formGroup.api.markAsDirty();
    formGroup.api.markAsPristine();
    expect(formGroup.api.value()).toEqual({ name: 'Ana', address: { city: 'Madrid' } });
  });

  it('marks a nested form without dirtying its descendants or siblings', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.api.markAsDirty();
    expect(formGroup.address.dirty()).toBe(true);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.dirty()).toBe(true);
  });

  it('goes back to pristine when the only dirty child is reset', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.value.control.set('Ana');
    formGroup.name.markAsPristine();
    expect(formGroup.api.dirty()).toBe(false);
  });

  it('keeps a field named name accessible', () => {
    const formGroup = form({ name: field('David') });
    expect(formGroup.name()).toBe('David');
    expect(formGroup.name.value()).toBe('David');
  });

  it('keeps a field named length accessible', () => {
    const formGroup = form({ length: field(10) });
    expect(formGroup.length()).toBe(10);
    expect(formGroup.api.value()).toEqual({ length: 10 });
  });

  it('reaches nested state through the child api', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.name.api.set('Ana');
    expect(formGroup.api.value()).toEqual({ name: 'Ana', address: { city: 'Zurich' } });
    expect(formGroup.name.api.dirty()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
  });

  it('keeps every value on reset with no argument', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich'), country: field('CH') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid', country: 'ES' } });
    formGroup.api.reset();
    expect(formGroup.api.value()).toEqual({ name: 'Ana', address: { city: 'Madrid', country: 'ES' } });
  });

  it('clears dirty and touched on every descendant', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid' } });
    formGroup.api.markAsTouched();
    formGroup.api.reset();
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.address.city.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
    expect(formGroup.api.touched()).toBe(false);
  });

  it('assigns every value passed to reset', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich'), country: field('CH') }),
    });
    formGroup.api.reset({ name: 'Leo', address: { city: 'Bern', country: 'CH' } });
    expect(formGroup.api.value()).toEqual({ name: 'Leo', address: { city: 'Bern', country: 'CH' } });
  });

  it('stays pristine after reset with a value', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.markAsTouched();
    formGroup.api.reset({ name: 'Leo', address: { city: 'Bern' } });
    expect(formGroup.api.dirty()).toBe(false);
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.name.dirty()).toBe(false);
  });

  it('only resets its own subtree', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid' } });
    formGroup.name.value.control.set('Ana');
    formGroup.address.city.value.control.set('Madrid');
    formGroup.address.api.reset({ city: 'Bern' });
    expect(formGroup.api.value()).toEqual({ name: 'Ana', address: { city: 'Bern' } });
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('revalidates after reset with a value', () => {
    const sameCity = ({ value }: Context<{ city: string | null; billingCity: string | null }>) => {
      return value().city === value().billingCity ? null : { kind: 'sameCity' };
    };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Zurich'),
      },
      [sameCity],
    );
    expect(formGroup.api.valid()).toBe(true);
    formGroup.api.reset({ city: 'Zurich', billingCity: 'Madrid' });
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'sameCity' }]);
  });

  it('starts enabled', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    expect(formGroup.api.disabled()).toBe(false);
    expect(formGroup.api.enabled()).toBe(true);
  });

  it('can start disabled through options', () => {
    const formGroup = form(
      {
        name: field('David'),
        address: form({ city: field('Zurich') }),
      },
      undefined,
      { disabled: true },
    );

    expect(formGroup.api.disabled()).toBe(true);
    expect(formGroup.name.disabled()).toBe(true);
    expect(formGroup.address.api.disabled()).toBe(true);
    expect(formGroup.address.city.disabled()).toBe(true);
  });

  it('inherits disabled reasons in ancestor-to-descendant order and preserves their sources', () => {
    const formGroup = form({
      name: field('David', { disabled: 'Name is immutable' }),
      address: form({ city: field('Zurich') }),
    });

    formGroup.disable('Profile is locked');

    expect(formGroup.disabledReasons()).toEqual([{
      sourceNode: formGroup,
      message: 'Profile is locked',
    }]);
    expect(formGroup.name.disabledReasons()).toEqual([
      { sourceNode: formGroup, message: 'Profile is locked' },
      { sourceNode: formGroup.name, message: 'Name is immutable' },
    ]);
    expect(formGroup.address.city.disabledReasons()).toEqual([{
      sourceNode: formGroup,
      message: 'Profile is locked',
    }]);

    formGroup.enable();

    expect(formGroup.disabledReasons()).toEqual([]);
    expect(formGroup.name.disabledReasons()).toEqual([{
      sourceNode: formGroup.name,
      message: 'Name is immutable',
    }]);
    expect(formGroup.address.city.disabledReasons()).toEqual([]);
  });

  it('skips its own validators while disabled', () => {
    const validator = vi.fn(() => ({ kind: 'unavailable' }));
    const formGroup = form({ name: field('David') }, [validator], { disabled: true });

    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
    expect(validator).not.toHaveBeenCalled();

    formGroup.api.enable();
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'unavailable' }]);
    expect(validator).toHaveBeenCalledOnce();
  });

  it('ignores a disabled child when computing validity', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({
      name: field('', [required]),
      age: field(23),
    });
    expect(formGroup.api.valid()).toBe(false);
    formGroup.name.disable();
    expect(formGroup.name.valid()).toBe(true);
    expect(formGroup.api.valid()).toBe(true);
    formGroup.name.enable();
    expect(formGroup.api.valid()).toBe(false);
  });

  it('ignores a disabled child when computing touched and dirty', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.disable();
    formGroup.name.markAsTouched();
    formGroup.name.markAsDirty();
    expect(formGroup.name.touched()).toBe(false);
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
    formGroup.name.enable();
    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
    formGroup.age.markAsTouched();
    expect(formGroup.api.touched()).toBe(true);
  });

  it('disables every descendant', () => {
    const formGroup = form({
      name: field('David'),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.disable();
    expect(formGroup.name.disabled()).toBe(true);
    expect(formGroup.address.city.disabled()).toBe(true);
    expect(formGroup.address.country.disabled()).toBe(true);
    expect(formGroup.address.api.disabled()).toBe(true);
    expect(formGroup.api.disabled()).toBe(true);
  });

  it('enables every descendant', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.disable();
    formGroup.api.enable();
    expect(formGroup.name.disabled()).toBe(false);
    expect(formGroup.address.city.disabled()).toBe(false);
    expect(formGroup.api.disabled()).toBe(false);
  });

  it('preserves a child own disabled state after its parent is re-enabled', () => {
    const formGroup = form({
      name: field('David', undefined, { disabled: true }),
      address: form({ city: field('Zurich') }),
    });

    formGroup.api.disable();
    formGroup.api.enable();

    expect(formGroup.api.disabled()).toBe(false);
    expect(formGroup.name.disabled()).toBe(true);
    expect(formGroup.address.api.disabled()).toBe(false);
    expect(formGroup.address.city.disabled()).toBe(false);
  });

  it('hides descendant interaction state while disabled and restores it when enabled', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });

    formGroup.name.markAsTouched();
    formGroup.address.city.markAsDirty();
    expect(formGroup.api.touched()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);

    formGroup.api.disable();
    expect(formGroup.name.touched()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);

    formGroup.api.enable();
    expect(formGroup.name.touched()).toBe(true);
    expect(formGroup.address.city.dirty()).toBe(true);
    expect(formGroup.api.touched()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('keeps every value after disabling the form', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.disable();
    expect(formGroup.api.value()).toEqual({ name: 'David', address: { city: 'Zurich' } });
  });

  it('does not become disabled when every child is disabled', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.disable();
    expect(formGroup.api.disabled()).toBe(false);
    formGroup.age.disable();
    expect(formGroup.api.disabled()).toBe(false);
  });

  it('only disables its own subtree', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.api.disable();
    expect(formGroup.address.city.disabled()).toBe(true);
    expect(formGroup.name.disabled()).toBe(false);
    expect(formGroup.api.disabled()).toBe(false);
  });

  it('reports an empty form as enabled', () => {
    const formGroup = form({});
    expect(formGroup.api.disabled()).toBe(false);
    expect(formGroup.api.enabled()).toBe(true);
  });

  it('starts writable', () => {
    const formGroup = form({ name: field('David') });
    expect(formGroup.api.readonly()).toBe(false);
    expect(formGroup.api.writable()).toBe(true);
  });

  it('propagates initial readonly state to every descendant', () => {
    const formGroup = form(
      {
        name: field('David'),
        address: form({ city: field('Zurich') }),
      },
      undefined,
      { readonly: true },
    );

    expect(formGroup.api.readonly()).toBe(true);
    expect(formGroup.name.readonly()).toBe(true);
    expect(formGroup.address.api.readonly()).toBe(true);
    expect(formGroup.address.city.readonly()).toBe(true);
  });

  it('skips its own validators while readonly', () => {
    const validator = vi.fn(() => ({ kind: 'unavailable' }));
    const formGroup = form({ name: field('David') }, [validator], { readonly: true });

    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
    expect(validator).not.toHaveBeenCalled();

    formGroup.api.markAsWritable();
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'unavailable' }]);
    expect(validator).toHaveBeenCalledOnce();
  });

  it('does not become readonly when every child is readonly', () => {
    const formGroup = form({ name: field('David'), age: field(23) });
    formGroup.name.markAsReadonly();
    formGroup.age.markAsReadonly();
    expect(formGroup.api.readonly()).toBe(false);
  });

  it('preserves child-owned readonly state after its parent becomes writable', () => {
    const formGroup = form({
      name: field('David', undefined, { readonly: true }),
      address: form({ city: field('Zurich') }),
    });

    formGroup.api.markAsReadonly();
    formGroup.api.markAsWritable();

    expect(formGroup.api.readonly()).toBe(false);
    expect(formGroup.name.readonly()).toBe(true);
    expect(formGroup.address.api.readonly()).toBe(false);
    expect(formGroup.address.city.readonly()).toBe(false);
  });

  it('hides descendant interaction state while readonly and restores it when writable', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });

    formGroup.name.markAsTouched();
    formGroup.address.city.markAsDirty();
    formGroup.api.markAsReadonly();
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
    expect(formGroup.name.touched()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);

    formGroup.api.markAsWritable();
    expect(formGroup.api.touched()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
    expect(formGroup.name.touched()).toBe(true);
    expect(formGroup.address.city.dirty()).toBe(true);
  });

  it('starts visible and can be hidden and shown', () => {
    const formGroup = form({ name: field('David') });
    expect(formGroup.api.hidden()).toBe(false);
    expect(formGroup.api.visible()).toBe(true);
    formGroup.api.hide();
    expect(formGroup.api.hidden()).toBe(true);
    expect(formGroup.name.hidden()).toBe(true);
    formGroup.api.show();
    expect(formGroup.api.hidden()).toBe(false);
    expect(formGroup.name.hidden()).toBe(false);
  });

  it('propagates initial hidden state to every descendant', () => {
    const formGroup = form(
      { name: field('David'), address: { city: field('Moscow') } },
      undefined,
      { hidden: true },
    );
    expect(formGroup.api.hidden()).toBe(true);
    expect(formGroup.name.hidden()).toBe(true);
    expect(formGroup.address.api.hidden()).toBe(true);
    expect(formGroup.address.city.hidden()).toBe(true);
  });

  it('preserves child-owned hidden state after its parent is shown', () => {
    const formGroup = form({
      name: field('David', undefined, { hidden: true }),
      address: { city: field('Moscow') },
    });
    formGroup.api.hide();
    formGroup.api.show();
    expect(formGroup.api.hidden()).toBe(false);
    expect(formGroup.name.hidden()).toBe(true);
    expect(formGroup.address.api.hidden()).toBe(false);
    expect(formGroup.address.city.hidden()).toBe(false);
  });

  it('ignores hidden descendants when aggregating state', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({ name: field('', [required]), age: field(23) });
    formGroup.name.markAsTouched();
    formGroup.name.markAsDirty();
    expect(formGroup.api.valid()).toBe(false);
    expect(formGroup.api.touched()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
    formGroup.name.hide();
    expect(formGroup.api.valid()).toBe(true);
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
  });

  it('reacts to form state source functions', () => {
    const locked = signal(false);
    const readonly = signal(false);
    const hidden = signal(false);
    const formGroup = form(
      { address: { city: field('Moscow') } },
      undefined,
      {
        disabled: () => locked(),
        readonly,
        hidden,
      });
    locked.set(true);
    expect(formGroup.api.disabled()).toBe(true);
    expect(formGroup.address.city.disabled()).toBe(true);
    locked.set(false);
    readonly.set(true);
    expect(formGroup.address.city.readonly()).toBe(true);
    readonly.set(false);
    hidden.set(true);
    expect(formGroup.address.city.hidden()).toBe(true);
  });

  it('warns and ignores unknown keys passed to set', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => { });
    const profile = form({ name: field('David') });

    profile.set({ name: 'Mark', unknown: true } as any);

    expect(profile()).toEqual({ name: 'Mark' });
    expect(warning).toHaveBeenCalledWith('form: unknown key "unknown" ignored on set');
    warning.mockRestore();
  });

  it('adds, reads, and removes dynamic children while updating aggregate state', () => {
    const profile = form({ name: field('David') });
    const age = profile.add('age', field(23));

    expect(age()).toBe(23);
    expect(profile.get('age')).toBe(age);
    expect(Reflect.get(profile.children, 'age')).toBe(age);
    expect((profile as unknown as Record<string, unknown>)['age']).toBeUndefined();
    expect(profile()).toEqual({ name: 'David', age: 23 });
    expect(age.parent()).toBe(profile);
    expect(age.form()).toBe(profile);
    expect(age.path()).toEqual(['age']);

    age.set(24);
    expect(profile()).toEqual({ name: 'David', age: 24 });

    expect(profile.remove('missing')).toBeUndefined();
    expect(profile.remove('age')).toBe(age);
    expect(profile.get('age')).toBeUndefined();
    expect(Reflect.get(profile.children, 'age')).toBeUndefined();
    expect(profile()).toEqual({ name: 'David' });
    expect(age.parent()).toBeNull();
    expect(age.form()).toBeNull();
    expect(age.path()).toEqual([]);
  });

  it('normalizes one dynamically added field shorthand', () => {
    class Account {
      name = 'Form Nodes';
    }
    const profile = form({ name: field('David') });
    const age = profile.add('age', 23);
    const accountValue = new Account();
    const account = profile.add('account', accountValue);
    const missing = profile.add('missing', undefined);
    const rolesValue = ['admin'];
    const roles = profile.add('roles', rolesValue);

    expect(age.nodeType()).toBe('field');
    expect(age()).toBe(23);
    expect(age.parent()).toBe(profile);
    expect(account.nodeType()).toBe('field');
    expect(account()).toBe(accountValue);
    expect(missing()).toBeUndefined();
    expect(roles.nodeType()).toBe('field');
    expect(roles()).toBe(rolesValue);
    expect(profile()).toEqual({ name: 'David', age: 23, account: accountValue, missing: undefined, roles: ['admin'] });
  });

  it('adds several dynamic children atomically and normalizes shorthand groups', () => {
    const profile = form({ name: field('David') });

    const added = profile.add({
      age: 23,
      nickname: null,
      missing: undefined,
      address: { city: 'Zurich' },
    });

    expect(added.age).toBe(profile.get('age'));
    expect(added.age.nodeType()).toBe('field');
    expect(added.nickname.nodeType()).toBe('field');
    expect(added.missing.nodeType()).toBe('field');
    expect(added.missing()).toBeUndefined();
    expect(added.address).toBe(profile.get('address'));
    expect(added.address.nodeType()).toBe('group');
    expect(added.address.city.nodeType()).toBe('field');
    expect(added.address.city.parent()).toBe(added.address);
    expect(added.address.city.form()).toBe(profile);
    expect(profile()).toEqual({
      name: 'David',
      age: 23,
      nickname: null,
      missing: undefined,
      address: { city: 'Zurich' },
    });
  });

  it('detaches, reparents, replaces, and resets dynamically added shorthand fields', () => {
    const source = form({ name: 'David' });
    const target = group({ enabled: true }, { readonly: true });
    const status = source.add('status', 'draft');

    status.markAsDirty();
    status.markAsTouched();
    source.disable();
    expect(status.disabled()).toBe(true);
    expect(status.parent()).toBe(source);
    expect(status.form()).toBe(source);

    expect(source.remove('status')).toBe(status);
    expect(status.parent()).toBeNull();
    expect(status.form()).toBeNull();
    expect(status.disabled()).toBe(false);
    expect(status.dirty()).toBe(true);
    expect(status.touched()).toBe(true);

    expect(target.add('status', status)).toBe(status);
    expect(status.parent()).toBe(target);
    expect(status.form()).toBeNull();
    expect(status.root()).toBe(target);
    expect(status.readonly()).toBe(true);

    status.set('published');
    target.reset();
    expect(status()).toBe('published');
    expect(status.pristine()).toBe(true);
    expect(status.untouched()).toBe(true);

    expect(target.remove('status')).toBe(status);
    const replacement = target.add('status', 'archived');
    expect(replacement).not.toBe(status);
    expect(replacement()).toBe('archived');
    expect(target()).toEqual({ enabled: true, status: 'archived' });
  });

  it('normalizes arrays in an atomic shorthand batch', () => {
    const profile = form({ name: 'David' });

    const added = profile.add({ age: 23, roles: [] });

    expect(added.roles.nodeType()).toBe('field');
    expect(profile()).toEqual({ name: 'David', age: 23, roles: [] });
  });

  it('includes dynamic children in validation and interaction aggregation', () => {
    const profile = form({ name: field('David') });
    const email = profile.add('email', field('', [required]));

    expect(profile.invalid()).toBe(true);
    expect(profile.allErrors()).toContainEqual(expect.objectContaining({ targetNode: email }));

    email.markAsTouched();
    email.markAsDirty();
    expect(profile.touched()).toBe(true);
    expect(profile.dirty()).toBe(true);

    profile.remove('email');
    expect(profile.valid()).toBe(true);
    expect(profile.allErrors()).toEqual([]);
    expect(profile.touched()).toBe(false);
    expect(profile.dirty()).toBe(false);
  });

  it('protects fixed keys and rejects attached or duplicate dynamic children', () => {
    const profile = form({ name: field('David') });
    const other = form({ age: field(23) });

    expect(() => profile.remove('name')).toThrowError('form: initially declared child "name" cannot be removed');
    expect(() => (profile.add as any)('name', field('Mark'))).toThrowError('form: child "name" already exists');
    expect(() => (profile.add as any)('$api', field(1))).toThrowError('form: "$api" is reserved and cannot be added as a dynamic child');
    expect(() => profile.add('age', other.age)).toThrowError('form: a dynamic child must not already have a parent');
    expect(() => (profile.add as any)('invalid')).toThrowError('form: add(key, definition) requires a definition argument');

    profile.add('age', field(23));
    expect(() => profile.add({ city: field('Zurich'), age: field(24) })).toThrowError('form: child "age" already exists');
    expect(profile.get('city')).toBeUndefined();
  });

  it('keeps dynamic child values when reset receives only the fixed shape', () => {
    const profile = form({ name: field('David') });
    const age = profile.add('age', field(23));
    age.markAsDirty();

    profile.reset({ name: 'Mark' });

    expect(profile()).toEqual({ name: 'Mark', age: 23 });
    expect(age.pristine()).toBe(true);
  });

  it('keeps API operations reachable when a dynamic child uses a colliding name', () => {
    const profile = form({ name: field('David') });
    const setChild = profile.add('set', field('dynamic'));

    expect(Reflect.get(profile.children, 'set')).toBe(setChild);
    expect(profile.get('set')).toBe(setChild);
    expect(typeof profile.set).toBe('function');

    profile.set({ name: 'Mark' });
    expect(profile()).toEqual({ name: 'Mark', set: 'dynamic' });
    expect(profile.remove('set')).toBe(setChild);
    expect(typeof profile.set).toBe('function');
  });

  it('applies inherited availability state to children added later', () => {
    const profile = form({ name: field('David') }, {
      disabled: 'Locked',
      readonly: true,
      hidden: true,
    });
    const age = profile.add('age', field(23));

    expect(age.disabled()).toBe(true);
    expect(age.disabledReasons()).toContainEqual({ sourceNode: profile, message: 'Locked' });
    expect(age.readonly()).toBe(true);
    expect(age.hidden()).toBe(true);
  });

  it('gives a dynamic child the parent injector as its async-validation owner', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const city = field('Zurich', [asyncValidator(validate)]);
    const injector = Injector.create({ providers: [] });
    const profile = form({ name: field('David') }, { injector });

    profile.add('city', city);
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(city.pending()).toBe(false);
  });

  it('ignores markAsTouched while the form is non-interactive', () => {
    const profile = form({ name: field('David') }, { disabled: true });

    profile.markAsTouched();

    expect(profile.untouched()).toBe(true);
    expect(profile.name.untouched()).toBe(true);
  });
});

it.each([false, true])('tracks class form self-references with nested form: %s', (nested) => {
  const run = vi.fn();
  const allowedOption = (items: { name: string; valueType: number }[], valueType: number | null) => {
    return validator<string | null>(({ value }) => {
      run(valueType, value());
      return items.some(item => item.name === value() && item.valueType === valueType)
        ? null : { kind: 'unmatched' };
    });
  };

  class Model {
    availableOptions = signal([{ name: 'alpha', valueType: 1 }]);

    myForm = form({
      valueType: field<number>(null, [required]),
      value: field<string>(null, [required, () => {
        return allowedOption(this.availableOptions(), this.myForm.valueType());
      }]),
    });
  }

  const model = new Model();
  const parent = nested ? form({ payment: model.myForm }) : model.myForm;
  expect(run).not.toHaveBeenCalled();
  expect(parent.invalid()).toBe(true);
  expect(model.myForm.value.hasError('unmatched')).toBe(true);
  expect(run).toHaveBeenCalledTimes(1);
  model.myForm.patch({ valueType: 1, value: 'alpha' });
  expect(parent.valid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(2);
  expect(model.myForm()).toEqual({ valueType: 1, value: 'alpha' });
  expect(parent.pending()).toBe(false);
  expect(parent.dirty()).toBe(false);
  model.myForm.valueType.set(2);
  expect(parent.invalid()).toBe(true);
  expect(model.myForm.value.hasError('unmatched')).toBe(true);
  expect(parent.allErrors().map(error => error.kind)).toEqual(['unmatched']);
  expect(run).toHaveBeenCalledTimes(3);
  model.availableOptions.set([{ name: 'alpha', valueType: 2 }]);
  expect(parent.valid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(4);
  model.myForm.value.markAsTouched();
  model.myForm.reset({ valueType: null, value: null });
  expect(parent.touched()).toBe(false);
  expect(parent.invalid()).toBe(true);
  expect(model.myForm.value.hasError('required')).toBe(true);
  expect(model.myForm.value.hasError('unmatched')).toBe(true);
  expect(run).toHaveBeenCalledTimes(5);
});

it('infers and reactively evaluates a form referenced by its own validator', () => {
  const run = vi.fn();
  const allowed = signal(['Acme']);

  class Model {
    myForm = form({ name: field('') }, [() => {
      run();
      return allowed().includes(this.myForm.name() ?? '') ? null : { kind: 'unmatched' };
    }]);
  }

  const model = new Model();
  const parent = form({ payment: model.myForm });
  expect(run).not.toHaveBeenCalled();
  expect(parent.invalid()).toBe(true);
  expect(model.myForm.hasError('unmatched')).toBe(true);
  expect(model.myForm.name.errors()).toEqual([]);
  expect(run).toHaveBeenCalledTimes(1);
  model.myForm.name.set('Acme');
  expect(parent.valid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(2);
  allowed.set(['Other']);
  expect(parent.invalid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(3);
  expect(parent.pending()).toBe(false);
  expect(parent.dirty()).toBe(false);
  model.myForm.name.markAsTouched();
  model.myForm.reset({ name: 'Other' });
  expect(parent.valid()).toBe(true);
  expect(parent.touched()).toBe(false);
  expect(run).toHaveBeenCalledTimes(4);
});

it('reactively evaluates every parameterless self-reference declaration shape together', () => {
  const run = vi.fn();
  const matchedId = (ids: string[], valueType: number | null) => {
    return validator<string | null>(({ value }) => {
      run(value());
      const id = ids.find(entry => entry === value());
      return !id && valueType !== null && valueType > 3 ? { kind: 'unmatched' } : null;
    });
  };

  class Model {
    mySignal = signal(['1', '2', '3']);

    myForm = form({
      valueType: field<number>(null, [required]),
      value: field<string>(null, [
        required,
        () => matchedId(this.mySignal(), this.myForm.valueType()),
        () => this.myForm.valueType() ? { kind: '' } : null,
      ]),
      some: field('', () => {
        if (this.myForm.valueType()) return { kind: '' };
        return null;
      }),
      some1: field('', () => this.myForm.valueType() ? { kind: '' } : null),
      some2: field('', [() => {
        if (this.myForm.valueType()) return { kind: '' };
        return null;
      }]),
      some3: field('', [() => this.myForm.valueType() ? { kind: '' } : null]),
      some4: field<string>(null, () => {
        const valueType = this.myForm.valueType();
        const ids = this.mySignal();
        return [required, matchedId(ids, valueType)];
      }),
      some5: field('', {
        validators: [
          required,
          () => matchedId(this.mySignal(), this.myForm.valueType()),
          () => this.myForm.valueType() ? { kind: '' } : null,
        ],
      }),
    });
  }

  const model = new Model();
  expect(run).not.toHaveBeenCalled();
  expect(model.myForm.allErrors().map(error => error.kind)).toEqual(['required', 'required', 'required', 'required']);
  expect(run).toHaveBeenCalledTimes(3);
  expect(model.myForm.some4.required()).toBe(true);
  expect(run).toHaveBeenCalledTimes(3);
  model.myForm.valueType.set(4);
  expect(model.myForm.value.errors().map(error => error.kind)).toEqual(['required', 'unmatched', '']);
  for (const node of [model.myForm.some, model.myForm.some1, model.myForm.some2, model.myForm.some3]) {
    expect(node.errors().map(error => error.kind)).toEqual(['']);
  }
  expect(model.myForm.some4.errors().map(error => error.kind)).toEqual(['required', 'unmatched']);
  expect(model.myForm.some5.errors().map(error => error.kind)).toEqual(['required', 'unmatched', '']);
  expect(run).toHaveBeenCalledTimes(6);
  model.myForm.patch({ value: '1', some4: '1', some5: '1' });
  model.myForm.allErrors();
  expect(model.myForm.some4.valid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(9);
  model.mySignal.set([]);
  expect(model.myForm.allErrors().filter(error => error.kind === 'unmatched')).toHaveLength(3);
  expect(run).toHaveBeenCalledTimes(12);
  model.myForm.valueType.set(0);
  expect(model.myForm.allErrors()).toEqual([]);
  expect(model.myForm.valid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(15);
  expect(model.myForm.pending()).toBe(false);
  expect(model.myForm.dirty()).toBe(false);
  expect(model.myForm.touched()).toBe(false);
});

it.each([false, true])('preserves mixed self-referencing errors and skips async helpers with injection context: %s', async (insideInjectionContext) => {
  const asyncRun = vi.fn();
  const matchedId = (ids: any[], valueType: any) => {
    return validator<string | null>(({ value }) => {
      const id = ids.find(entry => entry === value());
      return !id && valueType > 3 ? { kind: 'unmatched' } : null;
    });
  };

  const getSomeError = vi.fn((_a: any, _b: any) => ({ kind: 'something' }));

  class CompleteSelfReference {
    ids = signal(['1', '2', '3']);

    myForm = form({
      valueType: field<number>(null, [required]),
      value: field<string>(null, [
        required,
        () => matchedId(this.ids(), this.myForm.valueType()),
        () => this.myForm.valueType() ? { kind: '' } : null,
        () => ({ kind: '', message: '' }),
        () => ({ kind: '' }),
      ]),
      value2: field<string>(null, [
        required,
        () => matchedId(this.ids(), this.myForm.valueType()),
        () => this.myForm.valueType() ? { kind: '' } : null,
        () => ({ kind: '', message: '' }),
        () => ({ kind: '' }),
        () => ({ kind: '', message: '' }),
      ]),
      value3: field<string>(null, [
        required,
        () => this.myForm.valueType() ? { kind: '' } : null,
        () => ({ kind: '' }),
        () => ({ kind: '', message: '' }),
        () => matchedId(this.ids(), this.myForm.valueType()),
      ]),
      value4: field<string>(null, [
        required,
        () => this.myForm.valueType() ? { kind: '' } : null,
        () => ({ kind: '' }),
        () => ({ kind: '', message: '' }),
        () => matchedId(this.ids(), this.myForm.valueType()),
        validator(() => getSomeError(this.ids(), this.myForm.valueType())),
      ]),
      value5: field<string>(null, [
        required,
        () => this.myForm.valueType() ? { kind: '' } : null,
        () => ({ kind: '' }),
        () => ({ kind: '', message: '' }),
        () => matchedId(this.ids(), this.myForm.valueType()),
        validator(() => getSomeError(this.ids(), this.myForm.valueType())),
        validator(() => matchedId(this.ids(), this.myForm.valueType())),
        asyncValidator(async () => { asyncRun(); return { kind: '' }; }),
        asyncValidator(async () => {
          asyncRun();
          return matchedId(this.ids(), this.myForm.valueType()) ? { kind: '' } : null;
        }),
      ]),
      some: field('', () => {
        if (this.myForm.valueType()) return { kind: '' };
        return null;
      }),
      some1: field('', () => this.myForm.valueType() ? { kind: '' } : null),
      some2: field('', [() => {
        if (this.myForm.valueType()) return { kind: '' };
        return null;
      }]),
      some3: field('', [() => this.myForm.valueType() ? { kind: '' } : null]),
      some4: field<string>(null, () => {
        const valueType = this.myForm.valueType();
        const ids = this.ids();
        return [required, matchedId(ids, valueType)];
      }),
      some5: field('', {
        validators: [
          required,
          () => matchedId(this.ids(), this.myForm.valueType()),
          () => this.myForm.valueType() ? { kind: '' } : null,
        ],
      }),
    });
  }
  const injector = Injector.create({ providers: [] });
  const model = insideInjectionContext
    ? runInInjectionContext(injector, () => new CompleteSelfReference())
    : new CompleteSelfReference();
  const fields = [model.myForm.value, model.myForm.value2, model.myForm.value3, model.myForm.value4, model.myForm.value5];
  expect(model.myForm.valid()).toBe(false);
  for (const node of fields) {
    expect(node.hasError('required')).toBe(true);
    expect(node.errors()).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: '', message: '' }),
      expect.objectContaining({ kind: '' }),
    ]));
  }
  expect(getSomeError).toHaveBeenCalledTimes(2);
  model.myForm.valueType.set(4);
  model.myForm.patch({ value: '1', value2: '1', value3: '1', value4: '1', value5: '1' });
  for (const node of fields) {
    expect(node.hasError('required')).toBe(false);
    expect(node.hasError('unmatched')).toBe(false);
  }
  expect(getSomeError).toHaveBeenCalledTimes(4);
  model.ids.set([]);
  for (const node of fields) expect(node.hasError('unmatched')).toBe(true);
  expect(model.myForm.value5.errors().filter(error => error.kind === 'unmatched')).toHaveLength(2);
  expect(getSomeError).toHaveBeenCalledTimes(6);
  expect(model.myForm.value4.hasError('something')).toBe(true);
  expect(model.myForm.value5.hasError('something')).toBe(true);
  expect(model.myForm.pending()).toBe(false);
  expect(model.myForm.invalid()).toBe(true);
  expect(model.myForm.dirty()).toBe(false);
  expect(model.myForm.touched()).toBe(false);
  await Promise.resolve();
  await Promise.resolve();
  expect(asyncRun).not.toHaveBeenCalled();
  injector.destroy();
});

it.each([false, true])('tracks sibling and external signals in parameterless async helpers with nested form: %s', async (nested) => {
  const run = vi.fn();
  class Model {
    ids = signal(['1']);

    myForm = form({
      valueType: field(4),
      details: form({
        value: field('1', [asyncValidator(async () => {
          const ids = this.ids();
          const valueType = this.myForm.valueType();
          run(ids, valueType);
          return valueType !== null && valueType > 3 && !ids.includes('1') ? { kind: 'unmatched' } : null;
        })]),
      }),
    });
  }
  const model = new Model();
  const root = nested ? form({ child: model.myForm }) : model.myForm;
  const value = model.myForm.details.value;
  expect(root.pending()).toBe(true);
  await Promise.resolve();
  await Promise.resolve();
  expect(run).toHaveBeenCalledTimes(1);
  expect(value.errors()).toEqual([]);
  expect(root.valid()).toBe(true);
  model.ids.set([]);
  await Promise.resolve();
  await Promise.resolve();
  expect(run).toHaveBeenCalledTimes(2);
  expect(value.errors()).toMatchObject([{ kind: 'unmatched' }]);
  expect(root.invalid()).toBe(true);
  model.myForm.valueType.set(0);
  await Promise.resolve();
  await Promise.resolve();
  expect(run).toHaveBeenCalledTimes(3);
  expect(value.errors()).toEqual([]);
  expect(root.pending()).toBe(false);
  expect(root.valid()).toBe(true);
  expect(root.dirty()).toBe(false);
  expect(root.touched()).toBe(false);
});

it('defers self-referencing synchronous guards on asynchronous aggregate nodes', async () => {
  const syncRun = vi.fn();
  const asyncRun = vi.fn();
  class Model {
    myForm = form({
      blocked: field.strict(false),
      details: form({ name: field('1') }, [
        validator(() => { syncRun(); return this.myForm.blocked() ? { kind: 'blocked' } : null; }),
        asyncValidator(async () => { asyncRun(); return this.myForm.blocked() ? { kind: 'blocked' } : null; }),
      ]),
      settings: group({ name: field('1') }, [
        validator(() => { syncRun(); return this.myForm.blocked() ? { kind: 'blocked' } : null; }),
        asyncValidator(async () => { asyncRun(); return this.myForm.blocked() ? { kind: 'blocked' } : null; }),
      ]),
      rows: array({ name: field('1') }, [
        validator(() => { syncRun(); return this.myForm.blocked() ? { kind: 'blocked' } : null; }),
        asyncValidator(async () => { asyncRun(); return this.myForm.blocked() ? { kind: 'blocked' } : null; }),
      ]),
    });
  }
  const model = new Model();
  expect(syncRun).not.toHaveBeenCalled();
  expect(asyncRun).not.toHaveBeenCalled();
  await Promise.resolve();
  await Promise.resolve();
  expect(syncRun).toHaveBeenCalledTimes(3);
  expect(asyncRun).toHaveBeenCalledTimes(3);
  expect(model.myForm.valid()).toBe(true);
  model.myForm.blocked.set(true);
  await Promise.resolve();
  expect(model.myForm.allErrors().map(error => error.kind)).toEqual(['blocked', 'blocked', 'blocked']);
  expect(syncRun).toHaveBeenCalledTimes(6);
  expect(asyncRun).toHaveBeenCalledTimes(3);
  expect(model.myForm.pending()).toBe(false);
  expect(model.myForm.invalid()).toBe(true);
});

it('ignores a parent node returned by a child validator and a node returned by its own validator', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const model = form({
      kind: field('notAnError'),
      somo: field('', [ctx => ctx.parent()]),
      nested: form({ kind: field.strict('alsoNotAnError') }, [ctx => ctx.node()]),
    });
    expect(model.somo.errors()).toEqual([]);
    expect(model.nested.errors()).toEqual([]);
    expect(model.allErrors()).toEqual([]);
    expect(model.valid()).toBe(true);
    expect(model.pending()).toBe(false);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(model.somo.validators({ resolve: true })).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(2);
  } finally {
    warn.mockRestore();
  }
});

it.each([false, true])('normalizes malformed aggregate validator results and propagates valid errors (async: %s)', async (asynchronous) => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const result = signal<unknown>([{ kind: '', message: 'Kept' }, {}, { kind: 4 }, null]);
    const run = vi.fn(() => result());
    const nested = form({ name: field('text') }, asynchronous ? [asyncValidator(async () => run())] : [run]);
    const root = form({ nested });
    if (asynchronous) {
      expect(root.pending()).toBe(true);
      await vi.waitFor(() => expect(root.pending()).toBe(false));
    }
    expect(nested.errors()).toMatchObject([{ kind: '', message: 'Kept', targetNode: nested }]);
    expect(root.allErrors()).toEqual(nested.errors());
    expect(root.invalid()).toBe(true);
    expect(nested.name.valid()).toBe(true);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenCalledTimes(1);
    result.set({});
    if (asynchronous) {
      await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(2));
      await vi.waitFor(() => expect(root.pending()).toBe(false));
    }
    expect(root.allErrors()).toEqual([]);
    expect(root.valid()).toBe(true);
    expect(run).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(3);
    expect(root.dirty()).toBe(false);
    expect(root.touched()).toBe(false);
  } finally {
    warn.mockRestore();
  }
});

it.each([false, true])('propagates message arrays from fields and nested forms (async: %s)', async (asynchronous) => {
  const message = signal<string | null>('Review profile');
  const run = vi.fn(() => {
    const text = message();
    return text === null ? null : [text, { kind: 'custom', message: 'Second' }, ''];
  });
  const nested = form({ name: field('Alex', () => message()) }, asynchronous ? [asyncValidator(async () => run())] : [run]);
  const root = form({ nested });
  if (asynchronous) {
    expect(root.pending()).toBe(true);
    await vi.waitFor(() => expect(root.pending()).toBe(false));
  }
  expect(root.invalid()).toBe(true);
  expect(nested.name.getError('custom')?.message).toBe('Review profile');
  nested.name.setValidators([]);
  if (asynchronous) {
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(root.pending()).toBe(false));
  }
  expect(nested.errors()).toEqual([
    { kind: 'custom', message: 'Review profile', targetNode: nested },
    { kind: 'custom', message: 'Second', targetNode: nested },
    { kind: 'custom', message: '', targetNode: nested },
  ]);
  expect(nested.getError('custom')?.message).toBe('Review profile');
  expect(root.allErrors()).toEqual(nested.errors());
  expect(root.invalid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(1);
  message.set(null);
  if (asynchronous) {
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(root.pending()).toBe(false));
  }
  expect(root.allErrors()).toEqual([]);
  expect(root.valid()).toBe(true);
  expect(run).toHaveBeenCalledTimes(2);
  expect(root.dirty()).toBe(false);
  expect(root.touched()).toBe(false);
});

// Adapter commit hooks must observe complete public state, including ancestors.
it('notifies the originating adapter after a deferred control edit is committed', () => {
  const target = form({ name: field.strict('initial') }, { debounce: 'blur' });
  const root = form({ target });
  const observations: unknown[] = [];
  const api = (target as unknown as InternalNode).$api;
  api._setControlValue({ name: 'edited' }, () => observations.push({ value: target(), root: root(), dirty: root.dirty() }));
  expect(observations).toEqual([]);
  expect(target.$api.debouncing()).toBe(true);
  root.flush();
  expect(observations).toEqual([{ value: { name: 'edited' }, root: { target: { name: 'edited' } }, dirty: true }]);
  root.flush();
  expect(observations).toHaveLength(1);
  api._setControlValue(api._value(), () => observations.push('same value'));
  expect(observations.at(-1)).toBe('same value');
});

describe('resetToInitial', () => {
  it('restores nested forms and groups using the current schema and each field declaration', () => {
    const name = field.strict('declared');
    name.set('before attachment');
    const profile = form({ name, address: { city: field.strict('Zurich') }, nested: form({ email: field('', [required]) }) });
    const dynamic = profile.add('nickname', field.strict('initial nickname'));
    profile.add('obsolete', field.strict('obsolete'));
    profile.remove('obsolete');
    profile.name.set('edited');
    profile.address.city.value.control.set('Madrid');
    profile.nested.email.value.control.set('email');
    dynamic.set('edited nickname');
    profile.markAsTouched();
    profile.resetToInitial();
    expect(profile()).toEqual({ name: 'declared', address: { city: 'Zurich' }, nested: { email: '' }, nickname: 'initial nickname' });
    expect(profile.pristine()).toBe(true);
    expect(profile.untouched()).toBe(true);
    expect(profile.nested.invalid()).toBe(true);
    expect(profile.invalid()).toBe(true);
    expect(profile.get('obsolete')).toBeUndefined();
    profile.nested.email.disable();
    profile.nested.resetToInitial();
    expect(profile.nested.email.disabled()).toBe(true);
  });

  it('cancels pending aggregate edits and restores arrays without redefining their initial records', () => {
    const profile = form({ people: array({ name: field.strict('template') }, { initialValue: [{ name: 'Ada' }] }) }, { debounce: 'blur' });
    profile.reset({ people: [{ name: 'server' }, { name: 'other' }] });
    (profile as unknown as InternalNode).$api._setControlValue({ people: [{ name: 'pending' }] });
    profile.resetToInitial();
    profile.flush();
    expect(profile()).toEqual({ people: [{ name: 'Ada' }] });
    expect(profile.value.control()).toEqual(profile());
    expect(profile.debouncing()).toBe(false);
    expect(profile.pristine()).toBe(true);
    expect(profile.untouched()).toBe(true);
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
  const target = form({ name: field.strict('initial') }, [validate]);
  const root = form({ nested: form({ target }) });
  await Promise.resolve();
  await Promise.resolve();
  expect(runs).toHaveLength(1);
  target.set({ name: 'edited' });
  await Promise.resolve();
  await Promise.resolve();
  expect(runs).toHaveLength(2);
  expect(runs[0]!.signal.aborted).toBe(true);
  target.resetToInitial();
  await Promise.resolve();
  await Promise.resolve();
  expect(runs).toHaveLength(3);
  expect(runs[1]!.signal.aborted).toBe(true);
  expect(runs.map(run => run.value)).toEqual([{ name: 'initial' }, { name: 'edited' }, { name: 'initial' }]);
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

it('exposes committed child data through nested forms without collecting pending child drafts', () => {
  const profile = form({
    details: form({ name: field('Ada', { equal: () => true }) }),
  }, { debounce: 'blur' });
  const exposed = profile();
  const committed = computed(() => profile.value.committed());
  expect(committed()).toEqual({ details: { name: 'Ada' } });
  profile.details.name.value.committed.set('Grace');
  expect(profile()).toEqual(exposed);
  expect(committed()).toEqual({ details: { name: 'Grace' } });
  profile.details.name.value.control.set('pending child');
  expect(profile.value.control()).toEqual({ details: { name: 'Grace' } });
  const { set: input } = profile.value.control;
  input({ details: { name: 'pending root' } });
  expect(profile.value.control()).toEqual({ details: { name: 'pending root' } });
  expect(committed()).toEqual({ details: { name: 'Grace' } });
  expect(profile.dirty()).toBe(true);
  expect(profile.touched()).toBe(false);
  profile.flush();
  expect(committed()).toEqual({ details: { name: 'pending root' } });
  expect(profile.details.name.value.control()).toBe('pending root');
  const { set } = profile.value.committed;
  set({ details: { name: 'final' } });
  expect(committed()).toEqual({ details: { name: 'final' } });
  profile.resetToInitial();
  expect(committed()).toEqual({ details: { name: 'Ada' } });
  expect(profile.pristine()).toBe(true);
});

it('allows value views through the collision-safe API and group control setters', () => {
  const profile = form({ value: field('child'), address: { city: field('Zurich') } });
  profile.address.value.control.set({ city: 'Bern' });
  expect(profile.address.value.committed()).toEqual({ city: 'Bern' });
  profile.$api.value.committed.set({ value: 'next child', address: { city: 'Basel' } });
  expect(profile.value()).toBe('next child');
  expect(profile.$api.value()).toEqual({ value: 'next child', address: { city: 'Basel' } });
});

describe('submission attempt history', () => {
  it('records invalid attempts before the blocked callback and preserves validation state', async () => {
    const action = vi.fn();
    const blocked = vi.fn<(submitted: boolean) => void>();
    const profile = form({ name: field('', [required]) }, {
      onSubmit: action,
      onSubmitBlocked: (node) => { blocked(node.submitted()); },
    });
    expect(isSignal(profile.submitted)).toBe(true);
    expect(profile.submitted()).toBe(false);
    expect(profile.invalid()).toBe(true);
    expect(await profile.submit()).toBe(false);
    expect(blocked).toHaveBeenCalledWith(true);
    expect(action).not.toHaveBeenCalled();
    expect(profile.submitted()).toBe(true);
    expect(profile.submitting()).toBe(false);
    expect(profile.name.touched()).toBe(true);
    expect(profile.name.hasError('required')).toBe(true);
    profile.name.set('Ada');
    expect(profile.valid()).toBe(true);
    expect(profile.submitted()).toBe(true);
    expect(await profile.submit()).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
    expect(profile.submitted()).toBe(true);
  });

  it('records attempts without an action and resets only the selected subtree', async () => {
    const profile = form({ name: field('Ada'), details: form({ city: field('Zurich') }) });
    expect(await profile.details.submit()).toBe(false);
    expect(profile.details.submitted()).toBe(true);
    expect(profile.submitted()).toBe(false);
    await profile.submit();
    profile.name.reset();
    expect(profile.submitted()).toBe(true);
    profile.details.reset();
    expect(profile.details.submitted()).toBe(false);
    expect(profile.submitted()).toBe(true);
    profile.reset();
    await profile.submit();
    expect(profile.details.submitted()).toBe(false);
    await profile.details.submit();
    profile.reset({ name: 'Grace', details: { city: 'Bern' } });
    expect(profile.submitted()).toBe(false);
    expect(profile.details.submitted()).toBe(false);
    await profile.submit();
    await profile.details.submit();
    profile.resetToInitial();
    expect(profile.submitted()).toBe(false);
    expect(profile.details.submitted()).toBe(false);
    expect(profile()).toEqual({ name: 'Ada', details: { city: 'Zurich' } });
  });

  it.each(['resolve', 'reject'] as const)('does not restore reset history when a pending action finishes: %s', async (outcome) => {
    let resolve!: () => void;
    let reject!: (reason: Error) => void;
    const action = vi.fn(() => new Promise<void>((done, fail) => { resolve = done; reject = fail; }));
    const profile = form({ name: field('Ada') }, { onSubmit: action });
    const task = profile.submit();
    expect(profile.submitted()).toBe(true);
    expect(profile.submitting()).toBe(true);
    expect(await profile.submit()).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
    profile.reset();
    expect(profile.submitted()).toBe(false);
    expect(profile.submitting()).toBe(true);
    if (outcome === 'resolve') {
      resolve();
      expect(await task).toBe(true);
    } else {
      const failure = new Error('Submission failed');
      reject(failure);
      await expect(task).rejects.toBe(failure);
    }
    expect(profile.submitted()).toBe(false);
    expect(profile.submitting()).toBe(false);
  });

  it('retains attempt history after a failed action and exposes it despite child-name collisions', async () => {
    const failure = new Error('Submission failed');
    const profile = form({ submitted: field('child'), api: field('another child') }, {
      onSubmit: () => { throw failure; },
    });
    await expect(profile.submit()).rejects.toBe(failure);
    expect(profile.$api.submitted()).toBe(true);
    expect(profile.submitted()).toBe('child');
    expect(profile.submitting()).toBe(false);
    profile.resetToInitial();
    expect(profile.$api.submitted()).toBe(false);
  });
});

it('clears nested form histories through group and array resets and starts new items unsubmitted', async () => {
  const profile = form({
    section: { details: form({ city: field('Zurich') }) },
    rows: array(() => form({ name: field('Ada') }), { initialValue: 1 }),
  });
  await profile.submit();
  await profile.section.details.submit();
  await profile.rows[0]!.submit();
  profile.section.reset();
  expect(profile.section.details.submitted()).toBe(false);
  expect(profile.submitted()).toBe(true);
  profile.rows.resetToInitial();
  expect(profile.rows[0]!.submitted()).toBe(false);
  const added = profile.rows.push();
  expect(added.submitted()).toBe(false);
  expect(profile.submitted()).toBe(true);
});

it('records rejected concurrent child attempts without inheriting the parent history', async () => {
  let resolve!: () => void;
  const childAction = vi.fn();
  const profile = form({ nested: form({}, { onSubmit: childAction }) }, {
    onSubmit: () => new Promise<void>((done) => { resolve = done; }),
  });
  const pending = profile.submit();
  expect(profile.nested.submitted()).toBe(false);
  expect(profile.nested.submitting()).toBe(true);
  expect(await profile.nested.submit()).toBe(false);
  expect(profile.nested.submitted()).toBe(true);
  expect(childAction).not.toHaveBeenCalled();
  resolve();
  await pending;
});
