import { InjectionToken, Injector } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { registerNodeBindingInjector, resolveNodeInjector } from './node-injector';

describe('node injector resolution', () => {
  const bindingMarker = new InjectionToken<string>('binding marker');

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
