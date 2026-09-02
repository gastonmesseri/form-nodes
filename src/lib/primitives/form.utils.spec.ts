import { describe, expect, it } from 'vitest';

import { normalizeObjectDefinition } from './form.utils';

describe('form definition normalization', () => {
  it('normalizes an array value to a field', () => {
    const value = ['admin'];
    const node = normalizeObjectDefinition(value);

    expect(node.$api.nodeType()).toBe('field');
    expect(node.$api.value()).toBe(value);
  });
});
