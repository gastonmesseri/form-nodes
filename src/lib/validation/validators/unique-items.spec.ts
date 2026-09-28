import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { uniqueItems } from './unique-items';
import { field } from '../../primitives/field';
import { array } from '../../primitives/array';

describe('uniqueItems', () => {
  it('supports direct use without calling the validator factory', () => {
    const values = array(field(''), ['admin', 'admin'], [uniqueItems]);

    expect(values.getError('uniqueItems')).toMatchObject({
      duplicateIndexes: [0, 1],
      message: 'Please ensure every item is unique.',
    });
  });

  it('treats null and undefined as empty arrays', () => {
    const nullValue = field<readonly string[]>(null, [uniqueItems()]);
    const undefinedValue = field<readonly string[] | undefined>(undefined, [uniqueItems()]);

    expect(nullValue.errors()).toEqual([]);
    expect(undefinedValue.errors()).toEqual([]);
  });

  it('uses SameValueZero equality and reports every participating index', () => {
    const values = array(field<number>(null), [Number.NaN, 0, -0, Number.NaN, 1, 1], [uniqueItems()]);

    expect(values.errors()).toMatchObject([{
      kind: 'uniqueItems',
      duplicateIndexes: [0, 1, 2, 3, 4, 5],
      message: 'Please ensure every item is unique.',
    }]);
  });

  it('selects keys by a property name without exposing duplicate values', () => {
    const contacts = array(
      { email: field(''), name: field('') },
      [{ email: 'same@example.com', name: 'First' }, { email: 'same@example.com', name: 'Second' }],
      [uniqueItems('email')],
    );

    expect(contacts.getError('uniqueItems')).toMatchObject({ duplicateIndexes: [0, 1] });
    expect(contacts.getError('uniqueItems')).not.toHaveProperty('duplicates');
    contacts[1]!.email.set('different@example.com');
    expect(contacts.errors()).toEqual([]);
  });

  it('tracks key-selector dependencies and custom messages reactively', () => {
    const caseSensitive = signal(false);
    const message = signal('Names must be unique');
    const names = array(field(''), ['Marco', 'marco'], [
      uniqueItems<string | null>(
        name => caseSensitive() ? name : name?.toLowerCase(),
        { message: () => message() },
      ),
    ]);

    expect(names.getError('uniqueItems')?.message).toBe('Names must be unique');
    message.set('Use different names');
    expect(names.getError('uniqueItems')?.message).toBe('Use different names');
    caseSensitive.set(true);
    expect(names.errors()).toEqual([]);
  });
});

describe('uniqueItems with nullable items', () => {
  type Row = { id?: string | null | undefined } | null | undefined;

  it.each([
    { values: [{ id: 'a' }, null], indexes: [] },
    { values: [{ id: 'a' }, undefined], indexes: [] },
    { values: [null, undefined], indexes: [0, 1] },
    { values: [null, {}], indexes: [0, 1] },
    { values: [undefined, { id: undefined }], indexes: [0, 1] },
    { values: [{}, {}], indexes: [0, 1] },
    { values: [{ id: null }, null], indexes: [] },
    { values: [{ id: null }, { id: null }], indexes: [0, 1] },
    { values: [null, { id: 'a' }, undefined, { id: 'a' }, {}], indexes: [0, 1, 2, 3, 4] },
  ] satisfies { values: Row[]; indexes: number[] }[])('validates $values with duplicate indexes $indexes', ({ values, indexes }) => {
    const node = field<Row[]>(values, [uniqueItems('id')]);
    expect(node.valid()).toBe(indexes.length === 0);
    expect(node.getError('uniqueItems')?.duplicateIndexes ?? []).toEqual(indexes);
    expect(node()).toEqual(values);
  });

  it('supports numeric and symbol properties on nullable items', () => {
    const key = Symbol('id');
    const numeric = field<({ 0: string } | null)[]>([null, null], [uniqueItems(0)]);
    const symbolic = field<({ [key]: string } | undefined)[]>([undefined, undefined], [uniqueItems(key)]);
    expect(numeric.getError('uniqueItems')?.duplicateIndexes).toEqual([0, 1]);
    expect(symbolic.getError('uniqueItems')?.duplicateIndexes).toEqual([0, 1]);
    numeric.set([null, { 0: 'a' }]);
    symbolic.set([undefined, { [key]: 'a' }]);
    expect(numeric.valid()).toBe(true);
    expect(symbolic.valid()).toBe(true);
  });

  it('preserves raw nullable values without a selector and passes original items to callbacks', () => {
    const node = field<Row[]>([null, undefined], [uniqueItems()]);
    expect(node.valid()).toBe(true);
    node.set([null, undefined, null]);
    expect(node.getError('uniqueItems')?.duplicateIndexes).toEqual([0, 2]);
    const selector = vi.fn((item: Row, index: number) => item === null ? 'null' : item === undefined ? 'undefined' : index);
    node.setValidators(uniqueItems(selector));
    expect(node.getError('uniqueItems')?.duplicateIndexes).toEqual([0, 2]);
    expect(selector.mock.calls).toEqual([[null, 0], [undefined, 1], [null, 2]]);
  });

  it('applies conditional validation and custom errors to duplicate absent keys without warnings', () => {
    const active = signal(false);
    const error = vi.fn(() => ({ kind: 'missingDuplicate' }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const node = field<Row[]>([null, undefined], [uniqueItems('id', { when: () => active(), error })]);
      expect(node.valid()).toBe(true);
      expect(error).not.toHaveBeenCalled();
      active.set(true);
      expect(node.errors()).toMatchObject([{ kind: 'missingDuplicate' }]);
      expect(error).toHaveBeenCalledOnce();
      node.set([{ id: 'a' }, null]);
      expect(node.valid()).toBe(true);
      expect(error).toHaveBeenCalledOnce();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
