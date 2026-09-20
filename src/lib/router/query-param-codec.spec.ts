import { describe, expect, it } from 'vitest';

import { queryParam, inferCodec } from './query-param-codec';

describe('query parameter serializers', () => {
  it('preserves decoded strings and rejects absent or repeated scalar input', () => {
    const serializer = queryParam.string();
    expect(serializer.parse([''])).toBe('');
    expect(serializer.serialize('a & b')).toEqual(['a & b']);
    expect(() => serializer.parse([])).toThrow('exactly one');
    expect(() => serializer.parse(['a', 'b'])).toThrow('exactly one');
  });
  it.each(['', ' ', '0x10', 'Infinity', 'NaN', '3px', '1e999'])('rejects malformed number %j', (value) => {
    expect(() => queryParam.number().parse([value])).toThrow('finite decimal');
  });
  it.each(['1', '-2.5', '.5', '1e2', '+1'])('round trips decimal number %j', (value) => {
    const serializer = queryParam.number();
    expect(serializer.parse(serializer.serialize(Number(value))!)).toBe(Number(value));
  });
  it('validates both directions of integer conversion', () => {
    const serializer = queryParam.integer();
    expect(serializer.parse(['2'])).toBe(2);
    expect(serializer.serialize(3)).toEqual(['3']);
    expect(() => serializer.parse(['1.5'])).toThrow('safe integer');
    expect(() => serializer.serialize(Number.MAX_SAFE_INTEGER + 1)).toThrow('safe integer');
  });
  it('supports boolean and repeated string values', () => {
    expect(queryParam.boolean().parse(['true'])).toBe(true);
    expect(queryParam.boolean().parse(['false'])).toBe(false);
    expect(queryParam.boolean().serialize(false)).toEqual(['false']);
    expect(() => queryParam.boolean().parse(['1'])).toThrow('true or false');
    expect(queryParam.array().parse(['a', 'b'])).toEqual(['a', 'b']);
    expect(queryParam.array().serialize([])).toEqual([]);
  });
  it('requires an explicit serializer for ambiguous and complex defaults', () => {
    for (const value of [null, undefined, [], {}, new Date()]) expect(() => inferCodec(value)).toThrow('serializer');
  });
  it('round trips JSON objects, arrays, and primitives as a single value', () => {
    const serializer = queryParam.json();
    for (const value of [{ tags: ['a & b', ''], nested: { enabled: true } }, [1, 2], [], {}, '', 'null', 3, false, null]) {
      const encoded = serializer.serialize(value)!;
      expect(encoded).toHaveLength(1);
      expect(serializer.parse(encoded)).toEqual(value);
    }
  });
  it('rejects malformed JSON, repeated JSON parameters, and unrepresentable values', () => {
    const serializer = queryParam.json();
    for (const values of [[], ['', ''], ['1', '2'], [''], ['undefined'], ['{broken}']]) {
      expect(() => serializer.parse(values)).toThrow();
    }
    const circular: { self?: unknown } = {};
    circular.self = circular;
    for (const value of [circular, 1n, undefined, () => 1, Symbol('value')]) {
      expect(() => serializer.serialize(value)).toThrow();
    }
  });
  it('follows native JSON conversion and does not impose a runtime schema', () => {
    const serializer = queryParam.json();
    expect(serializer.serialize({ missing: undefined, value: NaN })).toEqual(['{"value":null}']);
    expect(serializer.serialize([undefined, Infinity])).toEqual(['[null,null]']);
    expect(serializer.serialize({ toJSON: () => ({ id: 1 }) })).toEqual(['{"id":1}']);
    expect(queryParam.json<{ id: number }>().parse(['"different shape"'])).toBe('different shape');
  });
});
