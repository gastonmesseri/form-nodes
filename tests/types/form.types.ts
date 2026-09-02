import { field, form } from '../../src/public-api';

form({ name: field('') }, { debounce: 'blur' });
form({ name: field('') }, { debounce: abortSignal => Promise.resolve(void abortSignal.aborted) });
form({ name: field('') }, { inheritInjector: false });
form({ name: field('') }, { adoptBindingInjector: false });

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
type _ControlValue = Expect<Equal<ReturnType<typeof profile.controlValue>, ProfileValue>>;
type _NestedValue = Expect<Equal<ReturnType<typeof profile.address.city>, string | null>>;
type _ChildParent = Expect<Equal<ReturnType<typeof profile.name.parent>, typeof profile | null>>;
type _NestedRoot = Expect<Equal<ReturnType<typeof profile.address.city.form>, typeof profile | null>>;
type _ChildKeyInParent = Expect<Equal<ReturnType<typeof profile.name.keyInParent>, string>>;
type _NestedKeyInParent = Expect<Equal<ReturnType<typeof profile.address.city.keyInParent>, string>>;

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
  name: field('Marco', { nullable: false }),
  age: field(42, { nullable: false }),
}, {
  submission: {
    action: (formNode, value) => {
      type _SubmittedForm = Expect<Equal<ReturnType<typeof formNode>, { name: string; age: number }>>;
      type _SubmittedValue = Expect<Equal<typeof value, { name: string; age: number }>>;
      return Promise.resolve();
    },
  },
});

type _SubmittingSignal = Expect<Equal<ReturnType<typeof submittedProfile.submitting>, boolean>>;
type _SubmitResult = Expect<Equal<ReturnType<typeof submittedProfile.submit>, Promise<boolean>>>;

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
});

type _ReadonlyCollision = Expect<Equal<ReturnType<typeof collisions.readonly>, boolean | null>>;
type _ResetCollision = Expect<Equal<ReturnType<typeof collisions.reset>, string | null>>;
type _NameCollision = Expect<Equal<ReturnType<typeof collisions.name>, string | null>>;
type _ApplyCollision = Expect<Equal<ReturnType<typeof collisions.apply>, string | null>>;
type _FocusCollision = Expect<Equal<ReturnType<typeof collisions.focus>, string | null>>;
type _ApiReadonlyUnaffected = Expect<Equal<ReturnType<typeof collisions.api.readonly>, boolean>>;

// @ts-expect-error children is a readonly map
profile.children.name = field('Replacement');
