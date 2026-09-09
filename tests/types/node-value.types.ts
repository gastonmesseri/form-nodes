import { field, form, array, type AnyNode, type FieldNode, type NodeValueSignal } from '../../src/public-api';

import type { Equal, Expect } from './assert.types';

const profile = form({ name: field.strict('Ada'), age: field(42) });
const view: NodeValueSignal<{ name: string; age: number | null }> = profile.value;
type _Committed = Expect<Equal<ReturnType<typeof profile.value.committed>, { name: string; age: number | null }>>;
type _Control = Expect<Equal<ReturnType<typeof profile.value.control>, ReturnType<typeof profile>>>;
profile.value.committed.set({ name: 'Grace', age: null });
profile.value.control.set({ name: 'Grace', age: 37 });
profile.name.value.committed.set('Grace');
profile.name.value.control.set('Ada');
// @ts-expect-error complete object required
profile.value.control.set({ name: 'Grace' });
// @ts-expect-error strict string input
profile.name.value.committed.set(null);
// @ts-expect-error string control input required
profile.name.value.control.set(42);
const names = array(field.strict(''));
names.value.control.set(null);
names.value.committed.set(undefined);
names.value.committed.set(['Ada']);
// @ts-expect-error array item type is string
names.value.control.set([42]);
const node: AnyNode = profile;
node.$api.value.control.set({ name: 'Ada', age: 37 });
node.$api.value.committed();
void view;

const myFieldNodeTyped: FieldNode = field('');
type _BareCommitted = Expect<Equal<ReturnType<typeof myFieldNodeTyped.value.committed>, any>>;
type _BareControl = Expect<Equal<ReturnType<typeof myFieldNodeTyped.value.control>, any>>;
myFieldNodeTyped.value.committed();
myFieldNodeTyped.value.control();
myFieldNodeTyped.value.committed.set('Ada');
myFieldNodeTyped.value.control.set('Grace');
const typedField: FieldNode<string> = field.strict('');
type _TypedCommitted = Expect<Equal<ReturnType<typeof typedField.value.committed>, string>>;
type _TypedControl = Expect<Equal<ReturnType<typeof typedField.value.control>, string>>;
// @ts-expect-error native callable members remain hidden
myFieldNodeTyped.value.call(null);
// @ts-expect-error native callable members remain hidden
myFieldNodeTyped.value.committed.bind(null);
// @ts-expect-error native callable members remain hidden
myFieldNodeTyped.value.control.apply(null);
