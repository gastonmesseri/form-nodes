import type { Equal, Expect } from './assert.types';
import { array, field, form, group, createFormPrimitives, type DynamicNode } from '../../src/public-api';

const configured = createFormPrimitives({ nullable: false });
const parent = form({ nested: form({}), section: group({}), shorthand: {}, rows: array({}) });
const records = [form({}), group({}), configured.form({}), configured.group({}), parent.nested, parent.section, parent.shorthand, parent.rows.at(0)!] as const;
for (const record of records) {
  const children = Object.values(record.children);
  type _Children = Expect<Equal<typeof children, DynamicNode[]>>;
  record.forEachChild((child, key) => {
    type _Child = Expect<Equal<typeof child, DynamicNode>>;
    type _Key = Expect<Equal<typeof key, string>>;
    child.set('value');
  });
  const values = Object.values(record.$api.children);
  type _ApiChildren = Expect<Equal<typeof values, DynamicNode[]>>;
  const missing = record.get('missing');
  type _Missing = Expect<Equal<typeof missing, DynamicNode | undefined>>;
}
const empty = form({});
const age = empty.add('age', field(2));
type _Added = Expect<Equal<ReturnType<typeof age>, number | null>>;
const inferred = form({ name: field(''), age: field(2) });
inferred.forEachChild(child => {
  type _Declared = Expect<Equal<typeof child, typeof inferred.name | typeof inferred.age>>;
});
