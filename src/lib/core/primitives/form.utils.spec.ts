import { describe, expect, it } from 'vitest';

import { normalizeObjectDefinition } from './form.utils';

describe('form definition normalization', () => {
  it('retains an array guard when normalization is called without object-node prevalidation', () => {
    expect(() => normalizeObjectDefinition([])).toThrow(
      'Array shorthand is ambiguous; wrap the value with field([...]) or declare a dynamic array with array(...).',
    );
  });
});
