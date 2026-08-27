import { array, asyncValidator, configureGlobalValidatorMessages, email, field, form, maxDate, maxLength, maxWords, min, minDate, minWords, oneOf, pattern, provideValidatorMessages, required, validator, type AsyncValidatorContext, type BuiltInValidationError, type ValidationErrorMap, type ValidatorContext, type ValidatorMessages, type ValidatorOptions } from '../src/public-api';

import type { Equal, Expect, HasKey } from './assert.types';

type _NoExampleCustomError = Expect<Equal<HasKey<ValidationErrorMap, 'unavailableUsername'>, false>>;

const nameValidator = (context: ValidatorContext<string | null>) => {
  type _Value = Expect<Equal<ReturnType<typeof context.value>, string | null>>;
  type _ApiValue = Expect<Equal<ReturnType<typeof context.api.value>, string | null>>;
  type _Path = Expect<Equal<ReturnType<typeof context.path>, readonly string[]>>;
  return context.value() ? null : { kind: 'missingName' };
};

const name = field('David', [required, nameValidator]);
name.setValidators(nameValidator);
name.setValidators([required, null, nameValidator]);
field('', [required({}), email({ message: 'Invalid email' }), maxLength(30, { message: 'Too long' })]);
field(18, [min(18, { message: 'Too young' })]);
field('', [pattern(/^[a-z]+$/, { message: () => 'Use letters only' })]);
field<'draft' | 'published'>('draft', [oneOf(['draft', 'published'])]);
field(2, [oneOf(() => [1, 2, 3])]);
field('', [minWords(2), maxWords(() => 100)]);
field<Date>(null, [minDate('2026-08-24'), maxDate(() => '2026-12-31', { parseAs: 'local' })]);

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
field(1, [positive], { nullable: false });

const completeProfile = validator<{ name: string | null; age: number | null }>(({ value }) => {
  type _Profile = Expect<Equal<ReturnType<typeof value>, { name: string | null; age: number | null }>>;
  return value().name === null ? { kind: 'incompleteProfile' } : null;
});
form({ name: field('David'), age: field(42) }, [completeProfile]);

const atLeastOneItem = validator<readonly (string | null)[]>(({ value }) => {
  return value().length > 0 ? null : { kind: 'emptyArray' };
});
array(field(''), [], [atLeastOneItem]);

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

// @ts-expect-error word-count validators require string values
field(42, [minWords(2)]);

// @ts-expect-error date strings only support explicit UTC or local parsing
minDate('2026-08-24', { parseAs: 'browser' });

// @ts-expect-error pattern options expose only the static or reactive message
pattern(/^[a-z]+$/, { debounce: 300 });

// @ts-expect-error synchronous validators must return a supported validation result
validator<string>(() => 'invalid');

// @ts-expect-error a non-nullable validator cannot observe a field that is nullable by default
field(1, [positive]);
