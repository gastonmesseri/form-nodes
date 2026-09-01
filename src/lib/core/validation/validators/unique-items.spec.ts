import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

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
