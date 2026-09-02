---
title: provideValidatorMessages()
---

import CodeBlock from '@theme/CodeBlock';
import appConfigSource from '!!raw-loader!../../examples/validator-messages-app-config.typecheck.ts';

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

For a standalone Angular application, register this provider in **`app.config.ts`** and pass
`appConfig` to `bootstrapApplication(AppComponent, appConfig)`. No separate initializer is needed.
The [shared catalog example](./configure-global-validator-messages.md#where-to-call-it) exports the
`validatorMessages` data used here; this provider setup is an alternative to the global setter.

<CodeBlock language="ts" title="app.config.ts">{appConfigSource}</CodeBlock>

For an NgModule application, register the same provider in **`AppModule.providers`**.


The factory runs in an Angular injection context, so it may inject a translation service. A catalog
is partial: omitted kinds continue through normal message resolution. A message callback may also
return `undefined` to continue searching.

Node-local messages have higher precedence. Provider catalogs are searched from the target node
toward its ancestors, followed by the process-wide fallback and then built-in defaults.

Use [`configureGlobalValidatorMessages()`](./configure-global-validator-messages.md) outside Angular
DI or for a process-wide fallback.

See [Validator messages](../guides/validator-messages.md) and [Configuration](./configuration.md#angular-application-scope).
