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
});

type _String = Expect<Equal<ReturnType<typeof shorthand.text>, string | null>>;
type _Number = Expect<Equal<ReturnType<typeof shorthand.count>, number | null>>;
type _Boolean = Expect<Equal<ReturnType<typeof shorthand.enabled>, boolean | null>>;
type _Bigint = Expect<Equal<ReturnType<typeof shorthand.largeCount>, bigint | null>>;
type _Symbol = Expect<Equal<ReturnType<typeof shorthand.token>, symbol | null>>;
type _Date = Expect<Equal<ReturnType<typeof shorthand.createdAt>, Date | null>>;
type _Null = Expect<Equal<ReturnType<typeof shorthand.empty>, unknown>>;
type _Undefined = Expect<Equal<ReturnType<typeof shorthand.missing>, unknown>>;
type _NestedObject = Expect<Equal<ReturnType<typeof shorthand.nested>, { city: string | null }>>;
type _ClassInstance = Expect<Equal<ReturnType<typeof shorthand.user>, User | null>>;

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
type _MixedConcise = Expect<Equal<ReturnType<typeof mixed.concise>, number | null>>;
type _MixedNestedConcise = Expect<Equal<ReturnType<typeof mixed.nested.concise>, boolean | null>>;
type _MixedNestedExplicit = Expect<Equal<ReturnType<typeof mixed.nested.explicit>, Date | null>>;

const literalDefinition = {
  status: 'draft',
  attempts: 1,
  nested: { enabled: false },
} as const;
const literalForm = form(literalDefinition);
type _ConstStringWidening = Expect<Equal<ReturnType<typeof literalForm.status>, string | null>>;
type _ConstNumberWidening = Expect<Equal<ReturnType<typeof literalForm.attempts>, number | null>>;
type _ConstBooleanWidening = Expect<Equal<ReturnType<typeof literalForm.nested.enabled>, boolean | null>>;

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
type _SatisfiedName = Expect<Equal<ReturnType<typeof satisfiedForm.name>, string | null>>;
type _SatisfiedTheme = Expect<Equal<ReturnType<typeof satisfiedForm.preferences.theme>, string | null>>;

type OptionalProfile = {
  readonly nickname?: string;
  readonly age: number;
};
declare const optionalProfile: OptionalProfile;
const optionalForm = form({ profile: optionalProfile });
type _OptionalValue = Expect<Equal<ReturnType<typeof optionalForm.profile>, { readonly nickname?: string | null; readonly age: number | null }>>;

declare const textOrDate: string | Date;
declare const countOrMissing: number | undefined;
const unionForm = form({ textOrDate, countOrMissing });
type _AtomicUnion = Expect<Equal<ReturnType<typeof unionForm.textOrDate>, string | Date | null>>;
type _NullableUnion = Expect<Equal<ReturnType<typeof unionForm.countOrMissing>, number | null | undefined>>;

type Company = {
  companyId: number;
  companyName: string;
};
const company: Company = { companyId: 23, companyName: 'Apple' };
const predeclaredForm = form({ company });
type _PredeclaredObject = Expect<Equal<ReturnType<typeof predeclaredForm.company>, { companyId: number | null; companyName: string | null }>>;

form({
  name: '',
  age: field(18),
}, {
  validators: ({ value, api }) => {
    type _ValueContext = Expect<Equal<ReturnType<typeof value>, { name: string | null; age: number | null }>>;
    type _ApiContext = Expect<Equal<ReturnType<typeof api.value>, { name: string | null; age: number | null }>>;
    return value().name && value().age! >= 18 ? null : { kind: 'invalidProfile' };
  },
});

group({
  city: '',
  postcode: field(8000),
}, {
  validators: ({ value }) => {
    type _GroupValueContext = Expect<Equal<ReturnType<typeof value>, { city: string | null; postcode: number | null }>>;
    return value().city ? null : { kind: 'missingCity' };
  },
});

// @ts-expect-error array-valued fields must use field([...]) explicitly
form({ roles: ['admin'] });
// @ts-expect-error empty arrays do not imply an array node or an array-valued field
form({ roles: [] });
// @ts-expect-error readonly tuples remain ambiguous array declarations
form({ coordinates: [47.37, 8.54] as const });
// @ts-expect-error symbol keys cannot be represented by object-node runtime paths
form({ [childKey]: field('value') });
// @ts-expect-error groups reject symbol child keys for the same reason
group({ [childKey]: field('value') });

form({ roles: field(['admin']) });
form({ roles: array(field(''), ['admin']) });
