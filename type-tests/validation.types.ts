import { asyncValidator, email, field, form, maxLength, maxWords, min, minWords, oneOf, required, type AsyncValidatorContext, type BuiltInValidationError, type ValidationErrorMap, type ValidatorContext, type ValidatorOptions } from '../src/public-api';

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
field<'draft' | 'published'>('draft', [oneOf(['draft', 'published'])]);
field(2, [oneOf(() => [1, 2, 3])]);
field('', [minWords(2), maxWords(() => 100)]);

const validatorOptions: ValidatorOptions = { message: 'Invalid value' };
const builtInError: BuiltInValidationError = { kind: 'min', min: 2, actual: 1 };
void [validatorOptions, builtInError];

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
