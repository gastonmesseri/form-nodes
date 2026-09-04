import { array, asyncValidator, between, configureGlobalValidatorMessages, dateBetween, email, equalTo, field, form, integer, maxDate, maxLength, maxWords, min, minDate, minLength, minWords, oneOf, pattern, provideValidatorMessages, required, uniqueItems, url, validator, type AsyncValidatorContext, type BuiltInValidationError, type ValidationErrorMap, type ValidatorContext, type ValidatorMessages, type ValidatorOptions } from '../../src/public-api';
import type { Equal, Expect, HasKey } from './assert.types';

type IsAny<TValue> = 0 extends (1 & TValue) ? true : false;
type _NoExampleCustomError = Expect<Equal<HasKey<ValidationErrorMap, 'unavailableUsername'>, false>>;

const nameValidator = (context: ValidatorContext<string | null>) => {
  type _Value = Expect<Equal<ReturnType<typeof context.value>, string | null>>;
  type _ApiValue = Expect<Equal<ReturnType<typeof context.api.value>, string | null>>;
  type _Path = Expect<Equal<ReturnType<typeof context.path>, readonly string[]>>;
  return context.value() ? null : { kind: 'missingName' };
};

const name = field('David', [required, nameValidator]);
type _OpaqueAngularNameField = Expect<IsAny<typeof name.$field>>;
name.setValidators(nameValidator);
name.setValidators([required, null, nameValidator]);
field('', [required({}), email({ message: 'Invalid email' }), maxLength(30, { message: 'Too long' })]);
field('', [required('Required'), email('Invalid email'), url('Invalid URL')]);
field(1.5, [integer('Enter a whole number')]);
field(18, [min(18, { message: 'Too young' })]);
field(18, [min(21, 'Too young'), between(21, 65, 'Unsupported age')]);
field(18, [between(18, 65, { message: 'Unsupported age' })]);
field(18, [between(() => 18, () => 65)]);
field('', [pattern(/^[a-z]+$/, { message: () => 'Use letters only' })]);
field('', [pattern(/^[a-z]+$/, 'Use letters only'), minLength(3, 'Too short'), maxLength(30, 'Too long')]);
field('', [url, url({ message: 'Enter an absolute URL' })]);
field(1, [integer, integer({ message: 'Enter a whole number' })]);
field('confirmed', [equalTo('confirmed'), equalTo(() => 'confirmed')]);
field('confirmed', [equalTo('pending', 'Values must match')]);
field<'draft' | 'published'>('draft', [oneOf(['draft', 'published'])]);
field(2, [oneOf(() => [1, 2, 3])]);
field('', [minWords(2), maxWords(() => 100)]);
field('', [minWords(2, 'Too few words'), maxWords(100, 'Too many words')]);
field<Date>(null, [minDate('2026-08-24'), maxDate(() => '2026-12-31', { parseAs: 'local' })]);
field<Date>(null, [minDate('2026-08-24', 'Too early'), maxDate('2026-12-31', 'Too late')]);
field<Date>(null, [dateBetween('2026-01-01', () => '2026-12-31', { parseAs: 'local', message: 'Outside range' })]);
field<Date>(null, [dateBetween('2026-01-01', '2026-12-31', 'Outside range')]);
field<Date>(null, [minDate('today'), maxDate(() => 'today')]);
field<Date>(null, [dateBetween('today', () => '2026-12-31')]);

const angularProfile = form({ name: field('David'), age: field(30) });
type _OpaqueAngularProfileField = Expect<IsAny<typeof angularProfile.$field>>;

const adult = validator<number | null>(({ value, api, field: targetField }) => {
  type _Value = Expect<Equal<ReturnType<typeof value>, number | null>>;
  type _ApiValue = Expect<Equal<ReturnType<typeof api.value>, number | null>>;
  void targetField;
  return value() !== null && value()! < 18
    ? { kind: 'adult', minimumAge: 18, actual: value() }
    : null;
});
field<number>(null, [adult]);

const positive = validator<number>(({ value }) => {
  type _Value = Expect<Equal<ReturnType<typeof value>, number>>;
  return value() > 0 ? null : { kind: 'positive' };
});
field.strict(1, [positive]);

const completeProfile = validator<{ name: string | null; age: number | null }>(({ value }) => {
  type _Profile = Expect<Equal<ReturnType<typeof value>, { name: string | null; age: number | null }>>;
  return value().name === null ? { kind: 'incompleteProfile' } : null;
});
form({ name: field('David'), age: field(42) }, [completeProfile]);

const confirmation = field('different');
form({ password: field('secret'), confirmation }, {
  validators: ({ value }) => value().password === value().confirmation
    ? null
    : { kind: 'passwordMismatch', targetNode: confirmation },
});
// @ts-expect-error A validator target must be a Gem Forms node.
field('', [() => ({ kind: 'invalidTarget', targetNode: 'name' })]);
// @ts-expect-error formNode is reserved for errors produced by concrete control bindings.
field('', [() => ({ kind: 'invalidBindingOwner', formNode: {} })]);

