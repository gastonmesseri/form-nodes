import { field, type FieldApi } from '../src/public-api';

import type { Equal, Expect, HasKey } from './assert.types';

const nullable = field('David');
const nonNullable = field('David', { nullable: false });
const explicit = field<number>(undefined);

type _NullableValue = Expect<Equal<ReturnType<typeof nullable>, string | null>>;
type _NonNullableValue = Expect<Equal<ReturnType<typeof nonNullable>, string>>;
type _ExplicitValue = Expect<Equal<ReturnType<typeof explicit>, number | null>>;
type _ApiValue = Expect<Equal<ReturnType<typeof nullable.api.value>, string | null>>;
type _RootKeyInParent = Expect<Equal<ReturnType<typeof nullable.keyInParent>, string | number | null>>;
type _NoInternalParentSetter = Expect<Equal<HasKey<typeof nullable, '_setParent'>, false>>;
type _NoInternalClone = Expect<Equal<HasKey<FieldApi<string | null>, '_clone'>, false>>;

nullable.set('Daniel');
nullable.set(null);
nonNullable.set('Daniel');
nullable.update((value) => value?.toUpperCase() ?? null);
nullable.reset();
nullable.reset('Daniel');

// @ts-expect-error a string field cannot receive a number
nullable.set(42);
// @ts-expect-error a non-nullable field cannot receive null
nonNullable.set(null);
// @ts-expect-error field patching is intentionally exposed only through api
nullable.patch('Daniel');
// @ts-expect-error native callable members are intentionally hidden
nullable.apply(undefined, []);
