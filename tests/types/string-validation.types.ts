import { signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { asyncValidator, field, form, validator, type ValidationError, type ValidationResult } from '../../src/public-api';

const messages: ValidationResult = ['First', { kind: 'specific' }, ''];
const rule = validator<string | null>(({ value }) => value() ? null : 'Enter a name');
const mixed = validator<string | null>(({ value }) => value() ? messages : '');
const asynchronous = asyncValidator<string | null>(async ({ value }) => value() ? messages : '', {
  onError: () => 'Try again',
});
const parameterized = asyncValidator<string | null, string>({
  params: ({ value }) => value() ?? '',
  validate: async ({ params }) => params ? messages : '',
});

class MessageForm {
  message = signal('Choose another name');

  myForm = form({
    name: field('', [rule, mixed, asynchronous, parameterized]),
    confirm: field('', ({ value }) => value() ? null : 'Confirm the name'),
    dependent: field('', () => this.myForm.name() ? null : this.message()),
    configured: field('', { validators: ({ value }) => value() ? messages : '' }),
  }, {
    validators: ({ value }) => value().name ? null : 'Review the form',
  });
}

const model = new MessageForm();
type _Value = Expect<Equal<ReturnType<typeof model.myForm.name>, string | null>>;
type _Errors = Expect<Equal<ReturnType<typeof model.myForm.name.errors>[number], ValidationError.WithTargetNode<typeof model.myForm.name>>>;

// @ts-expect-error Public errors remain objects, even when validators return messages.
const invalidError: ValidationError = 'Message';
void invalidError;
