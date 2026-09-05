import { describe, expect, it } from 'vitest';

import { appendMetadataContributions, createMetadataKey, readMetadata, type MetadataKey } from './metadata';

describe('metadata', () => {
  it('uses last-write semantics for a default key and returns undefined without contributions', () => {
    const key = createMetadataKey<string>();

    expect(readMetadata(new Map(), key)).toBeUndefined();
    expect(readMetadata(new Map([[key, ['first', 'second']]]), key)).toBe('second');
  });

  it('appends contributions without replacing existing values', () => {
    const first = createMetadataKey<string>();
    const second = createMetadataKey<number>();
    const target = new Map<MetadataKey<unknown, unknown>, unknown[]>([
      [first as MetadataKey<unknown, unknown>, ['existing']],
    ]);
    const source = new Map<MetadataKey<unknown, unknown>, readonly unknown[]>([
      [first as MetadataKey<unknown, unknown>, ['appended']],
      [second as MetadataKey<unknown, unknown>, [42]],
    ]);

    appendMetadataContributions(target, source);

    expect(target.get(first as MetadataKey<unknown, unknown>)).toEqual(['existing', 'appended']);
    expect(target.get(second as MetadataKey<unknown, unknown>)).toEqual([42]);
  });
});
