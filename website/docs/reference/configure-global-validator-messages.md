---
title: configureGlobalValidatorMessages()
---

# configureGlobalValidatorMessages()

Configures the process-wide fallback catalog used to resolve built-in validator messages outside
or below Angular dependency-injection configuration.

## Signature

```ts
configureGlobalValidatorMessages(
  messages: ValidatorMessages | (() => ValidatorMessages | undefined),
): () => void;
```

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
