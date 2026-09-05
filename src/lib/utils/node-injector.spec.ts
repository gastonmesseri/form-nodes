import { describe, expect, it, vi } from 'vitest';
import { DestroyRef, InjectionToken, Injector, runInInjectionContext } from '@angular/core';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { refreshNodeInjector, registerNodeInjector, watchNodeInjector, registerNodeBindingInjector, resolveNodeInjector } from './node-injector';

describe('node injector resolution', () => {
  const bindingMarker = new InjectionToken<string>('binding marker');

  it('captures the current injection context while preferring an explicit injector', () => {
    const capturedInjector = Injector.create({ providers: [] });
    const explicitInjector = Injector.create({ providers: [] });
    const captured = field('');
    const explicit = field('');

    try {
      expect(resolveNodeInjector(captured)).toBeUndefined();
      runInInjectionContext(capturedInjector, () => {
        registerNodeInjector(captured, undefined, true, true);
        registerNodeInjector(explicit, explicitInjector, true, true);
      });

      expect(resolveNodeInjector(captured)).toBe(capturedInjector);
      expect(resolveNodeInjector(explicit)).toBe(explicitInjector);
    } finally {
      capturedInjector.destroy();
      explicitInjector.destroy();
    }
  });

  it('reports the current injector immediately and refreshes only active subscribers', () => {
    const injector = Injector.create({ providers: [] });
    const name = field('');
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = watchNodeInjector(name, first);
    const stopSecond = watchNodeInjector(name, second);

    try {
      expect(first.mock.calls).toEqual([[undefined]]);
      expect(second.mock.calls).toEqual([[undefined]]);

      registerNodeInjector(name, injector, true, true);
      refreshNodeInjector(name);
      expect(first.mock.calls).toEqual([[undefined], [injector]]);
      expect(second.mock.calls).toEqual([[undefined], [injector]]);

      stopFirst();
      registerNodeInjector(name, undefined, true, true);
      refreshNodeInjector(name);
      expect(first).toHaveBeenCalledTimes(2);
      expect(second.mock.calls).toEqual([[undefined], [injector], [undefined]]);

      stopSecond();
      refreshNodeInjector(name);
      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(3);
    } finally {
      stopFirst();
      stopSecond();
      injector.destroy();
    }
  });

  it('destroys released binding leases once while keeping other leases active', () => {
    const injector = Injector.create({ providers: [] });
    const name = field('');
    const releaseFirst = registerNodeBindingInjector(name, injector);
    const firstLease = resolveNodeInjector(name)!;
    const destroyed = vi.fn();
    firstLease.get(DestroyRef).onDestroy(destroyed);
    const releaseSecond = registerNodeBindingInjector(name, injector);

    try {
      expect(resolveNodeInjector(name)).toBe(firstLease);
      releaseFirst();
      const secondLease = resolveNodeInjector(name);
      expect(secondLease).toBeDefined();
      expect(secondLease).not.toBe(firstLease);
      expect(destroyed).toHaveBeenCalledOnce();

      releaseFirst();
      expect(resolveNodeInjector(name)).toBe(secondLease);
      expect(destroyed).toHaveBeenCalledOnce();

      releaseSecond();
      expect(resolveNodeInjector(name)).toBeUndefined();
    } finally {
      releaseFirst();
      releaseSecond();
      injector.destroy();
    }
  });

  it('prefers an own injector over binding and ancestor injectors', () => {
    const ownInjector = Injector.create({ providers: [] });
    const bindingInjector = Injector.create({ providers: [{ provide: bindingMarker, useValue: 'binding' }] });
    const ancestorInjector = Injector.create({ providers: [] });
    const name = field('', { injector: ownInjector });
    form({ name }, { injector: ancestorInjector });
    const releaseBinding = registerNodeBindingInjector(name, bindingInjector);

    expect(resolveNodeInjector(name)).toBe(ownInjector);

    releaseBinding();
  });

  it('prefers a direct binding injector and falls back to the nearest ancestor', () => {
    const bindingInjector = Injector.create({ providers: [{ provide: bindingMarker, useValue: 'binding' }] });
    const ancestorInjector = Injector.create({ providers: [] });
    const name = field('');
    form({ name }, { injector: ancestorInjector });
    const releaseBinding = registerNodeBindingInjector(name, bindingInjector);

    expect(resolveNodeInjector(name)?.get(bindingMarker)).toBe('binding');

    releaseBinding();
    expect(resolveNodeInjector(name)).toBe(ancestorInjector);
  });

  it('keeps the first active binding stable and selects the next one after release', () => {
    const firstInjector = Injector.create({ providers: [{ provide: bindingMarker, useValue: 'first' }] });
    const secondInjector = Injector.create({ providers: [{ provide: bindingMarker, useValue: 'second' }] });
    const name = field('');
    const releaseFirst = registerNodeBindingInjector(name, firstInjector);
    const releaseSecond = registerNodeBindingInjector(name, secondInjector);

    expect(resolveNodeInjector(name)?.get(bindingMarker)).toBe('first');

    releaseFirst();
    expect(resolveNodeInjector(name)?.get(bindingMarker)).toBe('second');

    releaseSecond();
    expect(resolveNodeInjector(name)).toBeUndefined();
  });

  it('configures binding adoption and ancestor inheritance independently', () => {
    const bindingInjector = Injector.create({ providers: [{ provide: bindingMarker, useValue: 'binding' }] });
    const ancestorInjector = Injector.create({ providers: [] });
    const ancestorOnly = field('', { adoptBindingInjector: false });
    const bindingOnly = field('', { inheritInjector: false });
    form({ ancestorOnly, bindingOnly }, { injector: ancestorInjector });
    const releaseAncestorOnlyBinding = registerNodeBindingInjector(ancestorOnly, bindingInjector);
    const releaseBindingOnlyBinding = registerNodeBindingInjector(bindingOnly, bindingInjector);

    expect(resolveNodeInjector(ancestorOnly)).toBe(ancestorInjector);
    expect(resolveNodeInjector(bindingOnly)?.get(bindingMarker)).toBe('binding');

    releaseAncestorOnlyBinding();
    releaseBindingOnlyBinding();
    expect(resolveNodeInjector(bindingOnly)).toBeUndefined();
  });
});
