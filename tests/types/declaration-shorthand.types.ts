import { array, field, form, group } from '../../src/public-api';

import type { Equal, Expect } from './assert.types';

class User {
  name = 'Ada';
}

const token = Symbol('token');
const childKey = Symbol('child');
const createdAt = new Date('2026-09-04T00:00:00.000Z');
const shorthand = form({
  text: 'draft',
  count: 1,
  enabled: false,
  largeCount: 1n,
  token,
  createdAt,
  empty: null,
  missing: undefined,
  nested: {
    city: 'Zurich',
  },
  user: new User(),
  roles: ['admin'],
  emptyList: [],
  readonlyEmptyList: [] as const,
  coordinates: [47.37, 8.54] as const,
  companies: [{ companyId: 23, companyName: 'Apple' }],
});

type _String = Expect<Equal<ReturnType<typeof shorthand.text>, string>>;
type _Number = Expect<Equal<ReturnType<typeof shorthand.count>, number>>;
type _Boolean = Expect<Equal<ReturnType<typeof shorthand.enabled>, boolean>>;
type _Bigint = Expect<Equal<ReturnType<typeof shorthand.largeCount>, bigint>>;
type _Symbol = Expect<Equal<ReturnType<typeof shorthand.token>, symbol>>;
type _Date = Expect<Equal<ReturnType<typeof shorthand.createdAt>, Date>>;
type _Null = Expect<Equal<ReturnType<typeof shorthand.empty>, unknown>>;
type _Undefined = Expect<Equal<ReturnType<typeof shorthand.missing>, unknown>>;
type _NestedObject = Expect<Equal<ReturnType<typeof shorthand.nested>, { city: string }>>;
type _ClassInstance = Expect<Equal<ReturnType<typeof shorthand.user>, User>>;
type _Array = Expect<Equal<ReturnType<typeof shorthand.roles>, string[]>>;
type _EmptyArray = Expect<Equal<ReturnType<typeof shorthand.emptyList>, unknown[]>>;
type _ReadonlyEmptyArray = Expect<Equal<ReturnType<typeof shorthand.readonlyEmptyList>, readonly unknown[]>>;
type _ReadonlyTuple = Expect<Equal<ReturnType<typeof shorthand.coordinates>, readonly [47.37, 8.54]>>;
type _ObjectArray = Expect<Equal<ReturnType<typeof shorthand.companies>, Array<{ companyId: number; companyName: string }>>>;

const dynamic = form({ fixed: '' });
const dynamicCount = dynamic.add('count', 1);
const dynamicEmpty = dynamic.add('empty', null);
const dynamicUser = dynamic.add('user', new User());
const dynamicRoles = dynamic.add('roles', ['admin']);
const dynamicBatch = dynamic.add({
  enabled: false,
  address: { city: 'Zurich' },
});

type _DynamicNumber = Expect<Equal<ReturnType<typeof dynamicCount>, number>>;
type _DynamicNull = Expect<Equal<ReturnType<typeof dynamicEmpty>, unknown>>;
type _DynamicClassInstance = Expect<Equal<ReturnType<typeof dynamicUser>, User>>;
type _DynamicArray = Expect<Equal<ReturnType<typeof dynamicRoles>, string[]>>;
type _DynamicBoolean = Expect<Equal<ReturnType<typeof dynamicBatch.enabled>, boolean>>;
type _DynamicGroup = Expect<Equal<ReturnType<typeof dynamicBatch.address>, { city: string }>>;

const dynamicGroup = group({ fixed: '' });
const dynamicCategory = dynamicGroup.add('category', 'all');
const dynamicGroupBatch = dynamicGroup.add({ page: 1, range: { minimum: 0 } });

type _DynamicGroupString = Expect<Equal<ReturnType<typeof dynamicCategory>, string>>;
type _DynamicGroupNumber = Expect<Equal<ReturnType<typeof dynamicGroupBatch.page>, number>>;
type _DynamicNestedGroup = Expect<Equal<ReturnType<typeof dynamicGroupBatch.range>, { minimum: number }>>;

const dynamicPreferences = dynamic.add({ preferences: { roles: ['admin'] } });
const dynamicGroupRoles = dynamicGroup.add('roles', ['admin']);
type _DynamicNestedArray = Expect<Equal<ReturnType<typeof dynamicPreferences.preferences.roles>, string[]>>;
type _DynamicGroupArray = Expect<Equal<ReturnType<typeof dynamicGroupRoles>, string[]>>;

const shorthandRows = array({ name: '', age: 0, roles: ['viewer'], address: { city: '' } }, {
  initialValue: [{ name: 'Marco', age: 36, roles: ['admin'], address: { city: 'Zurich' } }],
});
const shorthandRow = shorthandRows[0]!;

type _ArrayShorthandItem = Expect<Equal<ReturnType<typeof shorthandRow>, {
  name: string;
  age: number;
  roles: string[];
  address: { city: string };
}>>;
type _ArrayShorthandName = Expect<Equal<ReturnType<typeof shorthandRow.name>, string>>;
type _ArrayShorthandAge = Expect<Equal<ReturnType<typeof shorthandRow.age>, number>>;
type _ArrayShorthandRoles = Expect<Equal<ReturnType<typeof shorthandRow.roles>, string[]>>;
type _ArrayShorthandAddress = Expect<Equal<ReturnType<typeof shorthandRow.address>, { city: string }>>;

