---
title: provideFormNodesConfig()
---

# provideFormNodesConfig()

import CodeBlock from '@theme/CodeBlock';
import appConfigSource from '!!raw-loader!../../examples/validator-messages-app-config.typecheck.ts';
import applicationConfigSource from '!!raw-loader!../../examples/shared-module-application-config.typecheck.ts';
import sharedConfigSource from '!!raw-loader!../../examples/shared-module-shared-config.typecheck.ts';

Configures validator messages, custom-control input synchronization, and reactive CSS classes with one provider function. The exported `FormNodesConfig` type describes the same options.

## Signature

```ts
provideFormNodesConfig(config: {
  validatorMessages?: () => ValidatorMessages;
  syncControlInputs?: boolean; // Default: true
  classes?: Record<string, (binding: FormNodeBinding) => boolean>;
}): Provider[];
```

## `syncControlInputs` {#custom-control-inputs}

`syncControlInputs` defaults to `true`. Set it to `false` to preserve component defaults and
consumer template bindings for these custom-control inputs:

- `disabled`, `disabledReasons`, `readonly`, and `hidden`.
- `dirty`, `touched`, `invalid`, `pending`, and `errors`.
- `required`, `min`, `max`, `minLength`, `maxLength`, and `pattern`.
- `name`.

The option applies to signal controls, separate value/checked input-output pairs, and matching
inputs on custom CVA components. It uses public input names, including aliases. It is read when
the control connects and remains effective when the bound node changes.

Value/checked synchronization, the optional `node` signal, touch, focus, and reset hooks remain
connected. Native controls still receive their state, and CVAs still receive `setDisabledState()`.
Disabling input synchronization does not change the node's own disabled state, validation, or
value behavior. `useFormNodeState()` remains available for explicit state reads.

