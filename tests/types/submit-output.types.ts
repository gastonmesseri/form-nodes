import type { OutputRef } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { field, form, type FormNodeBinding, type FormNodeSubmitEvent } from '../../src/public-api';

const profile = form({ name: field.strict('Ada') });
declare const binding: FormNodeBinding<typeof profile>;
type _Attempt = Expect<Equal<typeof binding.formNodeSubmit, OutputRef<FormNodeSubmitEvent<typeof profile>>>>;
type _Blocked = Expect<Equal<typeof binding.formNodeSubmitBlocked, OutputRef<FormNodeSubmitEvent<typeof profile>>>>;
binding.formNodeSubmit.subscribe(event => {
  event.value.name.toUpperCase();
  event.form.$api.submitted();
  event.event.preventDefault();
  // @ts-expect-error the payload preserves the declared value type
  event.value.name.toFixed();
});
