import { FormArray, FormControl, FormGroup } from '@angular/forms';

import type { Equal, Expect } from './assert.types';
import { array, createFormPrimitives, field, form, group } from '../../src/public-api';

const control = new FormControl('');
const angularGroup = new FormGroup({ search: control });
const angularArray = new FormArray([new FormControl('')]);

// @ts-expect-error Angular controls are not node definitions
form({ search: control });
// @ts-expect-error Angular groups are not node definitions
form({ search: angularGroup });
// @ts-expect-error Angular arrays are not node definitions
form({ search: angularArray });
// @ts-expect-error the same restriction applies to nested shorthand groups
form({ filters: { search: control } });
// @ts-expect-error explicit groups reject control definitions too
group({ search: control });
// @ts-expect-error array object templates reject control definitions
array({ search: control });
// @ts-expect-error array factories reject control definitions
array(() => ({ search: control }));

const dynamic = form({});
// @ts-expect-error dynamically added children use the same definition contract
dynamic.add('search', control);
// @ts-expect-error batch additions validate nested definitions
dynamic.add({ filters: { search: control } });

const configured = createFormPrimitives({ nullable: true });
// @ts-expect-error configured forms reject control definitions
configured.form({ search: control });
// @ts-expect-error configured groups reject control definitions
configured.group({ search: control });
// @ts-expect-error configured array templates reject control definitions
configured.array({ search: control });
// @ts-expect-error configured array factories reject control definitions
configured.array(() => ({ search: control }));

const configuredDynamic = configured.form({});
// @ts-expect-error configured dynamic additions reject control definitions
configuredDynamic.add('search', control);
// @ts-expect-error configured batch additions reject nested control definitions
configuredDynamic.add({ filters: { search: control } });

const structuralControl = {
  value: undefined,
  status: 123,
  errors: 'different',
  pristine: null,
  touched: [],
  valueChanges: false,
  statusChanges: undefined,
  setValue: 'not a function',
  patchValue: null,
  setErrors: Symbol('errors'),
  markAsTouched: true,
  updateValueAndValidity: 0,
  extra: 'allowed extra member',
};

// @ts-expect-error all required names match regardless of member types or extra members
form({ search: structuralControl });

const callableControl = Object.assign(() => '', structuralControl);
// @ts-expect-error callable values with the complete member set also match the control shape
form({ search: callableControl });

const { updateValueAndValidity, ...partialControl } = structuralControl;
const partial = form({ data: partialControl });
type _PartialData = Expect<Equal<ReturnType<typeof partial.data.status>, number>>;

const optionalControl: Omit<typeof structuralControl, 'updateValueAndValidity'> & { updateValueAndValidity?: number } = partialControl;
form({ data: optionalControl });

const wrapped = form({ search: field(control), controls: [control] });
type _ExplicitValue = Expect<Equal<ReturnType<typeof wrapped.search>, FormControl<string | null>>>;
type _ArrayData = Expect<Equal<ReturnType<typeof wrapped.controls>, FormControl<string | null>[]>>;
const configuredWrapped = configured.form({ search: configured.field(control) });
type _ConfiguredValue = Expect<Equal<ReturnType<typeof configuredWrapped.search>, FormControl<string | null> | null>>;

const rows = array({ search: field(control) });
type _WrappedArrayValue = Expect<Equal<ReturnType<typeof rows>, { search: FormControl<string | null> }[]>>;

class SearchModel {
  value = '';

  status = 'draft';
}

const models = form({ search: new SearchModel(), date: new Date() });
type _ClassValue = Expect<Equal<ReturnType<typeof models.search>, SearchModel>>;
type _DateValue = Expect<Equal<ReturnType<typeof models.date>, Date>>;
