---
title: provideFormNodesConfig()
---

# provideFormNodesConfig()

import CodeBlock from '@theme/CodeBlock';
import signalControlConfigSource from '!!raw-loader!../../examples/signal-control-sync-config.typecheck.ts';
import appConfigSource from '!!raw-loader!../../examples/validator-messages-app-config.typecheck.ts';
import applicationConfigSource from '!!raw-loader!../../examples/shared-module-application-config.typecheck.ts';
import sharedConfigSource from '!!raw-loader!../../examples/shared-module-shared-config.typecheck.ts';

Configures validator messages and reactive CSS classes with one provider function. Optional experimental control integration is documented at the end of this page. The exported `FormNodesConfig` type describes the same options.

## Signature

```ts
provideFormNodesConfig(config: {
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages) | null | undefined;
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
  syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[]
    | { inputs: 'declared' | 'all' | readonly SyncInputName[]; target?: 'all' | 'signal-controls' | 'cva' } | null | undefined; // Experimental; default: false
  bindInputOutputPairs?: boolean | null | undefined; // Experimental; default: false
}): Provider[];
```

## `classes` {#classes}

Configure CSS class names and reactive predicates for `[formNode]` bindings.
No classes are enabled by default. Set `classes: null` to restore that default in a nearer scope.

```ts title="app.config.ts"
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

Pass a partial catalog directly for simple configuration, or a factory when you need `inject()`.
Both forms support reactive message callbacks. Set `validatorMessages: null` to replace the inherited
provider catalog with an empty one; normal form-tree, global, and built-in fallbacks still apply.

For a standalone application, register the provider in `app.config.ts` and pass `appConfig` to
`bootstrapApplication(AppComponent, appConfig)`. The [shared catalog example](./configure-global-form-nodes.md#where-to-call-it)
exports the data used here; no initializer is needed.

<CodeBlock language="ts" title="app.config.ts">{appConfigSource}</CodeBlock>

For injectable configuration, use a factory instead of the object:

```ts
provideFormNodesConfig({
  validatorMessages: () => {
    const translations = inject(TranslationService);
    return { required: () => translations.translate('validation.required') };
  },
});
```

The factory runs once when its provider is first resolved, in an Angular injection context, so
it can inject a translation service. Return message callbacks that read signals for reactive
translations; the factory itself does not rerun when those signals change.

Nodes capture the catalog at creation through their explicit `injector` or the current injection
context. Binding an independently created node later does not replace its captured messages.
Node-local catalogs take precedence. Missing entries or callbacks returning `undefined` continue
through catalogs captured by ancestor nodes, the process-wide fallback, and built-in messages.
A nearer injector's catalog does not merge with an ancestor injector's catalog automatically.

Use [`configureGlobalFormNodes()`](./configure-global-form-nodes.md) for a
process-wide fallback, including code outside Angular DI. See [Validator messages](../guides/validator-messages.md)
for the complete precedence rules.

## Provider scope

Each option inherits independently from the nearest provider that explicitly configures it.
Without one, bindings use [`configureGlobalFormNodes()`](./configure-global-form-nodes.md) defaults,
then the library defaults. Message catalogs follow their normal fallback chain:

- Omit `validatorMessages` to preserve the inherited catalog.
- Omit `classes` to preserve the inherited class map. An explicit map replaces it without merging;
  `{ classes: {} }` clears only the inherited classes.
- Omit `syncInputs` to preserve the inherited setting. Set false, a named preset, a list, or an inputs/target object to override it.
  With no provider, this option uses the global setting, which defaults to `false`.
- Omit `bindInputOutputPairs` to preserve its independent inherited value. True enables pairs; false/null disables them.
- `{}` registers no providers. An option set to `undefined` also inherits.
- `{ validatorMessages: {} }` supplies an empty catalog without changing classes or synchronization.

`undefined` means **inherit**; `null` means **reset this option**. For classes and synchronization,
null bypasses global defaults. An empty provider message catalog still permits global fallback:

| Option set to `null` | Result |
| --- | --- |
| `bindInputOutputPairs` | Paired value and interaction binding disabled. |
| `classes` | No automatic classes; equivalent to an empty map. |
| `syncInputs` | Synchronization disabled (`false`). |
| `validatorMessages` | Empty provider catalog, with normal message fallback. |

```ts
// Component providers: reset all three options in this scope.
provideFormNodesConfig({
  classes: null,
  syncInputs: null,
  validatorMessages: null,
});
```

Each `null` affects only its own option. Resetting messages does not force the built-in English
text: node-local and form-tree catalogs, catalogs captured by ancestor nodes, and global messages
still participate in normal resolution. It does not change catalogs captured by existing nodes.
The null value belongs to the option itself; injectable factories still return a catalog object.

For example, these provider registrations belong in different scopes:

```ts
// app.config.ts — application providers
provideFormNodesConfig({
  validatorMessages: { required: 'Please complete this field.' },
  classes: ANGULAR_FORMS_STATUS_CLASSES,
  syncInputs: 'all',
});

