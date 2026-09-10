import type { InputSignal, Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { FormNodeErrors, useFormNodeState, type ClosestFormState, type ControlStateError, type FormNodeErrorsContext } from '../../src/public-api';

const state = useFormNodeState<string>();
type _FormState = Expect<Equal<typeof state.form, ClosestFormState>>;
const submitted: Signal<boolean> = state.formSubmitted;
type _FormSubmitted = Expect<Equal<typeof state.formSubmitted, Signal<boolean>>>;
const source: Signal<'formNode' | 'formGroup' | 'ngForm' | null> = state.form.source;
const form = state.form.formNode();
const result: Promise<boolean> | undefined = form?.submit();
const animation: Signal<boolean> = null! as FormNodeErrors['animate'];
const messages: InputSignal<number> = null! as FormNodeErrors['maxMessages'];
const resolver: ((error: ControlStateError) => string | null | undefined) | undefined = (null! as FormNodeErrors['message'])();
// @ts-expect-error form submission state is readonly
state.form.submitted.set(true);
// @ts-expect-error the submission shortcut is readonly
state.formSubmitted.set(true);
// @ts-expect-error animation accepts a boolean
const invalidAnimation: ReturnType<FormNodeErrors['animate']> = 'false';
void [submitted, source, result, animation, messages, resolver, invalidAnimation];

const context: FormNodeErrorsContext = {
  $implicit: 'Message', message: 'Message', messages: ['Message'], errors: [{ kind: 'required' }],
};
type _Message = Expect<Equal<typeof context.$implicit, string>>;
type _Messages = Expect<Equal<typeof context.messages, readonly string[]>>;
// @ts-expect-error template messages are read-only
context.messages.push('Another');
void context;
