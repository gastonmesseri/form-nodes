import { describe, expect, it } from 'vitest';

import { createMetadataKey, readMetadata } from '../metadata/metadata';
import { collectValidatorMetadata, hasValidatorMetadata, markValidatorMetadata } from './validator-metadata';

describe('validator metadata', () => {
  it('associates internal metadata without changing the validator function', () => {
    const key = createMetadataKey<boolean, boolean>({
      getInitial: () => false,
      reduce: (current, contribution) => current || contribution,
    });
    const validator = markValidatorMetadata(() => null, key, true);
    const contributions = new Map();

    collectValidatorMetadata(validator, contributions);

    expect(Object.keys(validator)).toEqual([]);
    expect(hasValidatorMetadata(validator, key)).toBe(true);
    expect(readMetadata(contributions, key)).toBe(true);
  });

  it('combines contributions using the internal key reducer', () => {
    const key = createMetadataKey<string, readonly string[]>({
      getInitial: () => [],
      reduce: (current, contribution) => [...current, contribution],
    });
    const first = markValidatorMetadata(() => null, key, 'first');
    const second = markValidatorMetadata(() => null, key, 'second');
    const contributions = new Map();

    collectValidatorMetadata(first, contributions);
    collectValidatorMetadata(second, contributions);

    expect(readMetadata(contributions, key)).toEqual(['first', 'second']);
  });
});
