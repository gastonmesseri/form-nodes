import assert from 'node:assert/strict';
import { queryParam, type QueryParamCodec } from '@ngblocks/form-nodes/router';

assert.equal(queryParam.string().parse(['']), '');
assert.equal(queryParam.integer().parse(['2']), 2);
assert.equal(queryParam.boolean().parse(['false']), false);
assert.deepEqual(queryParam.array().parse(['angular', 'forms']), ['angular', 'forms']);
assert.throws(() => queryParam.number().parse(['']));
assert.throws(() => queryParam.integer().parse(['1.5']));
assert.throws(() => queryParam.string().parse(['first', 'second']));

// JSON stores the whole value in one parameter instead of repeating the key.
const json = queryParam.json<{ ids: number[]; enabled: boolean }>();
const state = { ids: [1, 2], enabled: true };
assert.deepEqual(json.serialize(state), ['{"ids":[1,2],"enabled":true}']);
assert.deepEqual(json.parse(['{"ids":[1,2],"enabled":true}']), state);
assert.deepEqual(queryParam.json<number[]>().serialize([]), ['[]']);
assert.throws(() => json.parse(['{broken}']));

// A custom codec can encode numeric arrays as repeated values instead of JSON.
const number = queryParam.number();
const numbers: QueryParamCodec<number[]> = {
  parse: values => values.map(value => number.parse([value])),
  serialize: values => values.flatMap(value => number.serialize(value)!),
};
assert.deepEqual(numbers.parse(['1', '2.5']), [1, 2.5]);
assert.deepEqual(numbers.serialize([1, 2.5]), ['1', '2.5']);
assert.throws(() => numbers.parse(['1', 'invalid']));
assert.throws(() => numbers.serialize([Infinity]));
