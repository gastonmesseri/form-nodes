import { array, field, form, required, type ArrayOptions, type FieldOptions, type FormOptions, type FormSubmissionOptions, type FormValueContract, type GroupOptions, type MarkAsTouchedOptions } from '../../src/public-api';

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

type ContractFormValue = {
  username: string | null;
  items: (string | null)[];
};
const contractForm = form({
  username: field(''),
  items: array(field('')),
}) satisfies FormValueContract<ContractFormValue>;
type _ContractFormValue = Expect<Equal<ReturnType<typeof contractForm>, ContractFormValue>>;
type _ContractFormArrayNode = Expect<Equal<ReturnType<typeof contractForm.items.nodeType>, 'array'>>;
contractForm.items.push('Angular');

// @ts-expect-error the inferred username value is incompatible with the contract
form({ username: field(0), items: array(field('')) }) satisfies FormValueContract<ContractFormValue>;

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

const fieldOptions: FieldOptions<string | null> = {};
fieldOptions.disabled = () => 'Temporarily unavailable';
fieldOptions.validators = [required];

const formOptions: FormOptions<{ name: string | null }> = {};
formOptions.debounce = 'blur';
formOptions.hidden = () => false;

const groupOptions: GroupOptions<{ name: string | null }> = {};
groupOptions.readonly = true;

const arrayOptions: ArrayOptions<readonly { id: number }[]> = {};
arrayOptions.initialValue = [{ id: 1 }];
arrayOptions.trackBy = 'id';

const submissionOptions: FormSubmissionOptions<{ name: string | null }> = {
  action: () => undefined,
};
submissionOptions.ignoreValidators = 'pending';

const touchedOptions: MarkAsTouchedOptions = {};
touchedOptions.skipDescendants = true;
formWithOptions.markAsTouched({ skipDescendants: true });

void [fieldOptions, formOptions, groupOptions, arrayOptions, submissionOptions, touchedOptions];

// @ts-expect-error field options cannot be passed as a fourth argument
field('David', [required], { readonly: true }, { hidden: true });
// @ts-expect-error form options cannot be passed as a fourth argument
form({ name: field('') }, [required], { readonly: true }, { hidden: true });
// @ts-expect-error array options cannot precede its initial value
array(field(''), { readonly: true }, ['David']);
