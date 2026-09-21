import assert from 'node:assert/strict';
import { Injector } from '@angular/core';
import { field, form } from '@ngblocks/form-nodes';

const profile = form({ name: field('Ada'), city: field('London') });
const names: string[] = [];
const snapshots: ReturnType<typeof profile>[] = [];

const stopName = profile.name.onValueChange(value => names.push(value));
const stopProfile = profile.onValueChange((value, node) => {
  snapshots.push(value);
  assert.equal(node, profile);
});

assert.deepEqual(names, []);
profile.patch({ name: 'Grace', city: 'New York' });
assert.deepEqual(names, ['Grace']);
assert.deepEqual(snapshots, [{ name: 'Grace', city: 'New York' }]);

stopName();
stopName();
profile.name.set('Lin');
assert.deepEqual(names, ['Grace']);
assert.equal(snapshots.length, 2);
stopProfile();

const owner = Injector.create({ providers: [] });
const ownedValues: string[] = [];
profile.name.onValueChange(value => ownedValues.push(value), { injector: owner });
profile.name.set('Ada');
owner.destroy();
profile.name.set('Grace');
assert.deepEqual(ownedValues, ['Ada']);
