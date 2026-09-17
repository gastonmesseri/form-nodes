import type { Signal, WritableSignal } from '@angular/core';

import { array, field, form, group, validator, type AnyNode, type FieldNode, type FormNode, type GroupNode, type ArrayNode } from '../../src/public-api';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

function acceptWritable<T>(value: WritableSignal<T>): T {
  value.update(current => current);
  value.set(value());
  return value.asReadonly()();
}

const profile = form({ age: field.strict(18), address: { city: field('Zurich') }, users: array({ name: field('Ada') }) });
const age = acceptWritable(profile.age);
type _Age = Expect<Equal<typeof age, number>>;
const value = acceptWritable<ReturnType<typeof profile>>(profile);
type _Form = Expect<Equal<typeof value, ReturnType<typeof profile>>>;
const address = acceptWritable(profile.address);
type _Group = Expect<Equal<typeof address, { city: string | null }>>;
const users = acceptWritable<ReturnType<typeof profile.users>>(profile.users);
type _Array = Expect<Equal<typeof users, { name: string | null }[]>>;
const facade = acceptWritable<ReturnType<typeof profile>>(profile.$api);
type _Facade = Expect<Equal<typeof facade, typeof value>>;
acceptWritable(profile.age.$api);
acceptWritable(profile.address.$api);
acceptWritable(profile.users.$api);
const nullable = acceptWritable(field(18));
type _Nullable = Expect<Equal<typeof nullable, number | null>>;
// @ts-expect-error Nullable fields cannot provide a non-nullable signal.
const strict: WritableSignal<number> = field(18);
// @ts-expect-error Readonly views do not expose writing operations.
profile.asReadonly().set(profile());
const readonlyAge: Signal<number> = profile.age.asReadonly();
// @ts-expect-error Readonly views cannot be passed to writable utilities.
acceptWritable(readonlyAge);

const collisions = form({ set: field('set'), update: field('update'), asReadonly: field('read') });
acceptWritable(collisions.$api);
// @ts-expect-error Colliding children remain children, not node operations.
acceptWritable(collisions);
const readChild: string | null = collisions.asReadonly();
const grouped = group({ asReadonly: field('read') });
acceptWritable(grouped.$api);
// @ts-expect-error A group with a colliding child is not directly writable-signal compatible.
acceptWritable(grouped);

function acceptGeneric(node: AnyNode, leaf: FieldNode, object: FormNode, branch: GroupNode, list: ArrayNode) {
  acceptWritable(node.$api);
  acceptWritable(leaf);
  acceptWritable(object.$api);
  acceptWritable(branch.$api);
  acceptWritable(list);
}

validator<string>(({ node }) => {
  const value: Signal<string> = node().asReadonly();
  // @ts-expect-error Validator node views cannot be passed to writable utilities.
  acceptWritable(node());
  // @ts-expect-error Validator API views cannot be passed to writable utilities.
  acceptWritable(node().$api);
  return value() ? null : { kind: 'empty' };
});
