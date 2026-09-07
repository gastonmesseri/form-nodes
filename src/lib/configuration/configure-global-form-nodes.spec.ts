import { signal } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { required } from '../validation/validators/required';
import { configureGlobalFormNodes, getGlobalFormNodeClasses, getGlobalSyncInputs } from './configure-global-form-nodes';

const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).reverse().forEach(cleanup => cleanup()));

const configure: typeof configureGlobalFormNodes = (config) => {
  const cleanup = configureGlobalFormNodes(config);
  cleanups.push(cleanup);
  return cleanup;
};

describe('global Form Nodes configuration', () => {
  it.each(['field', 'form'])('updates reactive %s fallback messages without DI and restores defaults', (kind) => {
    const locale = signal<string | undefined>('en');
    const suffix = signal('!');
    const source = vi.fn(() => {
      const language = locale();
      return language ? { required: () => `Required:${language}${suffix()}` } : undefined;
    });
    const name = field('', [required]);
    const root = kind === 'form' ? form({ nested: form({ name }) }) : name;
    const restore = configure({ validatorMessages: source });
    expect(source).not.toHaveBeenCalled();
    expect(name.getError('required')?.message).toBe('Required:en!');
    expect(source).toHaveBeenCalledTimes(1);
    suffix.set('?');
    expect(name.getError('required')?.message).toBe('Required:en?');
    locale.set('de');
    expect(name.getError('required')?.message).toBe('Required:de?');
    locale.set(undefined);
    expect(name.getError('required')?.message).toBe('This field is required.');
    name.set('Marco');
    expect(root.$api.valid()).toBe(true);
    name.reset('');
    expect(root.$api.invalid()).toBe(true);
    restore();
    expect(name.getError('required')?.message).toBe('This field is required.');
  });

  it.each(['field', 'form'])('restores independent options without reviving cleaned-up %s overrides', (kind) => {
    const name = field('', [required]);
    if (kind === 'form') form({ nested: form({ name }) });
    const classMap = { active: () => true };
    const first = configure({ validatorMessages: { required: 'First' }, classes: classMap, syncInputs: 'always' });
    const second = configure({ validatorMessages: { required: 'Second' } });
    const noop = configure({ validatorMessages: undefined, classes: undefined, syncInputs: undefined });
    expect(name.getError('required')?.message).toBe('Second');
    expect(getGlobalFormNodeClasses()).toBe(classMap);
    expect(getGlobalSyncInputs()).toBe('always');
    noop();
    first();
    expect(name.getError('required')?.message).toBe('Second');
    expect(getGlobalFormNodeClasses()).toEqual({});
    expect(getGlobalSyncInputs()).toBe(false);
    second();
    expect(name.getError('required')?.message).toBe('This field is required.');
    first();
    second();
    expect(name.getError('required')?.message).toBe('This field is required.');
  });

  it('resets each option with null and restores nested identical values independently', () => {
    const classMap = { active: () => true };
    const first = configure({ classes: classMap, syncInputs: 'always', validatorMessages: { required: 'Global' } });
    const second = configure({ classes: classMap, syncInputs: 'always' });
    const reset = configure({ classes: null, syncInputs: null, validatorMessages: null });
    expect(getGlobalFormNodeClasses()).toEqual({});
    expect(getGlobalSyncInputs()).toBe(false);
    expect(field('', [required]).getError('required')?.message).toBe('This field is required.');
    reset();
    expect(getGlobalFormNodeClasses()).toBe(classMap);
    expect(getGlobalSyncInputs()).toBe('always');
    expect(field('', [required]).getError('required')?.message).toBe('Global');
    first();
    expect(getGlobalSyncInputs()).toBe('always');
    expect(getGlobalFormNodeClasses()).toBe(classMap);
    second();
    expect(getGlobalSyncInputs()).toBe(false);
    expect(getGlobalFormNodeClasses()).toEqual({});
    configure({})();
  });
});
