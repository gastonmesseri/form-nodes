import { field, form } from '../src/public-api';

import type { Equal, Expect } from './assert.types';

const profile = form({
  name: field('David'),
  age: field(42, { nullable: false }),
  address: {
    city: field('Zurich'),
  },
});

type ProfileValue = {
  name: string | null;
  age: number;
  address: { city: string | null };
};

type _CallableValue = Expect<Equal<ReturnType<typeof profile>, ProfileValue>>;
type _ApiValue = Expect<Equal<ReturnType<typeof profile.api.value>, ProfileValue>>;
type _NestedValue = Expect<Equal<ReturnType<typeof profile.address.city>, string | null>>;
type _ChildParent = Expect<Equal<ReturnType<typeof profile.name.parent>, typeof profile | null>>;
type _NestedRoot = Expect<Equal<ReturnType<typeof profile.address.city.form>, typeof profile | null>>;

profile.set({ name: 'Daniel', age: 43, address: { city: 'Bern' } });
profile.patch({ address: { city: 'Geneva' } });
profile.update((value) => ({ ...value, age: value.age + 1 }));
profile.reset();
profile.reset({ name: null, age: 42, address: { city: null } });

// @ts-expect-error set requires every form property
profile.set({ name: 'Daniel', age: 43 });
// @ts-expect-error patch cannot contain unknown properties
profile.patch({ unknown: true });
// @ts-expect-error nested field value has the wrong type
profile.patch({ address: { city: 42 } });
// @ts-expect-error api is a reserved form child key
form({ api: field('reserved') });

const collisions = form({
  readonly: field(false),
  reset: field('child'),
  name: field('name'),
  apply: field('apply'),
});

type _ReadonlyCollision = Expect<Equal<ReturnType<typeof collisions.readonly>, boolean | null>>;
type _ResetCollision = Expect<Equal<ReturnType<typeof collisions.reset>, string | null>>;
type _NameCollision = Expect<Equal<ReturnType<typeof collisions.name>, string | null>>;
type _ApplyCollision = Expect<Equal<ReturnType<typeof collisions.apply>, string | null>>;
type _ApiReadonlyUnaffected = Expect<Equal<ReturnType<typeof collisions.api.readonly>, boolean>>;

// @ts-expect-error children is a readonly map
profile.children.name = field('Replacement');
