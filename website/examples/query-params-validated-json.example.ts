import assert from 'node:assert/strict';
import type { Injector } from '@angular/core';
import { field, form } from '@ngblocks/form-nodes';
import { queryParam, syncQueryParams, type QueryParamSerializer } from '@ngblocks/form-nodes/router';

type Profile = { name: string; address: { city: string } };
const json = queryParam.json<unknown>();

const profileSerializer: QueryParamSerializer<Profile> = {
  parse(values) {
    const value = json.parse(values);
    if (
      value === null || typeof value !== 'object' || Array.isArray(value)
      || !('name' in value) || typeof value.name !== 'string'
      || !('address' in value) || value.address === null || typeof value.address !== 'object'
      || Array.isArray(value.address) || !('city' in value.address) || typeof value.address.city !== 'string'
    ) {
      throw new Error('Expected a profile with a name and address.city.');
    }
    return { name: value.name, address: { city: value.address.city } };
  },
  serialize: value => json.serialize(value),
};

// Use the serializer when connecting the form in a Router-providing injection context.
export function connectProfile(injector: Injector) {
  const profile = form({
    name: field.strict('Ada'),
    address: { city: field.strict('Zurich') },
  });
  const sync = syncQueryParams({
    profile: { source: profile, serializer: profileSerializer },
  }, { injector });
  return { profile, sync };
}

assert.deepEqual(profileSerializer.parse(['{"name":"Grace","address":{"city":"Bern"}}']), {
  name: 'Grace',
  address: { city: 'Bern' },
});
assert.throws(() => profileSerializer.parse(['{"name":"Partial","address":123}']));
assert.throws(() => profileSerializer.parse(['null']));
assert.deepEqual(profileSerializer.serialize({ name: 'Ada', address: { city: 'Zurich' } }), [
  '{"name":"Ada","address":{"city":"Zurich"}}',
]);
