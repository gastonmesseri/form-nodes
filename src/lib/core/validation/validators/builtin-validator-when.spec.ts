import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { max } from './max';
import { min } from './min';
import { url } from './url';
import { field } from '../../primitives/field';
import { email } from './email';
import { oneOf } from './one-of';
import { integer } from './integer';
import { between } from './between';
import { pattern } from './pattern';
import { equalTo } from './equal-to';
import { maxDate } from './max-date';
import { minDate } from './min-date';
import { required } from './required';
import { maxWords } from './max-words';
import { minWords } from './min-words';
import { maxLength } from './max-length';
import { minLength } from './min-length';
import { dateBetween } from './date-between';
import { uniqueItems } from './unique-items';

describe('built-in validator when option', () => {
  it('reactively enables every built-in validator', () => {
    const enabled = signal(false);
    const when = () => enabled();
    const createNodes = [
      () => field('', [required({ when })]),
      () => field(1, [min(2, { when })]),
      () => field(3, [max(2, { when })]),
      () => field(3, [between(4, 5, { when })]),
      () => field(1.5, [integer({ when })]),
      () => field('a', [minLength(2, { when })]),
      () => field('abc', [maxLength(2, { when })]),
      () => field('one', [minWords(2, { when })]),
      () => field('one two', [maxWords(1, { when })]),
      () => field('a', [pattern(/^b$/, { when })]),
      () => field('invalid', [email({ when })]),
      () => field('invalid', [url({ when })]),
      () => field(new Date('2025-01-01'), [minDate('2026-01-01', { when })]),
      () => field(new Date('2027-01-01'), [maxDate('2026-01-01', { when })]),
      () => field(new Date('2027-01-01'), [dateBetween('2026-01-01', '2026-12-31', { when })]),
      () => field('draft', [oneOf(['published'], { when })]),
      () => field('first', [equalTo('second', { when })]),
      () => field(['same', 'same'], [uniqueItems({ when })]),
    ];
    const nodes = createNodes.map(createNode => createNode());

    expect(nodes.every(node => node.valid())).toBe(true);

    enabled.set(true);

    expect(nodes.every(node => node.invalid())).toBe(true);
  });

  it('removes and restores constraint metadata with the condition', () => {
    const enabled = signal(false);
    const amount = field(3, [min(5, { when: () => enabled() }), max(10, { when: () => enabled() })]);
    const name = field('', [required({ when: () => enabled() }), minLength(2, { when: () => enabled() })]);

    expect(amount.min()).toBeNull();
    expect(amount.max()).toBeNull();
    expect(name.required()).toBe(false);
    expect(name.minLength()).toBeNull();

    enabled.set(true);

    expect(amount.min()).toBe(5);
    expect(amount.max()).toBe(10);
    expect(name.required()).toBe(true);
    expect(name.minLength()).toBe(2);

    name.disable();
    enabled.set(false);
    expect(name.required()).toBe(false);
    expect(name.minLength()).toBeNull();
  });
});
