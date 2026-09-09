import type { Equal, Expect } from './assert.types';
import { array, field, form, group, createFormPrimitives, type FieldNode } from '../../src/public-api';

const profile = form();
const details = group();
const values = array();
type _Form = Expect<Equal<ReturnType<typeof profile>, {}>>;
type _Group = Expect<Equal<ReturnType<typeof details>, {}>>;
type _Array = Expect<Equal<ReturnType<typeof values>, unknown[]>>;
const item: FieldNode<unknown> = values.push('Ada');
const added = profile.add('name', field('Ada'));
const name: string | null = added();
// @ts-expect-error zero-argument construction cannot invent required children
form<{ name: FieldNode<string> }>();
// @ts-expect-error zero-argument construction cannot invent item template types
array<FieldNode<string>>();
for (const primitives of [createFormPrimitives(), createFormPrimitives({ nullable: false })]) {
  primitives.form().add('name', field('Ada'));
  primitives.group().add('enabled', field(true));
  const value: unknown = primitives.array().push()();
  void value;
}
void [item, name];
