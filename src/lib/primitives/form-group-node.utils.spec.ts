import { describe, expect, it } from 'vitest';

import { normalizeObjectDefinition } from './form-group-node.utils';

describe('object node definition normalization', () => {
  it('normalizes an array value to a field', () => {
    const value = ['admin'];
    const node = normalizeObjectDefinition(value);

    expect(node.$api.nodeType()).toBe('field');
    expect(node.$api.value()).toBe(value);
  });
});
