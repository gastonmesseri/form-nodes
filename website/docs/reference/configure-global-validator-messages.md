---
title: configureGlobalValidatorMessages()
---

import CodeBlock from '@theme/CodeBlock';
import catalogSource from '!!raw-loader!../../examples/validator-message-catalog.ts';
import bootstrapSource from '!!raw-loader!../../examples/global-validator-messages-bootstrap.typecheck.ts';

# configureGlobalValidatorMessages()

Configures the process-wide fallback catalog used to resolve built-in validator messages outside
or below Angular dependency-injection configuration.

## Signature

```ts
configureGlobalValidatorMessages(
  messages: ValidatorMessages | (() => ValidatorMessages | undefined),
): () => void;
```

## Where to call it

For a process-wide fallback in a browser application, call `configureGlobalValidatorMessages()`
explicitly in **`main.ts`, before `bootstrapApplication()`**. In an NgModule application, use the
same entry-point placement before bootstrapping `AppModule`.

Keep a larger catalog in a separate file that exports data. Importing that file should not itself
change global configuration:

<CodeBlock language="ts" title="validator-message-catalog.ts">{catalogSource}</CodeBlock>

This complete Angular example includes a small root component to show where configuration happens.
In an existing application, keep your normal `AppComponent` import and put the configuration call
immediately before your existing bootstrap call:

<CodeBlock language="ts" title="main.ts">{bootstrapSource}</CodeBlock>

Keep this startup catalog active for the application's lifetime. The returned restore function is
useful for temporary overrides, such as tests; do not immediately restore the catalog after startup.

A static catalog needs no application initializer. Avoid configuring it in component constructors,
`ngOnInit`, or files imported only for their side effects: the application entry point makes the
configuration timing explicit and avoids repeating setup as components are created.

For **application-scoped Angular messages**, prefer
[`provideValidatorMessages()` in `app.config.ts`](./provide-validator-messages.md#example).
Use `AppModule.providers` for an NgModule application. The provider factory can inject translation
services and keeps the catalog scoped to its Angular injector. Registering a global setter inside
an Angular initializer would not make its state application-scoped.

The global catalog is shared module state. Keep request-specific locales and user-specific wording
in providers or form options during SSR, rather than calling this function for each request.

## Static catalog

```ts
const restoreMessages = configureGlobalValidatorMessages({
  required: 'This value is required.',
  min: ({ min }) => `Enter a value of at least ${min}.`,
});
```

Call the returned function to restore the catalog that was active before this configuration:

```ts
restoreMessages();
```

Restoration only occurs while this call's catalog is still current, so an older cleanup cannot
overwrite a newer configuration.

## Reactive catalog

```ts
const locale = signal<'en' | 'de'>('en');

const restoreMessages = configureGlobalValidatorMessages(() => ({
  required: locale() === 'de' ? 'Dieses Feld ist erforderlich.' : 'This field is required.',
}));
```

Signals read by the source and by the selected message callback are tracked while validation
fails. Prefer [`provideValidatorMessages()`](./provide-validator-messages.md) for concurrent SSR
requests because module-level state is shared between requests.

See [Validator messages](../guides/validator-messages.md) and [Configuration](./configuration.md#process-wide-fallback).
