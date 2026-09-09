import { computed, signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { array, field, form, group, isFormNode, createFormPrimitives } from '../../public-api';

describe('isFormNode', () => {
  it('recognizes every primitive and nested node outside injection context', () => {
    const profile = form({
      name: field('Marco'),
      address: { city: field('Zurich') },
      preferences: group({ newsletter: field(true) }),
      contacts: array({ email: field('') }, { initialValue: 1 }),
      details: form({ age: field(30) }),
    });

    for (const node of [profile, profile.name, profile.address, profile.address.city, profile.preferences, profile.contacts, profile.contacts[0], profile.details]) {
      expect(isFormNode(node)).toBe(true);
    }
  });

  it('recognizes configured primitives and detached nodes', () => {
    const configured = createFormPrimitives({});
    const items = configured.array(configured.field(''));
    const item = items.push();
    items.removeAt(0);

    for (const node of [configured.field(''), configured.form({}), configured.group({}), items, item]) {
      expect(isFormNode(node)).toBe(true);
    }
  });

  it('rejects non-nodes without calling functions or evaluating signals', () => {
    const callback = vi.fn();
    const derived = computed(callback);
    const node = field('Marco');
    const lookalike = Object.assign(vi.fn(), { $api: node.$api });

    for (const value of [null, undefined, false, 0, 'Marco', Symbol('node'), 1n, {}, [], callback, derived, signal('Marco'), node.$api, node(), lookalike]) {
      expect(isFormNode(value)).toBe(false);
    }
    expect(callback).not.toHaveBeenCalled();
    expect(lookalike).not.toHaveBeenCalled();
  });
});