const atLeastOneItem = validator<readonly (string | null)[]>(({ value }) => {
  return value().length > 0 ? null : { kind: 'emptyArray' };
});
array(field(''), [], [atLeastOneItem]);
array(field(''), ['one', 'two'], [uniqueItems()]);
array(field(''), ['one', 'two'], [uniqueItems]);
field<readonly string[]>(null, [uniqueItems()]);
field<readonly string[] | undefined>(undefined, [uniqueItems()]);
array({ id: field(1), name: field('') }, [{ id: 1, name: 'One' }], [uniqueItems('id')]);
array({ id: field(1), name: field('') }, [{ id: 1, name: 'One' }], [uniqueItems('id', 'IDs must be unique')]);
array({ id: field(1), name: field('') }, [{ id: 1, name: 'One' }], [
  uniqueItems<{ id: number | null; name: string | null }>(item => item.id),
]);

const validatorOptions: ValidatorOptions = { message: 'Invalid value' };
validatorOptions.message = () => 'Updated invalid value';
const reactiveValidatorOptions: ValidatorOptions = { message: () => undefined };
const validatorMessages: ValidatorMessages = {
  min: ({ min: minimum, actual }) => {
    type _Minimum = Expect<Equal<typeof minimum, number>>;
    type _Actual = Expect<Equal<typeof actual, number>>;
    return `${actual}/${minimum}`;
  },
  required: () => 'Required',
};
validatorMessages.required = 'Required';
const restoreValidatorMessages = configureGlobalValidatorMessages(() => validatorMessages);
const validatorMessageProviders = provideValidatorMessages(() => validatorMessages);
const builtInError: BuiltInValidationError = { kind: 'min', min: 2, actual: 1 };
void [validatorOptions, reactiveValidatorOptions, restoreValidatorMessages, validatorMessageProviders, builtInError];

const constrainedAge = field(16, [min(18)]);
const minimumError = constrainedAge.getError('min');
const _minimum: number | undefined = minimumError?.min;
const _minimumActual: number | undefined = minimumError?.actual;
const unknownError = constrainedAge.getError('applicationSpecific');
const _unknownMessage: string | undefined = unknownError?.message;
const _unknownProperty: unknown = unknownError?.applicationData;
void [_minimum, _minimumActual, _unknownMessage, _unknownProperty];

const integerError = field(1.5, [integer]).getError('integer');
const _integerActual: number | undefined = integerError?.actual;
void _integerActual;

const betweenError = field(70, [between(18, 65)]).getError('between');
const _betweenBounds: [number | undefined, number | undefined] = [betweenError?.min, betweenError?.max];
void _betweenBounds;

const dateBetweenError = field<Date>(new Date(), [dateBetween('2026-01-01', '2026-12-31')]).getError('dateBetween');
const _dateBetweenBounds: [Date | undefined, Date | undefined] = [dateBetweenError?.minDate, dateBetweenError?.maxDate];
void _dateBetweenBounds;

const uniqueError = array(field(''), ['same', 'same'], [uniqueItems()]).getError('uniqueItems');
const _duplicateIndexes: readonly number[] | undefined = uniqueError?.duplicateIndexes;
void _duplicateIndexes;

const profile = form({
  name,
  age: field(42, {
    validators: [context => {
      const _value: number | null = context.value();
      const _fieldValue: number | null = context.api.value();
      void [_value, _fieldValue];
      return null;
    }],
  }),
}, {
  validatorMessages: {
    min: ({ min: minimum }) => `Minimum: ${minimum}`,
  },
});

const reactiveAsync = asyncValidator<string | null>((context: AsyncValidatorContext<string | null>) => {
  type _Value = Expect<Equal<ReturnType<typeof context.value>, string | null>>;
  type _AbortSignal = Expect<Equal<typeof context.abortSignal, AbortSignal>>;
  return Promise.resolve(context.value() === 'blocked' ? { kind: 'blocked' } : null);
});

const parameterizedAsync = asyncValidator<string | null, { username: string | null }>({
  params: ({ value }) => ({ username: value() }),
  validate: ({ params, value, abortSignal }) => {
    type _Params = Expect<Equal<typeof params, { username: string | null }>>;
    type _Value = Expect<Equal<ReturnType<typeof value>, string | null>>;
    type _AbortSignal = Expect<Equal<typeof abortSignal, AbortSignal>>;
    return Promise.resolve(null);
  },
});

name.setValidators([reactiveAsync, parameterizedAsync]);
void profile;

// @ts-expect-error a string validator cannot be assigned to a number field
field(42, [nameValidator]);

// @ts-expect-error numeric allowed values cannot validate a string field
field('draft', [oneOf([1, 2])]);

// @ts-expect-error equality validators preserve the expected value type
field(1, [equalTo('1')]);

// @ts-expect-error word-count validators require string values
field(42, [minWords(2)]);

// @ts-expect-error between validators require numeric values
field('42', [between(1, 100)]);

// @ts-expect-error uniqueItems validators require array values
field('', [uniqueItems]);

// @ts-expect-error date strings only support explicit UTC or local parsing
minDate('2026-08-24', { parseAs: 'browser' });

// @ts-expect-error dateBetween strings only support explicit UTC or local parsing
dateBetween('2026-01-01', '2026-12-31', { parseAs: 'browser' });

// @ts-expect-error pattern options expose only the static or reactive message
pattern(/^[a-z]+$/, { debounce: 300 });

// @ts-expect-error synchronous validators must return a supported validation result
validator<string>(() => 'invalid');

// @ts-expect-error a non-nullable validator cannot observe a field that is nullable by default
field(1, [positive]);
