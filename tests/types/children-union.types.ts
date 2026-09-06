import type { Equal, Expect } from './assert.types';
import { array, field, form, group, type DynamicNode } from '../../src/public-api';

const profile = form({
  fields: group({ name: field('Marco'), age: field(30) }),
  mixed: form({ name: field('Marco'), address: { city: field('Zurich') }, rows: array(field(0)) }),
});
const fields = Object.values(profile.fields.children);
type _FieldUnion = Expect<Equal<typeof fields[number], typeof profile.fields.name | typeof profile.fields.age>>;
const mixed = Object.values(profile.mixed.children);
type _MixedUnion = Expect<Equal<typeof mixed[number], typeof profile.mixed.name | typeof profile.mixed.address | typeof profile.mixed.rows>>;
const root = Object.values(profile.children);
type _RootUnion = Expect<Equal<typeof root[number], typeof profile.fields | typeof profile.mixed>>;
const added = profile.fields.add('active', field(true));
type _Added = Expect<Equal<ReturnType<typeof added>, boolean | null>>;
const dynamic = profile.fields.get('active');
type _Dynamic = Expect<Equal<typeof dynamic, DynamicNode | undefined>>;
fields.forEach(child => child.markAsTouched());
