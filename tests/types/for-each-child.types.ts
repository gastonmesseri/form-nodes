import type { Equal, Expect } from './assert.types';
import { array, field, form, group } from '../../src/public-api';

const profile = form({ name: field('Marco'), address: group({ city: field('Zurich') }) });
profile.forEachChild((child, key) => {
  type _Child = Expect<Equal<typeof child, typeof profile.name | typeof profile.address>>;
  type _Key = Expect<Equal<typeof key, string>>;
  child.markAsTouched();
});
const result = profile.address.forEachChild((child, key) => {
  type _Child = Expect<Equal<typeof child, typeof profile.address.city>>;
  type _Key = Expect<Equal<typeof key, string>>;
  child.markAsDirty();
});
type _Return = Expect<Equal<typeof result, void>>;
form({ forEachChild: field(0) }).$api.forEachChild(child => child.markAsTouched());
group({ forEachChild: field(0) }).$api.forEachChild(child => child.markAsTouched());

const mixed = form({ username: field(''), age: field(2) });
mixed.forEachChild(child => {
  type _Mixed = Expect<Equal<typeof child, typeof mixed.username | typeof mixed.age>>;
  const value = child();
  type _Value = Expect<Equal<typeof value, string | number | null>>;
  // @ts-expect-error A string is not accepted by the numeric member of the union.
  child.set('');
});
const strings = form({ username: field(''), email: field('') });
strings.forEachChild(child => child.set(''));
const tree = group({ nested: form({ name: field('') }), rows: array(field(0)) });
tree.forEachChild(child => {
  type _Tree = Expect<Equal<typeof child, typeof tree.nested | typeof tree.rows>>;
});
