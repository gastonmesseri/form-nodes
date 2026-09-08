import type { Equal, Expect } from './assert.types';
import { array, field, form, group, type DynamicNode } from '../../src/public-api';

const profile = form({
  fields: group({ name: field('Marco'), age: field(30) }),
  mixed: form({ name: field('Marco'), address: { city: field('Zurich') }, rows: array(field(0)) }),
});
const fields = Object.values(profile.fields.children);
type _FieldEntries = Expect<Equal<typeof fields[number], DynamicNode>>;
const mixed = Object.values(profile.mixed.children);
type _MixedEntries = Expect<Equal<typeof mixed[number], DynamicNode | typeof profile.mixed.name | typeof profile.mixed.address | typeof profile.mixed.rows>>;
const root = Object.values(profile.children);
type _RootEntries = Expect<Equal<typeof root[number], DynamicNode | typeof profile.fields | typeof profile.mixed>>;
const added = profile.fields.add('active', field(true));
type _Added = Expect<Equal<ReturnType<typeof added>, boolean | null>>;
const dynamic = profile.fields.get('active');
type _Dynamic = Expect<Equal<typeof dynamic, DynamicNode | undefined>>;
fields.forEach(child => child.markAsTouched());

const knownName = profile.fields.children.name;
type _KnownName = Expect<Equal<typeof knownName, typeof profile.fields.name>>;
const knownRows = profile.mixed.children.rows;
type _KnownRows = Expect<Equal<typeof knownRows, typeof profile.mixed.rows>>;
const missing = profile.children.nonExisting;
type _Missing = Expect<Equal<typeof missing, DynamicNode | undefined>>;
profile.children.nonExisting?.value();
profile.fields.children.nonExisting?.set('');
const lookupKey: string = 'active';
const lookedUp = profile.fields.children[lookupKey];
type _Lookup = Expect<Equal<typeof lookedUp, DynamicNode | undefined>>;
const aliased = profile.fields.$api.children.nonExisting;
type _Aliased = Expect<Equal<typeof aliased, DynamicNode | undefined>>;
// @ts-expect-error Known children keep their exact value contracts.
knownName.set(2);
// @ts-expect-error Dynamic children cannot be inserted by assigning to the readonly map.
profile.fields.children.another = field('');
// @ts-expect-error Unknown keys must be guarded before accessing their node API.
missing.set('');