const factoryRows = array(() => ({ name: '', user: new User() }), 1);
const factoryRow = factoryRows[0]!;
type _ArrayFactoryShorthandName = Expect<Equal<ReturnType<typeof factoryRow.name>, string>>;
type _ArrayFactoryClassInstance = Expect<Equal<ReturnType<typeof factoryRow.user>, User>>;

array({ roles: ['admin'] });
// @ts-expect-error a root array is not an object-item template
array([]);

const explicitField = field('Ada');
const explicitGroup = group({ city: field('Zurich') });
const explicitForm = form({ step: field(1) });
const explicitArray = array(field(''));
const mixed = form({
  concise: 1,
  explicitField,
  explicitGroup,
  explicitForm,
  explicitArray,
  nested: {
    concise: true,
    explicit: field(new Date()),
  },
});

type _PreservedField = Expect<Equal<ReturnType<typeof mixed.explicitField.nodeType>, 'field'>>;
type _PreservedGroup = Expect<Equal<ReturnType<typeof mixed.explicitGroup.nodeType>, 'group'>>;
type _PreservedForm = Expect<Equal<ReturnType<typeof mixed.explicitForm.nodeType>, 'form'>>;
type _PreservedArray = Expect<Equal<ReturnType<typeof mixed.explicitArray.nodeType>, 'array'>>;
type _MixedConcise = Expect<Equal<ReturnType<typeof mixed.concise>, number>>;
type _MixedNestedConcise = Expect<Equal<ReturnType<typeof mixed.nested.concise>, boolean>>;
type _MixedNestedExplicit = Expect<Equal<ReturnType<typeof mixed.nested.explicit>, Date>>;

const literalDefinition = {
  status: 'draft',
  attempts: 1,
  nested: { enabled: false },
} as const;
const literalForm = form(literalDefinition);
type _ConstStringWidening = Expect<Equal<ReturnType<typeof literalForm.status>, string>>;
type _ConstNumberWidening = Expect<Equal<ReturnType<typeof literalForm.attempts>, number>>;
type _ConstBooleanWidening = Expect<Equal<ReturnType<typeof literalForm.nested.enabled>, boolean>>;

type ProfileDefinition = {
  readonly name: string;
  readonly preferences: {
    readonly theme: string;
  };
};
const satisfiedDefinition = {
  name: 'Ada',
  preferences: { theme: 'dark' },
} as const satisfies ProfileDefinition;
const satisfiedForm = form(satisfiedDefinition);
type _SatisfiedName = Expect<Equal<ReturnType<typeof satisfiedForm.name>, string>>;
type _SatisfiedTheme = Expect<Equal<ReturnType<typeof satisfiedForm.preferences.theme>, string>>;

type OptionalProfile = {
  readonly nickname?: string;
  readonly age: number;
};
declare const optionalProfile: OptionalProfile;
const optionalForm = form({ profile: optionalProfile });
type _OptionalValue = Expect<Equal<ReturnType<typeof optionalForm.profile>, { readonly nickname?: string; readonly age: number }>>;

declare const textOrDate: string | Date;
declare const countOrMissing: number | undefined;
const unionForm = form({ textOrDate, countOrMissing });
type _AtomicUnion = Expect<Equal<ReturnType<typeof unionForm.textOrDate>, string | Date>>;
type _NullableUnion = Expect<Equal<ReturnType<typeof unionForm.countOrMissing>, number | undefined>>;

type Company = {
  companyId: number;
  companyName: string;
};
const company: Company = { companyId: 23, companyName: 'Apple' };
const predeclaredForm = form({ company });
type _PredeclaredObject = Expect<Equal<ReturnType<typeof predeclaredForm.company>, { companyId: number; companyName: string }>>;

form({
  name: '',
  age: field(18),
}, {
  validators: ({ value, node }) => {
    const api = node().$api;
    type _ValueContext = Expect<Equal<ReturnType<typeof value>, { name: string; age: number }>>;
    type _ApiContext = Expect<Equal<ReturnType<typeof api.value>, { name: string; age: number }>>;
    return value().name && value().age! >= 18 ? null : { kind: 'invalidProfile' };
  },
});

group({
  city: '',
  postcode: field(8000),
}, {
  validators: ({ value }) => {
    type _GroupValueContext = Expect<Equal<ReturnType<typeof value>, { city: string; postcode: number }>>;
    return value().city ? null : { kind: 'missingCity' };
  },
});

const nestedValueForm = form({
  name: field(''),
  address: {
    city: field.strict(''),
    details: {
      country: field(''),
    },
  },
});
type _MaterializedNestedValue = Expect<Equal<ReturnType<typeof nestedValueForm>, {
  name: string;
  address: {
    city: string;
    details: {
      country: string;
    };
  };
}>>;

form({ roles: ['admin'] });
form({ roles: [] });
form({ coordinates: [47.37, 8.54] as const });
// @ts-expect-error symbol keys cannot be represented by object-node runtime paths
form({ [childKey]: field('value') });
// @ts-expect-error groups reject symbol child keys for the same reason
group({ [childKey]: field('value') });

form({ roles: field(['admin']) });
form({ roles: array(field(''), ['admin']) });