See [Keep control of your component's inputs](../guides/custom-controls.md#keep-control-of-your-components-inputs)
for a complete application example. Angular's own binding directives use their own configuration.

## `classes` {#classes}

Configure CSS class names and reactive predicates for `[formNode]` bindings.
No classes are enabled by default.

```ts
// app.config.ts
import type { ApplicationConfig } from '@angular/core';

import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      classes: {
        ...ANGULAR_FORMS_STATUS_CLASSES,
        'has-visible-error': binding => {
          return binding.node().invalid() && binding.node().touched();
        },
      },
    }),
  ],
};
```

Each predicate tracks its own signal dependencies and toggles its class independently. The closest
provider wins; class maps from ancestor providers are not merged automatically.

No classes are configured by default. [`ANGULAR_FORMS_STATUS_CLASSES`](./angular-forms-status-classes.md) supplies `ng-valid`,
`ng-invalid`, `ng-pending`, `ng-pristine`, `ng-dirty`, `ng-untouched`, and `ng-touched`.

This provider can coexist with Angular's `provideSignalFormsConfig({ classes })`. They use
independent tokens and configure their respective binding directives.

See [Configuration](./configuration.md#binding-configuration) and [`[formNode]`](./form-node-binding.md#automatic-css-classes).

## `validatorMessages` {#validator-messages}

For a standalone application, register the provider in `app.config.ts` and pass `appConfig` to
`bootstrapApplication(AppComponent, appConfig)`. The [shared catalog example](./configure-global-validator-messages.md#where-to-call-it)
exports the data used here; no initializer is needed.

<CodeBlock language="ts" title="app.config.ts">{appConfigSource}</CodeBlock>

The factory runs once when its provider is first resolved, in an Angular injection context, so
it can inject a translation service. Return message callbacks that read signals for reactive
translations; the factory itself does not rerun when those signals change.

Nodes capture the catalog at creation through their explicit `injector` or the current injection
context. Binding an independently created node later does not replace its captured messages.
Node-local catalogs take precedence. Missing entries or callbacks returning `undefined` continue
through catalogs captured by ancestor nodes, the process-wide fallback, and built-in messages.
A nearer injector's catalog does not merge with an ancestor injector's catalog automatically.

Use [`configureGlobalValidatorMessages()`](./configure-global-validator-messages.md) for a
process-wide fallback, including code outside Angular DI. See [Validator messages](../guides/validator-messages.md)
for the complete precedence rules.

## Provider scope

Messages and binding options are independent sections:

- Omitting `validatorMessages` preserves the inherited provider catalog.
- Omitting both `classes` and `syncControlInputs` preserves the inherited binding configuration.
- Providing either binding option replaces the binding section as a whole: omitted classes mean
  no configured classes, and omitted `syncControlInputs` defaults to `true`. Class maps do not merge.
- `{}` registers no providers. Use `{ classes: {} }` to clear inherited classes and restore the
  default input synchronization. Use `{ validatorMessages: () => ({}) }` to supply an empty catalog.

Options are static configuration. Class predicates and selected message callbacks track the
signals they read. Register the combined configuration once per injector scope when possible.

## Using FormNode through SharedModule

`FormNode` is a standalone directive. A shared NgModule can import it and re-export it so that
consuming components can import `SharedModule` instead of importing `FormNode` directly.
Put `FormNode` in the module's `imports` and `exports`, not in `declarations`.

The following are two alternative, complete application entry points. Each can be used as
`main.ts` in an Angular application with an `<app-root></app-root>` host in `index.html`.
They keep the module, component, and bootstrap together so the provider location is visible;
in a larger application, place them in `shared.module.ts`, `app.component.ts`, `app.config.ts`
when applicable, and `main.ts`, with the corresponding local imports. Comments mark the suggested
file for each section; imports are grouped at the top to keep each combined example executable.

### Application-level configuration

Choose this when the application owns the default configuration and `SharedModule` only makes
`FormNode` available to templates. Register the provider once in `app.config.ts` or the
`bootstrapApplication` providers. The example configures a required message and Angular Forms status classes to highlight a
touched, invalid input.

<CodeBlock language="ts" title="main.ts — application-level configuration">{applicationConfigSource}</CodeBlock>

In an application bootstrapped with `AppModule`, put the same provider call in
`AppModule.providers`, and import `SharedModule` in every NgModule whose declared components use
`[formNode]`. Components declared in NgModules must use `standalone: false`; their template
dependencies belong in the declaring module's `imports`.

### Configuration supplied by SharedModule

Choose this when importing `SharedModule` should also install your shared FormNode conventions.
Put `provideFormNodesConfig()` in the module's `providers` array. A separate application-level
provider and a `forRoot()` method are not required.

<CodeBlock language="ts" title="main.ts — configuration supplied by SharedModule">{sharedConfigSource}</CodeBlock>

This is a valid pattern, but provider scope follows Angular's injector hierarchy, not the set of
source files that import the module. Importing the module makes the directive available to
those templates; the configuration applies to nodes and bindings that resolve its providers.

### Choose the scope deliberately

| Registration | Configuration scope |
| --- | --- |
| `app.config.ts` or root `AppModule.providers` | Application default, unless a nearer provider replaces it. |
| `SharedModule.providers` imported by an eagerly loaded root NgModule | Providers are collected into the root module injector; the configuration is not restricted to that module's templates. |
| `SharedModule.providers` imported within a lazy NgModule or standalone component context | The configuration is available through that context's injector and can shadow an ancestor configuration. |
| A component's `providers` | Nodes created in that injection context and bindings resolving through its injector. |

Repeated imports into different injector contexts can install the configuration again. For
example, a lazy feature importing a configured `SharedModule` can receive that module's config
instead of the application's inherited config. Do not rely on a configured shared module and an
application provider being merged. The nearest provider for each section wins. A messages-only provider preserves inherited bindings;
a bindings-only provider preserves inherited messages. Class maps are not merged automatically.

Use application-level registration for an application-wide policy. Use shared-module registration
when the module intentionally establishes that policy for its consuming injector contexts. Both
patterns are supported, and `provideFormNodesConfig()` returns ordinary `Provider[]`, so it also
works in component providers. No configuration provider is needed when the binding defaults are
sufficient.

For Angular's underlying rules, see [NgModules](https://angular.dev/guide/ngmodules/overview)
and [hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection).
