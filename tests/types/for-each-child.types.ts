import type { Equal, Expect } from './assert.types';
import { array, field, form, group, type DynamicNode } from '../../src/public-api';

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

for (const node of [profile, profile.address, tree]) {
  node.forEachChild((child, key) => {
    type _Dynamic = Expect<Equal<typeof child, DynamicNode>>;
    type _DynamicKey = Expect<Equal<typeof key, string>>;
    child.markAsTouched();
  }, { includeDynamic: true });
  node.$api.forEachChild(child => {
    type _DynamicApi = Expect<Equal<typeof child, DynamicNode>>;
  }, { includeDynamic: true });
}
profile.forEachChild(child => {
  type _ExplicitFalse = Expect<Equal<typeof child, typeof profile.name | typeof profile.address>>;
}, { includeDynamic: false });
profile.address.forEachChild(child => {
  type _EmptyOptions = Expect<Equal<typeof child, typeof profile.address.city>>;
}, {});
declare const includeDynamic: boolean;
profile.forEachChild(child => {
  type _BooleanOption = Expect<Equal<typeof child, DynamicNode>>;
}, { includeDynamic });
declare const optionalOptions: { includeDynamic?: boolean };
profile.address.forEachChild(child => {
  type _OptionalBoolean = Expect<Equal<typeof child, DynamicNode>>;
}, optionalOptions);
// @ts-expect-error Inclusion options accept only booleans.
profile.forEachChild(() => {}, { includeDynamic: 'yes' });
