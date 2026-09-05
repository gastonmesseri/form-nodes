import '@angular/compiler';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { array, field, form, required } from '@ngblocks/form-nodes';

test('packed fields validate and reset interaction outside injection', () => {
  const name = field('', [required]);
  assert.equal(name.invalid(), true);
  name.set('Marco');
  assert.equal(name.valid(), true);
  name.markAsTouched();
  name.markAsDirty();
  name.reset();
  assert.equal(name(), 'Marco');
  assert.equal(name.touched(), false);
  assert.equal(name.dirty(), false);
});

test('packed forms aggregate child values and validation', () => {
  const profile = form({
    name: field('', [required]),
    address: { city: field('Zurich') },
  });
  assert.equal(profile.invalid(), true);
  profile.name.set('Marco');
  assert.equal(profile.valid(), true);
  assert.deepEqual(profile(), { name: 'Marco', address: { city: 'Zurich' } });
});

test('packed array templates create independent children', () => {
  const profile = form({
    contacts: array({ name: field('') }, { initialValue: 2 }),
  });
  profile.contacts[0].name.set('Marco');
  assert.deepEqual(profile.contacts(), [{ name: 'Marco' }, { name: '' }]);
});
