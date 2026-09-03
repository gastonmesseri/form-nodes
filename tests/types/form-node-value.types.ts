import type { Equal, Expect } from './assert.types';
import { array, createFormPrimitives, field, form, group, type Node, type FormNodeValue, type FormValue } from '../../src/public-api';

const profile = form({
  name: field('Marco'),
  id: field.strict<number>(1),
  nickname: field<string>(undefined),
  address: { city: field('Zurich') },
  preferences: group({ subscribed: field.strict<boolean>(false) }),
  billing: form({ taxId: field('') }),
  contacts: array({ email: field('') }),
  tags: array(field('')),
  selectedRoles: field<string[]>([]),
  location: field<{ latitude: number; longitude: number }>(),
});

type ProfileValue = {
  name: string | null;
  id: number;
  nickname: string | null | undefined;
  address: { city: string | null };
  preferences: { subscribed: boolean };
  billing: { taxId: string | null };
  contacts: { email: string | null }[];
  tags: (string | null)[];
  selectedRoles: string[] | null;
  location: { latitude: number; longitude: number } | null;
};

type _ProfileValue = Expect<Equal<FormNodeValue<typeof profile>, ProfileValue>>;
type _CallableValue = Expect<Equal<FormNodeValue<typeof profile>, ReturnType<typeof profile>>>;
type _NestedFormValue = Expect<Equal<FormNodeValue<typeof profile.billing>, { taxId: string | null }>>;
type _ChildMapValue = Expect<Equal<FormValue<{ name: typeof profile.name }>, { name: string | null }>>;

const collisions = form({
  value: field.strict<number>(1),
  api: field('domain API'),
  nodeType: field('domain type'),
  name: field('name'),
  length: field.strict<number>(2),
});
type _CollidingMembers = Expect<Equal<FormNodeValue<typeof collisions>, {
  value: number;
  api: string | null;
  nodeType: string | null;
  name: string | null;
  length: number;
}>>;

const configured = createFormPrimitives({ nullable: false });
const configuredProfile = configured.form({
  name: configured.field('Marco'),
  nickname: configured.field.nullable(''),
  contacts: configured.array({ email: configured.field('') }),
});
type _ConfiguredValue = Expect<Equal<FormNodeValue<typeof configuredProfile>, {
  name: string;
  nickname: string | null;
  contacts: { email: string }[];
}>>;

const empty = form({});
type _EmptyValue = Expect<Equal<FormNodeValue<typeof empty>, {}>>;
type _UnionValue = Expect<Equal<FormNodeValue<typeof profile | typeof configuredProfile>, ProfileValue | FormNodeValue<typeof configuredProfile>>>;

const dynamic = profile.add('age', field(0));
type _DeclaredValue = Expect<Equal<FormNodeValue<typeof profile>, ProfileValue>>;
type _DynamicChildValue = Expect<Equal<ReturnType<typeof dynamic>, number | null>>;

type SavedNode<TNode extends Node> = { value: FormNodeValue<TNode> };
type _GenericValue = Expect<Equal<SavedNode<typeof profile>['value'], ProfileValue>>;

type _FieldValue = Expect<Equal<FormNodeValue<typeof profile.name>, string | null>>;
type _StrictFieldValue = Expect<Equal<FormNodeValue<typeof profile.id>, number>>;
type _UndefinedFieldValue = Expect<Equal<FormNodeValue<typeof profile.nickname>, string | null | undefined>>;
type _AtomicArrayValue = Expect<Equal<FormNodeValue<typeof profile.selectedRoles>, string[] | null>>;
type _AtomicObjectValue = Expect<Equal<FormNodeValue<typeof profile.location>, { latitude: number; longitude: number } | null>>;
type _GroupValue = Expect<Equal<FormNodeValue<typeof profile.preferences>, { subscribed: boolean }>>;
type _ShorthandGroupValue = Expect<Equal<FormNodeValue<typeof profile.address>, { city: string | null }>>;
type _ArrayValue = Expect<Equal<FormNodeValue<typeof profile.contacts>, { email: string | null }[]>>;
type _PrimitiveArrayValue = Expect<Equal<FormNodeValue<typeof profile.tags>, (string | null)[]>>;
type _DynamicValue = Expect<Equal<FormNodeValue<typeof dynamic>, number | null>>;
type _MixedNodeUnion = Expect<Equal<FormNodeValue<typeof profile.name | typeof profile.preferences | typeof profile.contacts>, string | null | { subscribed: boolean } | { email: string | null }[]>>;

const standaloneField = field<'draft' | 'published'>('draft');
const standaloneGroup = group({ api: field('domain API'), value: field.strict<number>(1) });
const standaloneArray = array(() => form({ name: field('') }));
const unknownField = field();
type _LiteralField = Expect<Equal<FormNodeValue<typeof standaloneField>, 'draft' | 'published' | null>>;
type _StandaloneGroup = Expect<Equal<FormNodeValue<typeof standaloneGroup>, { api: string | null; value: number }>>;
type _StandaloneArray = Expect<Equal<FormNodeValue<typeof standaloneArray>, { name: string | null }[]>>;
type _ArrayItem = Expect<Equal<FormNodeValue<NonNullable<(typeof standaloneArray)[number]>>, { name: string | null }>>;
type _UnknownField = Expect<Equal<FormNodeValue<typeof unknownField>, unknown>>;

const configuredGroup = configured.group({ name: configured.field('Marco') });
type _ConfiguredGroup = Expect<Equal<FormNodeValue<typeof configuredGroup>, { name: string }>>;
type _ConfiguredField = Expect<Equal<FormNodeValue<typeof configuredProfile.name>, string>>;
type _ConfiguredNullableField = Expect<Equal<FormNodeValue<typeof configuredProfile.nickname>, string | null>>;
type _ConfiguredArray = Expect<Equal<FormNodeValue<typeof configuredProfile.contacts>, { email: string }[]>>;
type _GenericFieldValue = Expect<Equal<SavedNode<typeof standaloneField>['value'], 'draft' | 'published' | null>>;

// @ts-expect-error the helper takes an instance type, not a map of child definitions
type _Definitions = FormNodeValue<{ name: typeof profile.name }>;
// @ts-expect-error an ordinary callable does not represent a form node
type _PlainFunction = FormNodeValue<() => { name: string }>;
