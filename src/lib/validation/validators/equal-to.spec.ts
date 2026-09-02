import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { equalTo } from './equal-to';
import { field } from '../../primitives/field';

describe('equalTo', () => {
  it('compares static values with Object.is', () => {
    expect(field(Number.NaN, [equalTo(Number.NaN)]).errors()).toEqual([]);
    expect(field(0, [equalTo(-0)]).errors()).toMatchObject([{
      kind: 'equalTo',
      message: 'Please enter the matching value.',
    }]);
    expect(field<{ id: number }>({ id: 1 }, [equalTo({ id: 1 })]).errors()).toMatchObject([{ kind: 'equalTo' }]);
  });

  it('treats null as a comparable value', () => {
    expect(field<string>(null, [equalTo<string | null>(null)]).errors()).toEqual([]);
    expect(field<string>(null, [equalTo('value')]).errors()).toMatchObject([{ kind: 'equalTo' }]);
  });

  it('tracks reactive expected values and custom messages', () => {
    const expected = signal('first');
    const message = signal('Values differ');
    const value = field('second', [equalTo(() => expected(), { message: () => message() })]);

    expect(value.errors()).toMatchObject([{ kind: 'equalTo', message: 'Values differ' }]);

    message.set('Still different');
    expect(value.getError('equalTo')?.message).toBe('Still different');

    expected.set('second');
    expect(value.errors()).toEqual([]);
  });
});
