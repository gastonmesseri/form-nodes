import moment, { type Moment } from 'moment';

import { field, form } from '../../src/public-api';
import type { DynamicNode } from '../../src/public-api';

form({ name: field('') }, { debounce: 'blur' });
form({ name: field('') }, { debounce: abortSignal => Promise.resolve(void abortSignal.aborted) });
form({ name: field('') }, { inheritInjector: false });
form({ name: field('') }, { adoptBindingInjector: false });

import type { Equal, Expect } from './assert.types';

const profile = form({
  name: field('David'),
  age: field.strict(42),
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
type _ControlValue = Expect<Equal<ReturnType<typeof profile.controlValue>, ProfileValue>>;
type _NestedValue = Expect<Equal<ReturnType<typeof profile.address.city>, string | null>>;
type _ChildParent = Expect<Equal<ReturnType<typeof profile.name.parent>, typeof profile | null>>;
type _NestedRoot = Expect<Equal<ReturnType<typeof profile.address.city.form>, typeof profile | null>>;
type _FormRoot = Expect<Equal<ReturnType<typeof profile.root>, typeof profile>>;
type _NestedStructuralRoot = Expect<Equal<ReturnType<typeof profile.address.city.root>, typeof profile>>;
type _ChildKeyInParent = Expect<Equal<ReturnType<typeof profile.name.keyInParent>, string>>;
type _NestedKeyInParent = Expect<Equal<ReturnType<typeof profile.address.city.keyInParent>, string>>;

const expression = /forms/;
class Account {
  name = 'Marco';
}
class EmptyType {}
const account = new Account();
const emptyType = new EmptyType();
const objectValues = form({
  expression,
  lookup: new Map([['name', 'Marco']]),
  account,
  emptyType,
  calculate: (value: number) => value * 2,
});
type _RegExpField = Expect<Equal<ReturnType<typeof objectValues.expression>, RegExp | null>>;
type _MapField = Expect<Equal<ReturnType<typeof objectValues.lookup>, Map<string, string> | null>>;
type _ClassField = Expect<Equal<ReturnType<typeof objectValues.account>, Account | null>>;
type _EmptyClassField = Expect<Equal<ReturnType<typeof objectValues.emptyType>, EmptyType | null>>;
type _FunctionField = Expect<Equal<ReturnType<typeof objectValues.calculate>, ((value: number) => number) | null>>;

type Company = {
  companyId: number;
  companyName: string;
};
const defaultCompany: Company = { companyId: 23, companyName: 'Apple' };
const companyForm = form({
  inlineCompany: { companyId: 7, companyName: 'Google' },
  company: defaultCompany,
});
type _InlineCompanyValue = Expect<Equal<ReturnType<typeof companyForm.inlineCompany>, { companyId: number | null; companyName: string | null }>>;
type _TypedCompanyValue = Expect<Equal<ReturnType<typeof companyForm.company>, { companyId: number | null; companyName: string | null }>>;
type _InlineCompanyIdField = Expect<Equal<ReturnType<typeof companyForm.inlineCompany.companyId>, number | null>>;
type _TypedCompanyIdField = Expect<Equal<ReturnType<typeof companyForm.company.companyId>, number | null>>;

class User {}
const user = new User();
const shorthandNodeTypes = form({
  company: { companyId: 23, companyName: 'Apple' },
  user,
});
type _CompanyNodeType = Expect<Equal<ReturnType<typeof shorthandNodeTypes.company.nodeType>, 'group'>>;
type _UserNodeType = Expect<Equal<ReturnType<typeof shorthandNodeTypes.user.nodeType>, 'field'>>;

interface CompanyInterface {
  companyId: number;
  companyName: string;
}
const interfaceCompany: CompanyInterface = { companyId: 23, companyName: 'Apple' };
const interfaceCompanyForm = form({ company: { ...interfaceCompany } });
type _SpreadInterfaceCompanyValue = Expect<Equal<ReturnType<typeof interfaceCompanyForm.company>, { companyId: number | null; companyName: string | null }>>;

declare const textOrDate: string | Date;
const unionForm = form({ value: textOrDate });
type _AtomicUnionField = Expect<Equal<ReturnType<typeof unionForm.value>, string | Date | null>>;

const uniqueValue = Symbol('value');
const shorthandMatrix = form({
  text: 'draft',
  count: 1,
  enabled: false,
  largeCount: 1n,
  uniqueValue,
  empty: null,
  missing: undefined,
  createdAt: new Date(),
  calculate: (value: number) => value * 2,
} as const);
type _ShorthandText = Expect<Equal<ReturnType<typeof shorthandMatrix.text>, string | null>>;
type _ShorthandCount = Expect<Equal<ReturnType<typeof shorthandMatrix.count>, number | null>>;
type _ShorthandBoolean = Expect<Equal<ReturnType<typeof shorthandMatrix.enabled>, boolean | null>>;
type _ShorthandBigint = Expect<Equal<ReturnType<typeof shorthandMatrix.largeCount>, bigint | null>>;
type _ShorthandSymbol = Expect<Equal<ReturnType<typeof shorthandMatrix.uniqueValue>, symbol | null>>;
type _ShorthandNull = Expect<Equal<ReturnType<typeof shorthandMatrix.empty>, unknown>>;
type _ShorthandUndefined = Expect<Equal<ReturnType<typeof shorthandMatrix.missing>, unknown>>;
type _ShorthandDate = Expect<Equal<ReturnType<typeof shorthandMatrix.createdAt>, Date | null>>;

const momentForm = form({ appointment: moment('2026-09-03T14:30:00Z') });
type _MomentField = Expect<Equal<ReturnType<typeof momentForm.appointment>, Moment | null>>;

profile.set({ name: 'Daniel', age: 43, address: { city: 'Bern' } });
profile.patch({ address: { city: 'Geneva' } });
profile.update((value) => ({ ...value, age: value.age + 1 }));
profile.reset();
profile.reset({ name: null, age: 42, address: { city: null } });
profile.focus({ preventScroll: true });
profile.disable('Profile is locked');

form({ name: field('David') }, { disabled: 'Managed externally' });
form({ name: field('David') }, { disabled: () => 'Managed externally' });

const submittedProfile = form({
  name: field.strict('Marco'),
  age: field.strict(42),
}, {
  onSubmit: (value, formNode) => {
    type _SubmittedForm = Expect<Equal<ReturnType<typeof formNode>, { name: string; age: number }>>;
    type _SubmittedValue = Expect<Equal<typeof value, { name: string; age: number }>>;
    return Promise.resolve();
  },
  onSubmitBlocked(formNode) {
    type _BlockedForm = Expect<Equal<ReturnType<typeof formNode>, { name: string; age: number }>>;
    formNode.name.set('Retry');
  },
  submitWhen: 'valid',
});

// @ts-expect-error submission policies must be a supported validation gate
form({ name: field('Marco') }, { submitWhen: 'sometimes' });

type _SubmittingSignal = Expect<Equal<ReturnType<typeof submittedProfile.submitting>, boolean>>;
type _SubmitResult = Expect<Equal<ReturnType<typeof submittedProfile.submit>, Promise<boolean>>>;
type _FormNodeType = Expect<Equal<ReturnType<typeof submittedProfile.nodeType>, 'form'>>;
type _FieldNodeType = Expect<Equal<ReturnType<typeof submittedProfile.name.nodeType>, 'field'>>;

// @ts-expect-error set requires every form property
profile.set({ name: 'Daniel', age: 43 });
// @ts-expect-error patch cannot contain unknown properties
profile.patch({ unknown: true });
// @ts-expect-error nested field value has the wrong type
profile.patch({ address: { city: 42 } });
const apiCollision = form({ api: field('child api') });
type _ApiCollision = Expect<Equal<ReturnType<typeof apiCollision.api>, string | null>>;
type _ApiCollisionEscapeHatch = Expect<Equal<ReturnType<typeof apiCollision.$api.value>, { api: string | null }>>;

// @ts-expect-error $api is the reserved form API escape hatch
form({ $api: field('reserved') });
// @ts-expect-error $api is reserved at every nested form level
form({ nested: { $api: field('reserved') } });

const collisions = form({
  readonly: field(false),
  reset: field('child'),
  name: field('name'),
  apply: field('apply'),
  focus: field('focus'),
  root: field('root'),
});

type _ReadonlyCollision = Expect<Equal<ReturnType<typeof collisions.readonly>, boolean | null>>;
type _ResetCollision = Expect<Equal<ReturnType<typeof collisions.reset>, string | null>>;
type _NameCollision = Expect<Equal<ReturnType<typeof collisions.name>, string | null>>;
type _ApplyCollision = Expect<Equal<ReturnType<typeof collisions.apply>, string | null>>;
type _FocusCollision = Expect<Equal<ReturnType<typeof collisions.focus>, string | null>>;
type _RootCollision = Expect<Equal<ReturnType<typeof collisions.root>, string | null>>;
type _ApiReadonlyUnaffected = Expect<Equal<ReturnType<typeof collisions.api.readonly>, boolean>>;
type _ApiRootUnaffected = Expect<Equal<ReturnType<typeof collisions.api.root>, typeof collisions>>;

// @ts-expect-error children is a readonly map
profile.children.name = field('Replacement');

const dynamicAge = profile.add('dynamicAge', field(23));
type _DynamicGet = Expect<Equal<ReturnType<typeof profile.get>, DynamicNode | undefined>>;
type _ExactAddedNode = Expect<Equal<ReturnType<typeof dynamicAge>, number | null>>;
// @ts-expect-error dynamically added children are not direct properties
profile.dynamicAge;
// @ts-expect-error undeclared child names must not compile
profile.mistypedPropertyName;
