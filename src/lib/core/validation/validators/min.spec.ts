import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { min } from './min';
import { field } from '../../primitives/field';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('min', () => {
  it('validates minimum numbers', () => {
    expect(min(3)(context(2))).toEqual({ kind: 'min', min: 3 });
    expect(min(3)(context(3))).toBeNull();
    expect(min(3)(context(null))).toBeNull();
    expect(min(3)(context(Number.NaN))).toBeNull();
    expect(min(() => undefined)(context(2))).toBeNull();
    expect(min(Number.NaN)(context(2))).toBeNull();
  });

  it('tracks reactive limits', () => {
    const minimum = signal(3);
    const fieldNode = field(2, [min(minimum)]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'min', min: 3 }]);
    minimum.set(2);
    expect(fieldNode.errors()).toEqual([]);
  });
});
