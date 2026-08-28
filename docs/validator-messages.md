# Validator messages and internationalization

This document is the consumer-facing source of truth for configuring built-in validator messages.
It is intended to be reusable when the public documentation website is created.

## Quick start

Every built-in validator supplies an English fallback message, so configuration is optional:

```ts
const name = field('', [required]);

name.getError('required')?.message; // "This field is required."
```

Applications can replace those messages globally, through Angular dependency injection, for one
form tree, or for one validator. All configuration catalogs are partial.

## Precedence

When several layers define the same message, the closest configuration wins:

1. The validator's local `message` option.
2. The closest ancestor form or array `validatorMessages` option.
3. The closest Angular catalog captured from `provideValidatorMessages()`.
4. The process-wide catalog installed by `configureGlobalValidatorMessages()`.
5. The built-in English message.

An absent entry or a message function that returns `undefined` falls through to the next layer.
This permits a form to override only the wording it owns while retaining application defaults for
everything else.

## Global configuration

Use `configureGlobalValidatorMessages()` for a process-wide default, including applications that
create forms outside Angular dependency injection:

```ts
import { configureGlobalValidatorMessages } from '@gem/ng-forms';

const restoreValidatorMessages = configureGlobalValidatorMessages({
  required: 'This value is required.',
  min: ({ min, actual }) => `${actual} must be at least ${min}.`,
});
```

It accepts either a static catalog or a reactive catalog source:

```ts
const locale = signal<'en' | 'es'>('en');

const restoreValidatorMessages = configureGlobalValidatorMessages(() => ({
  required: () => locale() === 'es'
    ? 'Este campo es obligatorio.'
    : 'This field is required.',
}));

locale.set('es'); // Existing failing validation errors update automatically.
```

The function returns a cleanup callback. It restores the preceding configuration when the
installed catalog is still current, which is useful for tests and temporary scopes:

```ts
const restore = configureGlobalValidatorMessages(testMessages);

try {
  // Run code with testMessages.
} finally {
  restore();
}
```

### Server-side rendering

Global configuration is JavaScript module state shared by every request in the same process. It is
safe for one application-wide default that does not change per request. Do not mutate it to select
the locale of an individual SSR request, because concurrent requests could observe each other's
messages. Use an Angular provider or a form-level catalog for request-specific localization.

## Angular application or route configuration

Use `provideValidatorMessages()` to configure messages once in an Angular application, route, or
other environment injector:

```ts
import { ApplicationConfig, inject } from '@angular/core';
import { provideValidatorMessages } from '@gem/ng-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideValidatorMessages(() => {
      const translations = inject(TranslationService);

      return {
        required: () => translations.translate('validation.required'),
        min: ({ min, actual }) => translations.translate('validation.min', {
          actual,
          min,
        }),
      };
    }),
  ],
};
```

The provider factory runs in an Angular injection context, so it can use `inject()`. The catalog is
captured when a node is created in that context. Message functions execute as part of reactive
validation; signals read by the translation service are tracked and update existing errors.

A provider configured in a closer route or environment injector overrides matching entries from an
application provider inherited by nodes in that scope. Entries it does not define continue through
the normal fallback chain.

## Form- and array-level configuration

Use `validatorMessages` when a feature or form tree needs its own terminology without changing the
rest of the application:

```ts
import { field, form, min, required } from '@gem/ng-forms';

const checkout = form({
  customer: {
    name: field('', [required]),
  },
  quantity: field(0, [min(1)]),
}, {
  validatorMessages: () => ({
    required: () => checkoutTranslations().required,
    min: ({ min }) => checkoutTranslations().minimumQuantity(min),
  }),
});
```

The catalog applies to validators owned by the form or array and every descendant. Nested forms and
arrays can define another catalog; the closest ancestor defining a particular message wins. A
descendant catalog remains partial and falls back to more distant form, provider, global, and
built-in catalogs for missing entries.

This option does not require dependency injection and its source can read signals directly.

## Validator-specific messages

Use the validator's `message` option for wording specific to one business rule. Local validator
message functions intentionally take no parameters; they close over the signals or values needed
by that rule:

```ts
const age = field(16, [
  min(18, {
    message: () => locale() === 'es'
      ? 'Debes ser mayor de edad.'
      : 'You must be an adult.',
  }),
]);
```

The local option has the highest priority. Returning `undefined` deliberately delegates to the
form, provider, global, or built-in configuration.

## Catalog keys and parameters

`ValidatorMessages` is strongly typed. IntelliSense exposes the supported keys and the exact
parameters available to each callback:

| Key | Callback parameters |
| --- | --- |
| `required` | none |
| `email` | none |
| `url` | none |
| `equalTo` | none; compared values are intentionally private |
| `min` | `{ min: number, actual: number }` |
| `max` | `{ max: number, actual: number }` |
| `integer` | `{ actual: number }` |
| `minLength` | `{ minLength: number, actual: number }` |
| `maxLength` | `{ maxLength: number, actual: number }` |
| `pattern` | `{ pattern: RegExp, actual: string }` |
| `minDate` | `{ minDate: Date, actual: Date }` |
| `maxDate` | `{ maxDate: Date, actual: Date }` |
| `oneOf` | `{ options: readonly unknown[], actual: unknown }` |
| `minWords` | `{ minWords: number, actual: number }` |
| `maxWords` | `{ maxWords: number, actual: number }` |

The callback receives the resolved constraint, not its original signal or source function. For
example, a reactive `min(() => minimumAge())` supplies the current numeric `min` value.

## Reactivity model

A catalog source and its selected message function are evaluated only while the corresponding
built-in validator is failing. Signals read during that evaluation become validation dependencies.
Changing one of those signals updates the exposed error message without recreating the form.

```ts
const locale = signal<'en' | 'es'>('en');
const messages = computed(() => locale() === 'es' ? spanishMessages : englishMessages);

configureGlobalValidatorMessages(() => messages());
```

This behavior works inside and outside Angular dependency injection. Only built-in validators use
these catalogs; a custom validator controls the complete errors and messages it returns.

## Recommended application structure

For most Angular applications:

1. Keep the built-in English messages as the final safety fallback.
2. Register the application's translated defaults once with `provideValidatorMessages()`.
3. Use form-level catalogs for feature-specific vocabulary or independently distributed forms.
4. Use local validator messages only for business rules whose wording is unique to that field.
5. Use global configuration primarily outside Angular, in tests, or for one immutable process-wide
   default.

This arrangement keeps ordinary form declarations concise while preserving local overrides and
reactive locale changes.
