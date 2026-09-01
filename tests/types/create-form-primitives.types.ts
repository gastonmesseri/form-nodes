import type { Equal, Expect } from './assert.types';
import { createFormPrimitives, field, type Field, type FormPrimitives } from '../../src/public-api';

const nonNullableForms = createFormPrimitives({ nullable: false });
const nullableForms = createFormPrimitives({ nullable: true });
const defaultForms = createFormPrimitives();
const emptyOptionsForms = createFormPrimitives({});

const name = nonNullableForms.field('Marco');
const nullableName = nonNullableForms.field('Marco', { nullable: true });
const explicitName = nonNullableForms.field('Marco', { nullable: false });
const emptyName = nonNullableForms.field<string>(null, { nullable: true });
const modelNullableName = nonNullableForms.field<string | null>(null);
const validatedName = nonNullableForms.field('', ({ value }) => value().length > 0 ? null : { kind: 'required' });
const forcedNullableName = nonNullableForms.field.nullable('Marco');
const forcedNonNullableName = nullableForms.field.strict('Marco');

type _Name = Expect<Equal<typeof name, Field<string>>>;
type _NullableName = Expect<Equal<typeof nullableName, Field<string | null>>>;
type _ExplicitName = Expect<Equal<typeof explicitName, Field<string>>>;
type _EmptyName = Expect<Equal<typeof emptyName, Field<string | null>>>;
type _ModelNullableName = Expect<Equal<typeof modelNullableName, Field<string | null>>>;
type _ValidatedName = Expect<Equal<typeof validatedName, Field<string>>>;
type _ForcedNullableName = Expect<Equal<typeof forcedNullableName, Field<string | null>>>;
type _ForcedNonNullableName = Expect<Equal<typeof forcedNonNullableName, Field<string>>>;

const profile = nonNullableForms.form({
  name: '',
  address: {
    city: '',
  },
});

type _ProfileValue = Expect<Equal<ReturnType<typeof profile>, {
  name: string;
  address: { city: string };
}>>;

const added = profile.add({ nickname: '' });
type _AddedValue = Expect<Equal<ReturnType<typeof added.nickname>, string>>;

const people = nonNullableForms.array({ name: '' }, {
  initialValue: [{ name: 'Marco' }],
});
type _PeopleValue = Expect<Equal<ReturnType<typeof people>, { name: string }[]>>;

const factoryPeople = nonNullableForms.array(() => ({ name: '' }), 1);
type _FactoryPeopleValue = Expect<Equal<ReturnType<typeof factoryPeople>, { name: string }[]>>;

const nullableProfile = nullableForms.form({ name: '' });
type _NullableProfileValue = Expect<Equal<ReturnType<typeof nullableProfile>, { name: string | null }>>;

const defaultNullableProfile = defaultForms.form({ name: '' });
const emptyOptionsNullableProfile = emptyOptionsForms.form({ name: '' });
type _DefaultNullableProfileValue = Expect<Equal<ReturnType<typeof defaultNullableProfile>, { name: string | null }>>;
type _EmptyOptionsNullableProfileValue = Expect<Equal<ReturnType<typeof emptyOptionsNullableProfile>, { name: string | null }>>;

const defaultProfile = nullableForms.form({ name: field('', { nullable: false }) });
type _ExplicitNodeWins = Expect<Equal<ReturnType<typeof defaultProfile>, { name: string }>>;

const configuredForms: FormPrimitives<false> = nonNullableForms;
const runtimeDefault: boolean = Math.random() > 0.5;
const runtimeConfiguredForms = createFormPrimitives({ nullable: runtimeDefault });
runtimeConfiguredForms.field('');
void configuredForms;

// @ts-expect-error a non-nullable configured field cannot receive null
name.set(null);
// @ts-expect-error a non-nullable configured field requires a non-null initial value
nonNullableForms.field<string>();
