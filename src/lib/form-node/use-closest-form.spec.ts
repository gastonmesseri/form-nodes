import { describe, expect, it } from 'vitest';
import { Injector, computed, isSignal, runInInjectionContext, signal } from '@angular/core';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { group } from '../primitives/group';
import { array } from '../primitives/array';
import { FORM_NODE } from './form-node.directive';
import { useClosestForm } from './use-closest-form';
import type { AnyNode } from '../types/node.type';

const bind = (node: AnyNode, parent?: Injector) => {
  const current = signal(node);
  const injector = Injector.create({ providers: [{ provide: FORM_NODE, useValue: { node: current } }], ...(parent ? { parent } : {}) });
  return { current, injector };
};

describe('useClosestForm', () => {
  it('requires an injection context and returns a null signal without a binding', () => {
    expect(() => useClosestForm()).toThrow(/injection context/);
    const closest = runInInjectionContext(Injector.create({ providers: [] }), useClosestForm);
    expect(isSignal(closest)).toBe(true);
    expect(closest()).toBeNull();
  });

  it('tracks rebinding to forms, groups, arrays, and detached nodes', () => {
    const profile = form({ name: field('Ada'), address: { city: field('Zurich') }, items: array(field('')) });
    const bound = bind(profile);
    const closest = runInInjectionContext(bound.injector, useClosestForm);
    expect(closest()).toBe(profile);
    for (const node of [profile.name, profile.address, profile.items]) {
      bound.current.set(node);
      expect(closest()).toBe(profile);
    }
    for (const node of [field(''), group({}), array(field(''))]) {
      bound.current.set(node);
      expect(closest()).toBeNull();
    }
  });

  it('tracks node reparenting and nearest explicit nested ownership', async () => {
    const name = field('Ada');
    const first = form({});
    first.add('name', name);
    const second = form({ nested: form({}) });
    const bound = bind(name);
    const closest = runInInjectionContext(bound.injector, useClosestForm);
    const attempted = computed(() => closest()?.$api.submitted() ?? false);
    expect(closest()).toBe(first);
    first.remove('name');
    expect(closest()).toBeNull();
    second.nested.add('name', name);
    expect(closest()).toBe(second.nested);
    await second.submit();
    expect(attempted()).toBe(false);
    await second.nested.submit();
    expect(attempted()).toBe(true);
    second.reset();
    expect(attempted()).toBe(false);
  });

  it('selects the nearest injectable binding once without falling back past an unowned node', () => {
    const outer = form({});
    const parent = bind(outer);
    const child = Injector.create({ providers: [], parent: parent.injector });
    expect(runInInjectionContext(child, useClosestForm)()).toBe(outer);
    const nearer = bind(field(''), child);
    const closest = runInInjectionContext(nearer.injector, useClosestForm);
    expect(closest()).toBeNull();
    const other = form({});
    nearer.current.set(other);
    expect(closest()).toBe(other);
  });
});
