---
title: provideValidatorMessages()
---

# provideValidatorMessages()

Provides an application-, route-, or environment-injector-scoped catalog of messages for built-in
validators.

## Signature

```ts
provideValidatorMessages(
  factory: () => ValidatorMessages,
): EnvironmentProviders;
```

## Example

```ts
import type { ApplicationConfig } from '@angular/core';

import { provideValidatorMessages } from '@gem/ng-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideValidatorMessages(() => ({
      required: 'This value is required.',
      minLength: ({ minLength }) => `Enter at least ${minLength} characters.`,
    })),
  ],
};
```

The factory runs in an Angular injection context, so it may inject a translation service. A catalog
is partial: omitted kinds continue through normal message resolution. A message callback may also
return `undefined` to continue searching.

Node-local messages have higher precedence. Provider catalogs are searched from the target node
toward its ancestors, followed by the process-wide fallback and then built-in defaults.

Use [`configureGlobalValidatorMessages()`](./configure-global-validator-messages.md) outside Angular
DI or for a process-wide fallback.

See [Validator messages](../guides/validator-messages.md) and [Configuration](./configuration.md#angular-application-scope).
