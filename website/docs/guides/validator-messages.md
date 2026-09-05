---
title: Validator messages and i18n
---

# Validator messages and i18n

Built-in validators include English fallback messages. Applications can override them through a
configured primitive set, Angular dependency injection, one form tree, one validator, or a global
fallback.

For all node and binding options—not only messages—see the
[Configuration reference](../reference/configuration.md).

## Where to configure messages

| Intended scope | API and recommended location |
| --- | --- |
| Standalone Angular application | `provideValidatorMessages()` in `app.config.ts`, passed to `bootstrapApplication` |
| NgModule application | `provideValidatorMessages()` in `AppModule.providers` |
| Shared process-wide fallback, including nodes outside DI | `configureGlobalValidatorMessages()` in `main.ts`, before bootstrapping |
| Larger message catalog | Export the data from a separate file and import it at the chosen configuration point |

Prefer the Angular provider for application configuration, particularly when messages depend on
injected translations or an SSR request. Use the global setter when a shared fallback is intended.
Do not repeat global setup in component constructors or lifecycle hooks. A static catalog needs no
application initializer or side-effect-only import.

See the complete [global startup example](../reference/configure-global-validator-messages.md#where-to-call-it)
and [application provider example](../reference/provide-validator-messages.md#example).

## Precedence

The closest definition wins:

1. Validator-local `message` option.
2. Closest form or array `validatorMessages` catalog.
3. Closest `createFormPrimitives()` validator-message default.
4. Closest Angular `provideValidatorMessages()` catalog.
5. Process-wide `configureGlobalValidatorMessages()` catalog.
6. Built-in English message.

Missing entries and message functions returning `undefined` continue through the fallback chain.

## Configured primitive defaults

Use one isolated factory set when application forms import their primitives from a shared module:

```ts
export const { form, group, array, field } = createFormPrimitives({
  validatorMessages: () => ({
    required: translations().required,
    min: ({ min, actual }) => translations().min({ min, actual }),
  }),
});
```

This also covers standalone fields created by that `field()` factory. A closer form, group, or
array catalog can override individual messages.

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

Use process-wide configuration outside Angular or for one shared application default. In an Angular
browser entry point, call it in `main.ts` before bootstrapping. The
[startup example](../reference/configure-global-validator-messages.md#where-to-call-it) keeps the
catalog active; the following fragment instead shows a temporary override:

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

| Key | Callback parameters |
| --- | --- |
| `required` | none |
| `email` | none |
| `url` | none |
| `equalTo` | none; compared values are intentionally private |
| `uniqueItems` | `{ duplicateIndexes: readonly number[] }` |
| `between` | `{ min: number; max: number; actual: number }` |
| `min` | `{ min: number, actual: number }` |
| `max` | `{ max: number, actual: number }` |
| `integer` | `{ actual: number }` |
| `minLength` | `{ minLength: number, actual: number }` |
| `maxLength` | `{ maxLength: number, actual: number }` |
| `pattern` | `{ pattern: RegExp, actual: string }` |
| `minDate` | `{ minDate: Date, actual: Date }` |
| `maxDate` | `{ maxDate: Date, actual: Date }` |
| `dateBetween` | `{ minDate: Date, maxDate: Date, actual: Date }` |
| `oneOf` | `{ options: readonly unknown[], actual: unknown }` |
| `minWords` | `{ minWords: number, actual: number }` |
| `maxWords` | `{ maxWords: number, actual: number }` |

The callback receives the resolved constraint, not its original signal or source function. For
example, a reactive `min(() => minimumAge())` supplies the current numeric `min` value.

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

These catalogs apply only to built-in validators. Custom validators supply their own errors and messages.
