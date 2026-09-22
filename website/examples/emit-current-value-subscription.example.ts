import assert from 'node:assert/strict';
import { field, form } from '@ngblocks/form-nodes';

const search = form({ query: field('') });
search.query.set('Angular');

const queries: string[] = [];
const stop = search.query.onValueChange((value, node) => {
  queries.push(value);
  assert.equal(node, search.query);
}, { emitCurrent: true });

queries; // ['Angular']
assert.deepEqual(queries, ['Angular']);

search.query.set('Signal Forms');
queries; // ['Angular', 'Signal Forms']
assert.deepEqual(queries, ['Angular', 'Signal Forms']);

stop();
search.query.set('Forms');
assert.deepEqual(queries, ['Angular', 'Signal Forms']);
