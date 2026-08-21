import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { min } from './min';
import { field } from '../../primitives/field';

describe('min', () => {
  it('validates minimum numbers', () => {
    expect(min(3)(2)).toEqual({ min: { min: 3, actual: 2 } });
    expect(min(3)(3)).toBeNull();
    expect(min(3)(null)).toBeNull();
  });

  it('tracks reactive limits', () => {
    const minimum = signal(3);
    const fieldNode = field(2, [min(minimum)]);
    expect(fieldNode.errors()).toEqual({ min: { min: 3, actual: 2 } });
    minimum.set(2);
    expect(fieldNode.errors()).toBeNull();
  });
});
