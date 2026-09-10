import '@angular/compiler';
import { expect, it } from 'vitest';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';

import { field } from '../primitives/field';
import { required } from '../validation/validators/required';
import { FormNodeErrors } from './form-node-errors.component';
import { registerErrorTemplateQueryForJit } from '../../../tests/helpers/register-error-template-query-for-jit';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerErrorTemplateQueryForJit();

registerSignalInputForJit(FormNodeErrors, 'node', 'node');
registerSignalInputForJit(FormNodeErrors, 'showWhen', 'showWhen');

it('server-renders visible error text without browser animation APIs', async () => {
  @Component({
    selector: 'app-root',
    template: `<form-node-errors id="email-errors" [node]="email" showWhen="always" />`,
    imports: [FormNodeErrors],
  })
  class App {
    email = field('', [required]);
  }
  const html = await renderApplication(
    context => bootstrapApplication(App, { providers: [provideServerRendering()] }, context),
    { document: '<app-root></app-root>', url: '/' },
  );
  expect(html).toContain('This field is required.');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('id="email-errors"');
});

it('server-renders a custom message template and its context', async () => {
  @Component({
    selector: 'app-root',
    template: `<form-node-errors [node]="email" showWhen="always"><ng-template #message let-text let-errors="errors"><strong [attr.data-kind]="errors[0].kind">{{ text }}</strong></ng-template></form-node-errors>`,
    imports: [FormNodeErrors],
  })
  class App {
    email = field('', [required]);
  }
  const html = await renderApplication(
    context => bootstrapApplication(App, { providers: [provideServerRendering()] }, context),
    { document: '<app-root></app-root>', url: '/' },
  );
  expect(html).toContain('data-kind="required"');
  expect(html).toContain('This field is required.');
});
