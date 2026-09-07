---
title: configureGlobalFormNodes()
---

import CodeBlock from '@theme/CodeBlock';
import catalogSource from '!!raw-loader!../../examples/validator-message-catalog.ts';
import bootstrapSource from '!!raw-loader!../../examples/global-form-nodes-bootstrap.typecheck.ts';
import runtimeSource from '!!raw-loader!../../examples/global-form-nodes-configuration.example.ts';

# configureGlobalFormNodes()

Configures process-wide defaults for validator messages, automatic classes, and custom-control
input synchronization. Angular providers override each option independently. The exported
`GlobalFormNodesConfig` type describes these options.

## Signature

```ts
configureGlobalFormNodes(config: {
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined) | null | undefined;
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
  syncControlInputs?: boolean | null | undefined;
}): () => void;
```

## Where to call it

Call this function in **`main.ts`, before `bootstrapApplication()`**, or before bootstrapping
`AppModule`. Keep startup configuration active for the application's lifetime. It requires no
injection context or Angular initializer.

A larger catalog can live in its own file, exporting data without configuring global state:

<CodeBlock language="ts" title="validator-message-catalog.ts">{catalogSource}</CodeBlock>

This complete example configures the library and bootstraps a small application. Comments mark
the suggested files for each section; imports stay together so the combined example is executable.

<CodeBlock language="ts" title="Application startup">{bootstrapSource}</CodeBlock>

Use [`provideFormNodesConfig()`](./provide-form-nodes-config.md) for application-, route-, module-,
or component-scoped overrides. Global state is shared across Angular applications and SSR requests
in the same JavaScript module instance; request-specific configuration belongs in providers or
form options.

## Independent options and precedence

For each binding option, resolution is: **nearest explicit Angular provider → global setting →
library default**. For messages, validator and form-tree overrides retain higher precedence;
global messages remain the fallback after catalogs captured by nodes from Angular providers.

| Option | Global behavior | `null` resets to |
| --- | --- | --- |
| `validatorMessages` | Static or reactive fallback catalog | Empty catalog, leaving built-in messages as the final fallback |
| `classes` | Class map captured by new bindings | No automatic classes |
| `syncControlInputs` | Setting captured when controls connect | `true` |

Omitting an option or passing `undefined` preserves the current global setting. Multiple calls
update only the supplied options. Explicit catalogs and class maps replace their previous maps;
they do not merge entries automatically.

A provider with `classes: null` or `syncControlInputs: null` explicitly selects the library default,
bypassing the global value for that option. A provider with `validatorMessages: null` supplies an
empty provider catalog; normal message fallback still includes the global catalog. It does not
force built-in English text.

## Reactive messages and binding snapshots

Global catalog functions run reactively during failing validation and may return `undefined` to
fall back to built-in messages. They are **reactive sources, not injectable factories**: this API
does not create an injection context. Use the provider's factory when a catalog needs `inject()`.
Selected message callbacks can also read signals. Replacing or restoring global messages updates
existing failing nodes, including nodes declared outside Angular DI.

Class predicates remain reactive after a binding captures their map. Changing the global class
map or synchronization option later affects new bindings or control connections; it does not
reconfigure existing ones. Configure those defaults before bootstrap. Native-control state,
value/checked binding, touch, focus, and reset behavior retain their existing rules.

## Restoring temporary configuration

The returned callback removes only the overrides installed by its call. It is idempotent and
preserves later overrides of the same option. Cleanup can run out of order: when a later override
is removed, previously cleaned-up overrides are skipped instead of being reactivated.
Restoring binding defaults affects future bindings; restoring messages also updates existing nodes.

This executable example checks partial updates, reactive messages, resets, and restoration:

<CodeBlock language="ts" title="global-form-nodes.example.ts">{runtimeSource}</CodeBlock>

See [Configuration](./configuration.md#process-wide-fallback) and
[Validator messages](../guides/validator-messages.md).
