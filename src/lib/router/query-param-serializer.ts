
/**
 * Converts decoded, repeated query values to a source value and back.
 *
 * ```ts
 * const param: QueryParamSerializer<number> = {
 *   parse: values => Number(values[0]),
 *   serialize: value => [String(value)],
 * };
 * param.parse(['2']); // 2
 * ```
 */
export type QueryParamSerializer<T> = {
  /** Parses present values. Throw for malformed input; absence uses the binding default. */
  parse(values: readonly string[]): T;
  /** Returns decoded values; null removes the key. Angular Router handles URL escaping. */
  serialize(value: T): readonly string[] | null;
};

const scalar = (values: readonly string[]) => {
  if (values.length !== 1) throw new Error('Expected exactly one query parameter value.');
  return values[0]!;
};

/**
 * Explicit serializers for scalar values, repeated string arrays, and JSON values.
 *
 * ```ts
 * queryParam.integer().parse(['2']); // 2
 * ```
 */
export const queryParam = {
  /**
   * Preserves empty strings and rejects repeated scalar values.
   *
   * ```ts
   * queryParam.string().parse(['']); // ''
   * ```
   */
  string(): QueryParamSerializer<string> {
    return { parse: scalar, serialize: value => [value] };
  },
  /**
   * Parses finite decimal numbers; rejects blank, hexadecimal, and non-finite input.
   *
   * ```ts
   * queryParam.number().parse(['1.5']); // 1.5
   * ```
   */
  number(): QueryParamSerializer<number> {
    return {
      parse(values) {
        const value = scalar(values);
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) || !Number.isFinite(Number(value))) {
          throw new Error('Expected a finite decimal query parameter.');
        }
        return Number(value);
      },
      serialize(value) {
        if (!Number.isFinite(value)) throw new Error('Cannot serialize a non-finite query parameter.');
        return [String(value)];
      },
    };
  },
  /**
   * Parses and serializes safe integers only.
   *
   * ```ts
   * queryParam.integer().parse(['2']); // 2
   * ```
   */
  integer(): QueryParamSerializer<number> {
    const number = queryParam.number();
    const check = (value: number) => {
      if (!Number.isSafeInteger(value)) throw new Error('Expected a safe integer query parameter.');
      return value;
    };
    return { parse: values => check(number.parse(values)), serialize: value => number.serialize(check(value)) };
  },
  /**
   * Accepts only the literal strings true and false.
   *
   * ```ts
   * queryParam.boolean().parse(['false']);
   * // false
   * ```
   */
  boolean(): QueryParamSerializer<boolean> {
    return {
      parse(values) {
        const value = scalar(values);
        if (value !== 'true' && value !== 'false') throw new Error('Expected true or false in a query parameter.');
        return value === 'true';
      },
      serialize: value => [String(value)],
    };
  },
  /**
   * Preserves the order of repeated query values; an empty array removes the key.
   *
   * ```ts
   * queryParam.array().parse(['a', 'b']);
   * // ['a', 'b']
   * ```
   */
  array(): QueryParamSerializer<string[]> {
    return { parse: values => [...values], serialize: value => value };
  },
  /**
   * Encodes a complete value as one JSON query parameter.
   * Parsing rejects malformed JSON and repeated keys. T describes the expected
   * value; it does not validate a schema. Use a custom serializer for shape validation.
   * Serialization follows JSON.stringify, including toJSON and omitted object
   * properties. Circular references, BigInt, and values without a JSON string
   * representation throw. syncQueryParams removes null/undefined field values
   * before serialization; this serializer itself can encode JSON null.
   *
   * ```ts
   * const json = queryParam.json<number[]>();
   * json.parse(['[1,2]']); // [1, 2]
   * json.serialize([1, 2]); // ['[1,2]']
   * ```
   */
  json<T = unknown>(): QueryParamSerializer<T> {
    return {
      parse: values => JSON.parse(scalar(values)) as T,
      serialize(value) {
        const encoded = JSON.stringify(value);
        if (encoded === undefined) throw new Error('The query parameter value has no JSON string representation.');
        return [encoded];
      },
    };
  },
};

export const inferSerializer = (value: unknown): QueryParamSerializer<any> => {
  if (typeof value === 'string') return queryParam.string();
  if (typeof value === 'number') return queryParam.number();
  if (typeof value === 'boolean') return queryParam.boolean();
  throw new Error('Provide a query parameter serializer for null, undefined, arrays, and object values.');
};

export const resolveSerializer = (serializer: QueryParamSerializer<any> | keyof typeof queryParam | undefined, fallback: unknown): QueryParamSerializer<any> => {
  if (typeof serializer !== 'string') return serializer ?? inferSerializer(fallback);
  if (!Object.hasOwn(queryParam, serializer)) throw new Error(`Unknown query parameter serializer "${serializer}".`);
  return queryParam[serializer]();
};
