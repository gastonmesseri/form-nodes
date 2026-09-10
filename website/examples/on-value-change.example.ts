import assert from 'node:assert/strict';
import { field, form } from '@ngblocks/form-nodes';

const names: (string | null)[] = [];
const snapshots: { name: string | null; city: string | null }[] = [];

const profile = form({
  name: field('Ada', {
    onValueChange: value => names.push(value),
  }),
  city: field('London'),
}, {
  onValueChange(value, node) {
    snapshots.push(value);
    assert.equal(node.name(), value.name);
    assert.equal(node.city(), value.city);
  },
});

assert.deepEqual(names, []);
assert.deepEqual(snapshots, []);

profile.patch({ name: 'Grace', city: 'New York' });
profile(); // { name: 'Grace', city: 'New York' }
assert.deepEqual(names, ['Grace']);
assert.deepEqual(snapshots, [{ name: 'Grace', city: 'New York' }]);

profile.name.set('Grace');
assert.equal(snapshots.length, 1);

profile.resetToInitial();
profile(); // { name: 'Ada', city: 'London' }
assert.deepEqual(names, ['Grace', 'Ada']);
assert.equal(snapshots.length, 2);

const queries: (string | null)[] = [];
const search = form({
  query: field('', {
    debounce: 'blur',
    onValueChange: value => queries.push(value),
  }),
});

search.query.value.control.set('Angular');
search.query(); // ''
assert.deepEqual(queries, []);
search.query.markAsTouched();
search.query(); // 'Angular'
assert.deepEqual(queries, ['Angular']);
