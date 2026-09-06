import { describe, expect, it, vi } from 'vitest';

import { array } from '../array';
import { field } from '../field';
import { asyncValidator } from '../../validation/async-validator';

const createPeople = () => {
  return array({
    id: field.strict(''),
    name: field.strict(''),
  }, [
    { id: 'alex', name: 'Alex' },
    { id: 'kirill', name: 'Kirill' },
  ], { trackBy: person => person.id });
};

/**
 * Interaction tests for keyed array reconciliation.
 * These scenarios combine identity, state, debounce, validation, detachment, and failure atomicity.
 */
describe('array keyed reconciliation invariants', () => {
  it('preserves identity and interaction state through set while creating and detaching nodes', () => {
    const people = createPeople();
    const alex = people[0]!;
    const kirill = people[1]!;
    alex.name.markAsDirty();
    alex.name.markAsTouched();

    people.set([
      { id: 'kirill', name: 'Kirill updated' },
      { id: 'lia', name: 'Lia' },
      { id: 'alex', name: 'Alex updated' },
    ]);

    const lia = people[1]!;
    expect(people[0]).toBe(kirill);
    expect(people[2]).toBe(alex);
    expect(lia).not.toBe(alex);
    expect(lia).not.toBe(kirill);
    expect(alex.dirty()).toBe(true);
    expect(alex.touched()).toBe(true);
    expect(lia.pristine()).toBe(true);
    expect(lia.untouched()).toBe(true);
    expect(people.map(person => person.path())).toEqual([['0'], ['1'], ['2']]);

    people.set([{ id: 'lia', name: 'Lia retained' }]);

    expect(people[0]).toBe(lia);
    expect(lia.path()).toEqual(['0']);
    expect(alex.parent()).toBeNull();
    expect(kirill.parent()).toBeNull();
  });

  it('preserves keyed identity but clears retained interaction state through reset', () => {
    const people = createPeople();
    const alex = people[0]!;
    const kirill = people[1]!;
    people.markAsDirty();
    people.markAsTouched({ skipDescendants: true });
    alex.name.markAsDirty();
    alex.name.markAsTouched();
    kirill.name.markAsDirty();
    kirill.name.markAsTouched();

    people.reset([
      { id: 'kirill', name: 'Kirill reset' },
      { id: 'alex', name: 'Alex reset' },
    ]);

    expect(people[0]).toBe(kirill);
    expect(people[1]).toBe(alex);
    expect(people.pristine()).toBe(true);
    expect(people.untouched()).toBe(true);
    expect(alex.pristine()).toBe(true);
    expect(alex.untouched()).toBe(true);
    expect(kirill.pristine()).toBe(true);
    expect(kirill.untouched()).toBe(true);
  });

  it('cancels buffered control values when set reconciles and does not allow stale timers to win', () => {
    vi.useFakeTimers();
    try {
      const people = array({
        id: field.strict(''),
        name: field.strict(''),
      }, [
        { id: 'alex', name: 'Alex' },
        { id: 'kirill', name: 'Kirill' },
      ], { debounce: 100, trackBy: person => person.id });
      const alex = people[0]!;

      alex.name.setControlValue('Buffered Alex');
      expect(alex.name.controlValue()).toBe('Buffered Alex');
      expect(alex.name()).toBe('Alex');
      expect(people.debouncing()).toBe(true);

      people.set([
        { id: 'kirill', name: 'Kirill from server' },
        { id: 'alex', name: 'Alex from server' },
      ]);

      expect(people[1]).toBe(alex);
      expect(alex.name()).toBe('Alex from server');
      expect(alex.name.controlValue()).toBe('Alex from server');
      expect(people.debouncing()).toBe(false);

      vi.runAllTimers();
      expect(alex.name()).toBe('Alex from server');
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels pending validation and ignores late errors from a node removed by keyed set', async () => {
    let resolveAlex!: (result: { kind: string }) => void;
    let createdIndex = 0;
    const people = array(() => {
      const isAlex = createdIndex++ === 0;
      return {
        id: field.strict(''),
        name: field.strict('', [
          asyncValidator(() => {
            return isAlex
              ? new Promise<{ kind: string }>((resolve) => { resolveAlex = resolve; })
              : new Promise<null>(() => { });
          }),
        ]),
      };
    }, [
      { id: 'alex', name: 'Alex' },
      { id: 'kirill', name: 'Kirill' },
    ], { trackBy: person => person.id });
    const alex = people[0]!;
    const kirill = people[1]!;
    await Promise.resolve();
    expect(alex.name.pending()).toBe(true);

    people.set([{ id: 'kirill', name: 'Kirill' }]);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(people[0]).toBe(kirill);
    expect(alex.parent()).toBeNull();
    expect(alex.pending()).toBe(false);

    resolveAlex({ kind: 'detachedRemote' });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(alex.name.getError('detachedRemote')).toBeUndefined();
    expect(alex.valid()).toBe(true);
    expect(people.allErrors()).toEqual([]);
  });

  it('rejects duplicate incoming keys atomically without changing value, identity, or state', () => {
    const people = createPeople();
    const beforeValue = people();
    const beforeItems = [...people];
    beforeItems[0]!.name.markAsDirty();
    beforeItems[0]!.name.markAsTouched();

    expect(() => {
      return people.set([
        { id: 'same', name: 'One' },
        { id: 'same', name: 'Two' },
      ]);
    }).toThrow('array: duplicate trackBy key same in incoming values');

    expect(people()).toEqual(beforeValue);
    expect([...people]).toEqual(beforeItems);
    expect(beforeItems[0]!.name.dirty()).toBe(true);
    expect(beforeItems[0]!.name.touched()).toBe(true);
    beforeItems.forEach((item, index) => {
      expect(item.parent()).toBe(people);
      expect(item.path()).toEqual([String(index)]);
    });
  });

  it('rejects duplicate current keys before mutating or detaching any node', () => {
    const people = createPeople();
    const alex = people[0]!;
    const kirill = people[1]!;
    kirill.id.set('alex');
    const beforeValue = people();

    expect(() => people.set([{ id: 'alex', name: 'Replacement' }]))
      .toThrow('array: duplicate trackBy key alex in current items');

    expect(people()).toEqual(beforeValue);
    expect(people[0]).toBe(alex);
    expect(people[1]).toBe(kirill);
    expect(alex.parent()).toBe(people);
    expect(kirill.parent()).toBe(people);
  });

  it('leaves the complete tree unchanged when trackBy throws for an incoming value', () => {
    const trackBy = vi.fn((person: { id: string }) => {
      if (person.id === 'throw') throw new Error('cannot identify person');
      return person.id;
    });
    const people = array({
      id: field.strict(''),
      name: field.strict(''),
    }, [
      { id: 'alex', name: 'Alex' },
      { id: 'kirill', name: 'Kirill' },
    ], { trackBy });
    const beforeValue = people();
    const beforeItems = [...people];

    expect(() => {
      return people.reset([
        { id: 'alex', name: 'Would mutate if reconciliation had started' },
        { id: 'throw', name: 'Failure' },
      ]);
    }).toThrow('cannot identify person');

    expect(people()).toEqual(beforeValue);
    expect([...people]).toEqual(beforeItems);
    expect(people.pristine()).toBe(true);
    beforeItems.forEach((item, index) => {
      expect(item.parent()).toBe(people);
      expect(item.path()).toEqual([String(index)]);
    });
  });
});
