import type { Equal, Expect } from './assert.types';
import { field, form, group, type DynamicNode } from '../../src/public-api';

const profile = form({ name: field('Marco'), address: group({ city: field('Zurich') }) });
profile.forEachChild((child, key) => {
  type _Child = Expect<Equal<typeof child, DynamicNode>>;
  type _Key = Expect<Equal<typeof key, string>>;
  child.markAsTouched();
});
const result = profile.address.forEachChild((child, key) => {
  type _Child = Expect<Equal<typeof child, DynamicNode>>;
  type _Key = Expect<Equal<typeof key, string>>;
  child.markAsDirty();
});
type _Return = Expect<Equal<typeof result, void>>;
form({ forEachChild: field(0) }).$api.forEachChild(child => child.markAsTouched());
group({ forEachChild: field(0) }).$api.forEachChild(child => child.markAsTouched());