// app.component.ts — component providers
provideFormNodesConfig({ syncInputs: false });
```

The component keeps the application messages and status classes while disabling matching
custom-control input synchronization. A component provider with `{ classes: {} }` would instead
clear the classes while keeping the application messages and synchronization setting.

Options are static configuration. Class predicates and selected message callbacks track the
signals they read. Multiple calls in one injector also preserve omitted options; the last explicit
provider for each option wins.

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
`FormNode` available to templates. Register `provideFormNodesConfig()` once in `app.config.ts` or the
`bootstrapApplication` providers. The example configures a required message and Angular Forms status classes to highlight a
touched, invalid input.

<CodeBlock language="ts" title="main.ts — application-level configuration">{applicationConfigSource}</CodeBlock>

In an application bootstrapped with `AppModule`, put the same provider call in
`AppModule.providers`, and import `SharedModule` in every NgModule whose declared components use
`[formNode]`. Components declared in NgModules must use `standalone: false`; their template
dependencies belong in the declaring module's `imports`.

### Configuration supplied by SharedModule

Choose this when importing `SharedModule` should also install your shared FormNode conventions.
Put `FormNode` in `imports` and `exports`, and call `provideFormNodesConfig()` in
`providers`, importing the configuration function directly from `@ngblocks/form-nodes`.
A separate application-level provider and a `forRoot()` method are not required.

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
application provider being merged. The nearest explicit provider for each option wins. Changing one option preserves the other two. Class maps are not merged automatically.

Use application-level registration for an application-wide policy. Use shared-module registration
when the module intentionally establishes that policy for its consuming injector contexts. Both
patterns are supported, and `provideFormNodesConfig()` returns ordinary `Provider[]`, so it also
works in component providers. No configuration provider is needed when the binding defaults are
sufficient.

For Angular's underlying rules, see [NgModules](https://angular.dev/guide/ngmodules/overview)
and [hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection).

## 🧪 `syncInputs` (experimental) {#custom-control-inputs}

**Experimental: writes component inputs through Angular internals. Default: `false`.**

This option copies node state and constraints into matching inputs on the selected custom control.
It never enables value binding. Use [`bindInputOutputPairs`](#bind-input-output-pairs) separately for paired
inputs and outputs. Node validation continues independently of both options.

| Selection | Inputs synchronized |
| --- | --- |
| `false` or `null` | None; explicitly overrides inherited input synchronization. |
| `'declared'` | Initial `disabled`, `readonly`, and `hidden` declarations, plus `disabledReasons` with disabled. |
| `'all'` | Every supported input exposed by the selected control. |
| `'signal-controls'` | Every supported input, only on a selected value/checked model control. |
| `['disabled', 'required']` | Exactly the listed inputs, regardless of declarations. |
| `{ inputs, target }` | Select inputs and restrict which adapter receives writes. |
| `[]` or `{ inputs: [] }` | No additional writes; does not enable a value connection. |
| Omitted or `undefined` | Inherit the next applicable setting. |

The object form is:

```ts
{
  inputs: 'declared' | 'all' | readonly SyncInputName[];
  target?: 'all' | 'signal-controls' | 'cva'; // Default: 'all'.
}
```

`'signal-controls'` is shorthand for `{ inputs: 'all', target: 'signal-controls' }`.
Targets filter the **selected adapter**, without changing selection priority: directly assigned
`NgControl.valueAccessor`, provided CVA, recognized custom control, then native control.
A component with both CVA and a model follows the CVA path. Signal-control detection checks an
actual `value` or `checked` model, not an `implements FormValueControl` or `FormCheckboxControl`
declaration. An active paired input/output control only matches target `'all'`.

### Configure model controls

<CodeBlock language="ts" title="app.config.ts">{signalControlConfigSource}</CodeBlock>

This configuration supplies model controls with all supported state and constraints. CVAs keep
their standard value, touch, and disabled callbacks without additional input writes. Native controls
keep their normal DOM behavior. Paired controls remain inactive because `bindInputOutputPairs` is false.

To narrow the selection further:

```ts
syncInputs: { inputs: ['disabled', 'required'], target: 'signal-controls' }
```

### State, constraints, and declarations

Supported public input names are `disabled`, `disabledReasons`, `readonly`, `hidden`, `dirty`,
`touched`, `invalid`, `pending`, `errors`, `name`, `required`, `min`, `max`, `minLength`, `maxLength`,
and `pattern`. Use public aliases, not the component's private property names. Missing inputs are ignored.

The `'declared'` preset only considers initial node options with values other than undefined;
`disabled: false` counts. Validators never select inputs in this preset. Use `'all'`,
`'signal-controls'`, or a list for constraints and derived states. A list containing disabled does
not implicitly include disabledReasons.

Every enabled selection updates reactively. Conditional constraints and validator removal update
selected inputs to current or neutral values. Writes can replace component defaults and authored
bindings; unselected inputs retain their existing values. Selecting a CVA's disabled input may write
it in addition to the standard `setDisabledState()` call.

### Scope and rebinding

Each binding option resolves independently: node option (including factory defaults), nearest
explicit provider, global fallback, then false. Lists and objects replace inherited selections as
one value; they do not merge. A node option affects its own binding, not descendants.

Provider/global fallbacks are captured when a connection is created. Rebinding uses the replacement
node's options. Inputs no longer selected retain their last values rather than restoring defaults.
For state access without experimental writes, use a model with `useFormNodeState()` and render its
signals. See [custom controls](../guides/custom-controls.md).

## 🧪 `bindInputOutputPairs` (experimental) {#bind-input-output-pairs}

**Experimental: writes value inputs through Angular internals. Default: `false`.**

Set `bindInputOutputPairs: true` to connect a recognized `value`/`valueChange` or
`checked`/`checkedChange` input/output pair. Both signal and decorator inputs and public aliases
are supported. CVAs and actual value/checked models take precedence and work without this opt-in.

| Setting | Paired control behavior |
| --- | --- |
| `true` | Connect value writes, change and touch outputs, optional focus/reset hooks, and optional writable node reference. |
| `false` or `null` | Keep the pair inactive, including optional state-input writes and its interaction hooks. |
| Omitted or `undefined` | Inherit independently of `syncInputs`. |

Input synchronization and value binding are separate decisions:

```ts
// Value and interaction only; no state-input writes.
{ bindInputOutputPairs: true, syncInputs: false }

// Value and interaction, plus exactly these state inputs.
{ bindInputOutputPairs: true, syncInputs: ['disabled', 'required'] }

// The pair stays inactive even though input synchronization is configured.
{ bindInputOutputPairs: false, syncInputs: 'all' }
```

Pairs follow normal dirty/touched, validation, propagation, and pending/committed debounce rules.
Touch commits pending blur updates. Rebinding to an inactive node pauses the complete connection
and clears its writable node reference; existing component input values remain unchanged. Returning
to an active node writes its current control value again, even when unchanged since the pause.
Inactive pairs remain recognized hosts rather than causing a missing-adapter error. Initialize
separate inputs with defaults; an inactive pair cannot supply required inputs.

Configuration precedence and snapshots follow the independent rules above. Use this option on
fields, forms, groups, arrays, factory defaults, providers, or global configuration. A parent node
option does not enable pairs on its descendants. See the
[complete paired component example](../guides/custom-controls.md#separate-input-output-pairs).
