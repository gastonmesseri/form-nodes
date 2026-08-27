import { array, field, form, required } from '../src/public-api';

import type { Equal, Expect } from './assert.types';

const fieldWithShorthand = field('David', [required, null]);
const fieldWithOptions = field('David', { validators: [required], readonly: true });
const fieldWithSeparateOptions = field('David', [required], { nullable: false, hidden: true });

type _ShorthandField = Expect<Equal<ReturnType<typeof fieldWithShorthand>, string | null>>;
type _OptionsField = Expect<Equal<ReturnType<typeof fieldWithOptions>, string | null>>;
type _SeparateOptionsField = Expect<Equal<ReturnType<typeof fieldWithSeparateOptions>, string>>;

const formWithShorthand = form({ name: field('') }, [required]);
const formWithOptions = form({ name: field('') }, { validators: [required], disabled: true });
const formWithSeparateOptions = form({ name: field('') }, [required], { readonly: true });

type ExpectedFormValue = { name: string | null };
type _ShorthandForm = Expect<Equal<ReturnType<typeof formWithShorthand>, ExpectedFormValue>>;
type _OptionsForm = Expect<Equal<ReturnType<typeof formWithOptions>, ExpectedFormValue>>;
type _SeparateOptionsForm = Expect<Equal<ReturnType<typeof formWithSeparateOptions>, ExpectedFormValue>>;

const arrayWithDefaultValue = array(field(''));
const arrayWithValidatorShorthand = array(field(''), [required, null]);
const arrayWithInitialValue = array(field(''), ['David']);
const arrayWithOptions = array(field(''), ['David'], { readonly: true });
const arrayWithValidatorsAndOptions = array(field(''), ['David'], [required], { hidden: true });
const arrayWithFactory = array(() => ({ name: field('') }), [{ name: 'David' }]);

type _DefaultArray = Expect<Equal<ReturnType<typeof arrayWithDefaultValue>, (string | null)[]>>;
type _ValidatorArray = Expect<Equal<ReturnType<typeof arrayWithValidatorShorthand>, (string | null)[]>>;
type _InitialArray = Expect<Equal<ReturnType<typeof arrayWithInitialValue>, (string | null)[]>>;
type _OptionsArray = Expect<Equal<ReturnType<typeof arrayWithOptions>, (string | null)[]>>;
type _ValidatorsAndOptionsArray = Expect<Equal<ReturnType<typeof arrayWithValidatorsAndOptions>, (string | null)[]>>;
type _FactoryArray = Expect<Equal<ReturnType<typeof arrayWithFactory>, { name: string | null }[]>>;

// @ts-expect-error field options cannot be passed as a fourth argument
field('David', [required], { readonly: true }, { hidden: true });
// @ts-expect-error form options cannot be passed as a fourth argument
form({ name: field('') }, [required], { readonly: true }, { hidden: true });
// @ts-expect-error array options cannot precede its initial value
array(field(''), { readonly: true }, ['David']);
