import { field, type DisabledReason, type FieldApi, type AnyNode } from '../../src/public-api';

field('', { debounce: 'blur' });
field('', { debounce: async abortSignal => { void abortSignal.aborted; } });
field('', { inheritInjector: false });
field('', { adoptBindingInjector: false });
// @ts-expect-error Unsupported debounce strategy.
field('', { debounce: 'change' });

import type { Equal, Expect, HasKey } from './assert.types';

const nullable = field('David');
const explicitlyNullable = field.nullable('David');
const explicitlyNonNullable = field.strict('David');
const emptyExplicitlyNullable = field.nullable<string>();
type _FieldNodeType = Expect<Equal<ReturnType<typeof nullable.nodeType>, 'field'>>;
const nonNullable = field.strict('David');
const explicit = field<number>(undefined);
const explicitNull = field<string>(null);
const unknownNullable = field(null);
const unknownNullableWithOptions = field(null, { debounce: 'blur' });
const unknownUndefined = field(undefined);
const unknownUndefinedWithOptions = field(undefined, { debounce: 'blur' });

type _NullableValue = Expect<Equal<ReturnType<typeof nullable>, string | null>>;
type _ExplicitlyNullableValue = Expect<Equal<ReturnType<typeof explicitlyNullable>, string | null>>;
type _ExplicitlyNonNullableValue = Expect<Equal<ReturnType<typeof explicitlyNonNullable>, string>>;
type _EmptyExplicitlyNullableValue = Expect<Equal<ReturnType<typeof emptyExplicitlyNullable>, string | null>>;
type _NonNullableValue = Expect<Equal<ReturnType<typeof nonNullable>, string>>;
type _ExplicitValue = Expect<Equal<ReturnType<typeof explicit>, number | null | undefined>>;
type _ExplicitNullValue = Expect<Equal<ReturnType<typeof explicitNull>, string | null>>;
type _UnknownNullableValue = Expect<Equal<ReturnType<typeof unknownNullable>, unknown>>;
type _UnknownNullableOptionsValue = Expect<Equal<ReturnType<typeof unknownNullableWithOptions>, unknown>>;
type _UnknownUndefinedValue = Expect<Equal<ReturnType<typeof unknownUndefined>, unknown>>;
type _UnknownUndefinedOptionsValue = Expect<Equal<ReturnType<typeof unknownUndefinedWithOptions>, unknown>>;
type _ApiValue = Expect<Equal<ReturnType<typeof nullable.$api.value>, string | null>>;
type _StableApiValue = Expect<Equal<ReturnType<typeof nullable.$api.value>, string | null>>;
type _Minimum = Expect<Equal<ReturnType<typeof nullable.min>, string | null>>;
type _Maximum = Expect<Equal<ReturnType<typeof nonNullable.max>, string | null>>;
type _MinimumLength = Expect<Equal<ReturnType<typeof nullable.minLength>, number | null>>;
type _MaximumLength = Expect<Equal<ReturnType<typeof nullable.maxLength>, number | null>>;
type _Patterns = Expect<Equal<ReturnType<typeof nullable.pattern>, readonly RegExp[]>>;
type _RootKeyInParent = Expect<Equal<ReturnType<typeof nullable.keyInParent>, string | number | null>>;
type _StandaloneRoot = Expect<Equal<ReturnType<ReturnType<typeof nullable.root>['nodeType']>, 'field' | 'form' | 'group' | 'array'>>;
type _DisabledReasons = Expect<Equal<ReturnType<typeof nullable.disabledReasons>, readonly DisabledReason[]>>;
type _NoInternalParentSetter = Expect<Equal<HasKey<typeof nullable, '_setParent'>, false>>;
type _NoInternalClone = Expect<Equal<HasKey<FieldApi<string | null>, '_clone'>, false>>;

nullable.set('Daniel');
nullable.set(null);
unknownNullable.set('Daniel');
unknownNullable.set(42);
unknownNullable.set(null);
unknownUndefined.set('Daniel');
unknownUndefined.set(42);
unknownUndefined.set(null);
explicit.set(undefined);
nonNullable.set('Daniel');
nullable.update((value) => value?.toUpperCase() ?? null);
nullable.reset();
nullable.reset('Daniel');
nullable.focus({ preventScroll: true });
nullable.disable('Managed externally');
nullable.errors()[0]?.formNode?.focus({ preventScroll: true });
nullable.errors()[0]?.formNode?.element.focus();

// @ts-expect-error a string field cannot receive a number
nullable.set(42);
// @ts-expect-error a non-nullable field cannot receive null
nonNullable.set(null);
// @ts-expect-error field.strict requires a non-null initial value
field.strict(null);
// @ts-expect-error an undefined initial value cannot create a non-nullable field
field.strict(undefined);
// @ts-expect-error field patching is intentionally exposed only through api
nullable.patch('Daniel');
// @ts-expect-error native callable members are intentionally hidden
nullable.apply(undefined, []);

type IborCode = 'DAILY' | 'MONTHLY' | null;
const iborCode = field<IborCode>('DAILY');
const nullableIborCode = field.nullable<IborCode>('MONTHLY');
const undefinedIborCode = field<IborCode>(undefined);
type _IborValue = Expect<Equal<ReturnType<typeof iborCode>, IborCode>>;
type _NullableIborValue = Expect<Equal<ReturnType<typeof nullableIborCode>, IborCode>>;
type _UndefinedIborValue = Expect<Equal<ReturnType<typeof undefinedIborCode>, IborCode | undefined>>;
// @ts-expect-error An empty string is not a member of the declared union.
field<IborCode>('');
// @ts-expect-error Unsupported initial codes must still be rejected.
field<IborCode>('WEEKLY');
// @ts-expect-error Nullable fields retain the declared literal union.
field.nullable<IborCode>('WEEKLY');
// @ts-expect-error Future values retain the declared literal union.
iborCode.set('WEEKLY');
