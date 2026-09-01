---
title: Validator messages and i18n
---

# Validator messages and i18n

Built-in validators include English fallback messages. Applications can override them globally, through Angular dependency injection, for one form tree, or for one validator.

For all node and binding options—not only messages—see the
[Configuration reference](../reference/configuration.md).

## Precedence

The closest definition wins:

1. Validator-local `message` option.
2. Closest form or array `validatorMessages` catalog.
3. Closest Angular `provideValidatorMessages()` catalog.
4. Process-wide `configureGlobalValidatorMessages()` catalog.
5. Built-in English message.

Missing entries and message functions returning `undefined` continue through the fallback chain.

## Angular application configuration

Configure translated defaults once in an application, route, or environment injector:

```ts
import { ApplicationConfig, inject } from '@angular/core';
import { provideValidatorMessages } from '@gem/ng-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideValidatorMessages(() => {
      const translations = inject(TranslationService);

      return {
        required: () => translations.translate('validation.required'),
        min: ({ min, actual }) => translations.translate('validation.min', { min, actual }),
      };
    }),
  ],
};
```

Provider factories may call `inject()`. A closer route or environment injector supplies the
complete catalog captured in that scope; Angular does not merge it with an outer provider catalog.
Missing entries continue through any different catalog captured by an ancestor node, followed by
the global and built-in fallbacks.

## Global configuration

Use process-wide configuration outside Angular or for one immutable application default:

```ts
const restore = configureGlobalValidatorMessages({
  required: 'This value is required.',
  min: ({ min, actual }) => `${actual} must be at least ${min}.`,
});

// Restore the previous catalog when a temporary scope ends.
restore();
```

Global configuration is shared module state. Do not mutate it per request during SSR; use an Angular provider or form catalog for request-specific locales.

## Form-tree configuration

```ts
const checkout = form({
  quantity: field(0, [min(1)]),
}, {
  validatorMessages: () => ({
    min: ({ min }) => checkoutTranslations().minimumQuantity(min),
  }),
});
```

The catalog applies to that form or array and all descendants. A nested catalog overrides only the keys it defines.

## Validator-local messages

```ts
const myForm = form({
  age: field(16, [
    min(18, {
      message: () => locale() === 'es'
        ? 'Debes ser mayor de edad.'
        : 'You must be an adult.',
    }),
  ]),
});
```

Local message functions close over their dependencies and take no parameters. Catalog callbacks receive strongly typed constraint data; IntelliSense exposes the available keys and parameters.

| Catalog key | Callback parameters |
| --- | --- |
| `required`, `email`, `url`, `equalTo` | None |
| `min` / `max` | Constraint and actual number |
| `between` | Minimum, maximum, and actual number |
| `integer` | Actual number |
| `minLength` / `maxLength` | Constraint and actual length |
| `minWords` / `maxWords` | Constraint and actual word count |
| `pattern` | Pattern and actual string |
| `minDate` / `maxDate` | Constraint and actual `Date` |
| `dateBetween` | Minimum, maximum, and actual `Date` |
| `oneOf` | Allowed options and actual value |
| `uniqueItems` | Duplicate indexes |

## Reactive locale changes

Catalog sources and the selected message function run reactively while the validator is failing:

```ts
const locale = signal<'en' | 'es'>('en');

configureGlobalValidatorMessages(() => ({
  required: () => locale() === 'es'
    ? 'Este campo es obligatorio.'
    : 'This field is required.',
}));
```

Changing `locale` updates existing failing errors without recreating the form. This works inside and outside Angular dependency injection.
