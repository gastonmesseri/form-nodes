---
title: provideFormNodesConfig()
---

# provideFormNodesConfig()

import CodeBlock from '@theme/CodeBlock';
import signalControlConfigSource from '!!raw-loader!../../examples/signal-control-sync-config.typecheck.ts';
import appConfigSource from '!!raw-loader!../../examples/validator-messages-app-config.typecheck.ts';
import applicationConfigSource from '!!raw-loader!../../examples/shared-module-application-config.typecheck.ts';
import sharedConfigSource from '!!raw-loader!../../examples/shared-module-shared-config.typecheck.ts';

Configures validator messages, custom-control input synchronization, and reactive CSS classes with one provider function. The exported `FormNodesConfig` type describes the same options.

## Signature

```ts
provideFormNodesConfig(config: {
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages) | null | undefined;
  syncInputs?: boolean | 'only-declared' | 'always' | 'only-signal-controls' | readonly SyncInputName[]
    | { mode: 'only-declared' | 'always'; inputs: readonly SyncInputName[] } | null | undefined; // Experimental; default: false
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
}): Provider[];
```

## `syncInputs` {#custom-control-inputs}

**Experimental and disabled by default.** `syncInputs` controls optional custom-control input
writes that depend on Angular internals. It applies to the input contract used by Angular's
`FormValueControl` and `FormCheckboxControl`, and matching inputs on other supported custom controls.

| Value | Behavior |
| --- | --- |
| `false` or `null` | Do not synchronize optional inputs. |
| `true` or `'only-declared'` | Synchronize initial `disabled`, `readonly`, and `hidden` declarations only; validator constraints are excluded. |
| `'always'` | Synchronize every matching supported input, including derived state. |
| `'only-signal-controls'` | Synchronize every supported input, including constraints, only for a selected Signal Forms model control. No optional CVA writes or paired input/output transport. |
| `['disabled', 'dirty']` | Always synchronize exactly these inputs, regardless of initial declarations. |
| `{ mode: 'always', inputs: [...] }` | Same behavior as the array shorthand. |
| `{ mode: 'only-declared', inputs: [...] }` | Synchronize only listed inputs that were also initially declared. |
| `[]` or an object with `inputs: []` | Do not synchronize optional inputs. |
| Omitted or `undefined` | Inherit the provider/global setting. |

`SyncInputName` and `SyncInputs` are exported types. Supported names are `disabled`,
`disabledReasons`, `dirty`, `errors`, `hidden`, `invalid`, `max`, `maxLength`, `min`, `minLength`,
`name`, `pattern`, `pending`, `readonly`, `required`, and `touched`. Names refer to public inputs,
not aliased component property names. `value` and `checked` are model channels, not optional inputs.
Selections are exact: `['disabled']` does not also select `disabledReasons`. Explicit lists replace
inherited selections; they do not merge. Unselected inputs retain their current component values.
Treat configuration objects and arrays as fixed declarations; to change a selection, configure a
new binding or rebind to a node with different options.

### Restrict synchronization to Signal Forms controls

<CodeBlock language="ts" title="app.config.ts">{signalControlConfigSource}</CodeBlock>

`'only-signal-controls'` behaves like `'always'` for a selected `signal-forms-control` adapter with
`value = model()` or `checked = model()`, including validator constraints. Detection uses the
runtime model structure; an explicit `implements FormValueControl` or `FormCheckboxControl`
declaration is not required. This mode remains experimental because input writes use Angular internals.

A CVA keeps its standard value, touch, and disabled connection without optional input writes,
even if that component also exposes a model: CVA selection takes precedence. Native controls keep
their normal behavior. Separate `value`/`valueChange` or `checked`/`checkedChange` pairs stay
inactive in this mode. Node options still override providers and global configuration on rebinding.

### Declaration-based selection

`disabledReasons` follows an initial `disabled` declaration. A declaration with a false value still
counts. Validators never select inputs in this mode, even when registered initially. To synchronize
`required`, `min`, `max`, `minLength`, `maxLength`, or `pattern`, use `'always'` or an explicit input
list such as `['required', 'minLength']`. Those selections track reactive and conditional constraints
and clear removed constraints to neutral values. Validation runs normally in every mode.

Derived `dirty`, `touched`, `invalid`, `pending`, `errors`, and the generated `name` are synchronized
in `'always'` mode or through an explicit input list. Component inputs not selected by the mode retain their own values or
explicit template bindings. Full synchronization may replace authored template input values.

Set this option on `field()`, `form()`, `group()`, or `array()` to override a provider for that node's
own binding. Node options do not propagate to descendants. `createFormPrimitives({ syncInputs })`
can supply defaults for nodes created by its factories. Resolution is **node option → nearest
explicit provider → global setting → false**. Null explicitly opts out at any level.

Value/checked models, the optional `node` model, touch, focus, and reset hooks remain connected.
Native controls still receive their state, and CVAs still receive `setDisabledState()`. With synchronization disabled, value binding requires actual `model()` properties or a CVA; separate input/output pairs require enabled experimental `syncInputs`. `useFormNodeState()` is available for public state reads.

See [Experimental input synchronization](../guides/custom-controls.md#keep-control-of-your-components-inputs)
for a complete component example.

### Experimental input/output value pairs

Enabled `syncInputs` also connects separate `value`/`valueChange` and `checked`/`checkedChange`
pairs. Every enabled mode except `'only-signal-controls'`, list, or mode/inputs object opts into this value transport. Lists filter
only optional state inputs, so `[]` connects the value pair without optional state writes.
`false`, `null`, and `'only-signal-controls'` pause pair writes and ignore its change/touch outputs. Rebinding to an enabled
node resynchronizes its current control value. This transport uses Angular's internal input writer;
actual models and CVAs remain available without it. See [the complete example](../guides/custom-controls.md#separate-input-output-pairs).

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
- Omit `syncInputs` to preserve the inherited setting. Set a boolean, named mode, list, or mode/inputs object to override it.
  With no provider, this option uses the global setting, which defaults to `false`.
- `{}` registers no providers. An option set to `undefined` also inherits.
- `{ validatorMessages: {} }` supplies an empty catalog without changing classes or synchronization.

`undefined` means **inherit**; `null` means **reset this option**. For classes and synchronization,
null bypasses global defaults. An empty provider message catalog still permits global fallback:

| Option set to `null` | Result |
| --- | --- |
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
  syncInputs: 'always',
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
application provider being merged. The nearest explicit provider for each option wins. Changing one option preserves the other two. Class maps are not merged automatically.

Use application-level registration for an application-wide policy. Use shared-module registration
when the module intentionally establishes that policy for its consuming injector contexts. Both
patterns are supported, and `provideFormNodesConfig()` returns ordinary `Provider[]`, so it also
works in component providers. No configuration provider is needed when the binding defaults are
sufficient.

For Angular's underlying rules, see [NgModules](https://angular.dev/guide/ngmodules/overview)
and [hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection).
