---
title: Configuration
description: Configuration scopes, reactivity, precedence, inheritance, and Angular providers in Form Nodes.
---

# Configuration

The [reactive configuration example](../examples/executable-examples.mdx#reactive-configuration-and-precedence)
is compiled and executed to verify message precedence and inherited state.

Form Nodes keeps configuration close to the feature it affects. Node options configure one node or
tree, Angular providers configure an injector scope, and the process-wide API supplies fallback messages and defaults for new bindings.

## Configuration map

| Scope | API | Affects | Reactive |
| --- | --- | --- | --- |
| Validator call | `{ message }` | That validator instance | Message functions are reactive |
| Node or subtree | `field()`, `form()`, `array()`, and `group()` options | The declared node; selected options inherit | Function sources are reactive |
| Angular injector | `provideFormNodesConfig()` | Messages for nodes created in that scope; descendant `[formNode]` bindings | Selected message functions and class predicates are reactive |
| Factory set | `createFormPrimitives()` | Nodes created through that set | Catalog sources are reactive; node options override shared defaults |
| JavaScript process | `configureGlobalFormNodes()` | Fallback messages; classes and input synchronization for new bindings | Catalog sources, selected messages, and captured class predicates are reactive |

Global configuration controls messages, classes, and input synchronization. It does not change
node defaults such as nullability, debounce, disabled state, or validators. `createFormPrimitives()` can scope nullability, validator messages,
and injector inheritance policies to one factory set; configure other decisions at the appropriate
node or ancestor.

### Find configuration by concern

| Concern | Details |
| --- | --- |
| Validators, nullability, state, and debounce | [Node options](#node-options) |
| Message catalogs and exact precedence | [Validator-message configuration](#validator-message-configuration) |
| Application, route, feature, or SSR scopes | [Angular application scope](#angular-application-scope) |
| One form subtree | [Form-tree scope](#form-tree-scope) |
| Non-Angular or process-wide defaults | [Process-wide fallback](#process-wide-fallback) |
| Custom-control state inputs | [Input synchronization](#custom-control-input-synchronization) |
| Reactive classes on rendered controls | [Binding configuration](#binding-configuration) |
| Async watcher cleanup and explicit injectors | [Injector ownership](#injector-ownership) |
| One consolidated resolution table | [Precedence at a glance](#precedence-at-a-glance) |

## Node options

`syncInputs` is an **experimental binding option** accepted by every primitive and by
`createFormPrimitives()` defaults. It affects only the bound node, not descendants. It is off by
default; true means `'only-declared'`, `'always'` synchronizes every supported input, and null opts
out. An input list such as `['disabled', 'dirty']` always synchronizes exactly those inputs;
`{ mode: 'only-declared', inputs: ['disabled'] }` also requires an initial declaration.
Separate value/input-output pairs also require an enabled setting; `[]` enables their value
transport alone. Node options take precedence over providers and global defaults. See
[custom-control input modes](./provide-form-nodes-config.md#custom-control-inputs).

The call-site types are designed for discovery in IntelliSense. Small accepted unions—such as
`number | 'blur'` for debounce or `boolean | string | (() => boolean | string)` for disabled
state—are shown directly instead of being hidden behind another type name. Reactive callbacks are
identified in their property documentation and describe what changes retrigger them.

Named types such as `FieldOptions`, `FormOptions`, `ArrayOptions`, and `GroupOptions` remain
available when an application wants to construct or reuse configuration separately. These are
consumer-owned mutable objects, so their properties are not marked `readonly`; the library reads
the selected values when the node is created.

### Options shared by nodes

| Option | `field()` | `form()` | `array()` | `group()` | Inheritance |
| --- | --- | --- | --- | --- | --- |
| `validators` | Yes | Yes | Yes | Yes | No; validates that exact node |
| `injector` | Yes | Yes | Yes | Yes | Own injector; takes precedence over tree inheritance |
| `adoptBindingInjector` | Yes | Yes | Yes | Yes | Yes by default; adopts a direct `[formNode]` host lease |
| `inheritInjector` | Yes | Yes | Yes | Yes | Yes by default; `false` creates a subtree boundary |
| `debounce` | Yes | Yes | Yes | Yes | Yes; nearest configured node wins for descendants |
| `hidden` | Yes | Yes | Yes | Yes | Effective state propagates through descendants |
| `disabled` | Yes | Yes | Yes | Yes | Effective state propagates through descendants |
| `readonly` | Yes | Yes | Yes | Yes | Effective state propagates through descendants |

`form()`, `array()`, and `group()` additionally accept `validatorMessages`. Only a form accepts `onSubmit`.
An array additionally accepts `initialValue` and `trackBy`. Only `field()` accepts `nullable`.

### Static and reactive state

`hidden` and `readonly` accept a boolean or a reactive function. `disabled` also accepts a reason
string or a function returning a boolean or reason string:

```ts
const profileForm = form({
  displayName: field('', {
    disabled: () => accountLocked()
      ? 'The account is locked.'
      : false,
    readonly: () => !permissions().canEditProfile,
    hidden: () => !features().profiles,
  }),
});
```

A source function tracks the signals it reads. Effective disabled, readonly, and hidden state is
the union of configured state, imperative state, and inherited ancestor state. Consequently,
`enable()`, `markAsWritable()`, or `show()` cannot override another cause that remains active.

See [Interaction and availability](../guides/interaction-and-availability.md).

### Debounce inheritance

A form or array can establish a default control-value debounce for its subtree. A closer option
overrides it, including `0`, which disables an inherited delay:

```ts
const profileForm = form({
  displayName: field(''),             // Inherits 300 ms.
  searchTerm: field('', {
    debounce: 0,                      // Commits immediately.
  }),
  address: {
    city: field('', {
      debounce: 'blur',               // Overrides with blur commit.
    }),
  },
}, {
  debounce: 300,
});
```

An asynchronous debounce function receives an `AbortSignal`. It is cancelled when newer control
input supersedes its work. Programmatic `set()`, `update()`, and `patch()` are never debounced.

See [Value flow and debounce](../guides/value-flow-and-debounce.md).

### Validators

Validators belong to the exact node where they are declared; they do not inherit. The
`FormOptions.validators` option accepts one validator directly or an array. Start with a named
validator when a rule is reused:

```ts
const profileForm = form({
  displayName: field(''),
  marketingConsent: field(false),
}, {
  validators: [profilePolicy],
});
```

For a small rule belonging only to one form, declare it inline. The callback receives the complete
form value through the callable `value` signal:

```ts
const checkoutForm = form({
  acceptTerms: field(false),
}, {
  validators: ({ value }) => {
    return value().acceptTerms
      ? null
      : { kind: 'termsRequired', message: 'Accept the terms to continue.' };
  },
});
```

Form-level validators are especially useful when a rule compares multiple children:

```ts
const passwordForm = form({
  password: field(''),
  confirmation: field(''),
}, {
  validators: [({ value }) => {
    return value().password === value().confirmation
      ? null
      : { kind: 'passwordMismatch', message: 'Passwords must match.' };
  }],
});
```

The form owns errors returned by these validators; descendant validators continue to own their own
errors. Arrays may combine synchronous validators, validators created with `asyncValidator()`, and
`null` or `undefined` entries, which are ignored. A single validator does not need an array:

```ts
const profileForm = form({
  displayName: field(''),
}, { validators: profilePolicy });
```

`setValidators()` replaces the validators of that node at runtime. Async validators must be
declared through `asyncValidator()` so the node can own pending state, cancellation, and stale
results. See [Validation](../guides/validation.md) and
[`asyncValidator()`](./async-validator.md).

### Nullability

Fields are nullable by default. The option changes the public value type as well as accepted
writes:

```ts
const profileForm = form({
  displayName: field(''),            // string | null
  countryCode: field.strict('CH'),   // string
});
```

`form()` and `array()` are permanent structural containers and are not nullable. Individual array
items remain as nullable as their template permits. See [Choosing a primitive](../guides/choosing-a-primitive.md).

### Form submission

`onSubmit` belongs to the form on which it is declared and is not inherited as another form's
action:

```ts
const profileForm = form({
  displayName: field(''),
}, {
  onSubmit: value => saveProfile(value),
  onSubmitBlocked: formNode => formNode.focus(),
  submitWhen: 'not-invalid',
});
```

`submitWhen` accepts `'not-invalid'` (default), `'valid'`, or `'always'`. See
[Form submission](../guides/submission.md) for their behavior.

### Array creation and identity

`initialValue` controls initial contents; a number creates that many items from template defaults.
`trackBy` controls identity during complete reconciliation:

```ts
const contacts = array({
  id: field(''),
  email: field(''),
}, {
  initialValue: initialContacts,
  trackBy: 'id',
});
```

These options configure the array itself and are not inherited by nested arrays. See
[`array()`](./array.md).

## Validator-message configuration

Message resolution uses the first definition that returns a message:

1. The validator's local `message` option.
2. The closest form or array `validatorMessages` catalog, walking toward the root.
3. The closest `createFormPrimitives()` validator-message default, walking toward the root.
4. The closest captured `provideFormNodesConfig()` catalog, walking toward the root.
5. `configureGlobalFormNodes()`.
6. The built-in English message.

Missing catalog entries and callbacks returning `undefined` continue to the next layer. A nested
catalog therefore overrides individual keys without having to repeat every message.

### Angular application scope

Register provider configuration in `app.config.ts` and pass that `ApplicationConfig` to
`bootstrapApplication(AppComponent, appConfig)` for a standalone Angular application. See the
[complete provider example](./provide-form-nodes-config.md#validator-messages):

```ts
import { ApplicationConfig, inject } from '@angular/core';
import { provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      validatorMessages: () => {
        const translations = inject(TranslationService);

        return {
          required: () => translations.translate('validation.required'),
        };
      },
      classes: {
        'is-invalid': binding => binding.node().invalid(),
      },
    }),
  ],
};
```

`provideFormNodesConfig()` can also be registered in a route, an NgModule, or a component.
Nodes capture the nearest applicable catalog when created. Angular provider catalogs are not
merged automatically: a missing entry can continue to a different catalog captured by an ancestor
node, then to the global and built-in fallbacks. Use a closer provider for a route, feature, or SSR
request scope and include every override required by that injector scope.

For an NgModule application, place the same provider call in the module's `providers` array.

### Form-tree scope

Use `validatorMessages` when one subtree needs domain-specific wording:

```ts
const checkoutForm = form({
  quantity: field(0, [min(1)]),
}, {
  validatorMessages: () => ({
    min: ({ min }) => checkoutTranslations().minimumQuantity(min),
  }),
});
```

The catalog source and the selected message callback track signals while a built-in validator is
failing.

### Process-wide fallback

`configureGlobalFormNodes()` accepts `validatorMessages`, `classes`, and `syncInputs`.
Each option is a fallback below its nearest explicit Angular provider. Omitted options preserve
previous global settings; `null` resets that global option to the library default.
Configure binding defaults before bootstrap: existing bindings retain their class maps and
synchronization settings. Global messages and captured class predicates remain reactive.

For a shared fallback in an Angular browser application, call `configureGlobalFormNodes()`
in `main.ts`, before `bootstrapApplication()` (or before bootstrapping `AppModule`). Keep the catalog
in a separate data file and perform setup explicitly at the entry point; no initializer is needed
for a static catalog. See the [complete startup example](./configure-global-form-nodes.md#where-to-call-it).

Keep startup configuration active. The following fragment shows how to restore a temporary override:

```ts
const restoreMessages = configureGlobalFormNodes({
  validatorMessages: {
    required: 'This value is required.',
  },
});

// Restore the previous catalog when this temporary scope ends.
restoreMessages();
```

:::danger Do not mutate global messages per SSR request

The global catalog is process-wide. Request-specific locale or wording belongs in an Angular
provider or a form-scoped catalog so concurrent server renders cannot affect one another.
See [Validator messages and i18n](../guides/validator-messages.md).

:::

## Binding configuration

A shared NgModule can re-export `FormNode` while configuration stays in the application providers,
or install its own config through `SharedModule.providers`. See
[Using FormNode through SharedModule](./provide-form-nodes-config.md#using-formnode-through-sharedmodule)
for complete examples and an explanation of eager, lazy, and standalone injector scopes.

`provideFormNodesConfig()` configures custom-control input synchronization and automatic CSS classes for `[formNode]` bindings below the
closest Angular provider. Predicates run independently in reactive contexts:

```ts
provideFormNodesConfig({
  classes: {
    'is-touched': binding => binding.node().touched(),
    'is-invalid': binding => binding.node().invalid(),
  },
});
```

Use `ANGULAR_FORMS_STATUS_CLASSES` to opt into the familiar `ng-valid`, `ng-invalid`, `ng-pending`,
`ng-touched`, `ng-untouched`, `ng-dirty`, and `ng-pristine` classes:

```ts
import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

provideFormNodesConfig({
  classes: ANGULAR_FORMS_STATUS_CLASSES,
});
```

The preset is useful when migrating Angular Forms styles or integrating UI libraries that inspect
those class names. It is not required for `[formNode]` binding itself. Spread the preset into a new
object to add custom classes:

```ts
provideFormNodesConfig({
  classes: {
    ...ANGULAR_FORMS_STATUS_CLASSES,
    'is-readonly': binding => binding.node().readonly(),
  },
});
```

The `classes` and `syncInputs` options affect rendered bindings, not node state or validation.
Each option inherits independently. Providing `classes` replaces only the class map; providing
`syncInputs` changes only input synchronization. Omitting an option preserves its inherited
provider. Set an option to `null` to reset it: no classes, synchronization disabled, or an empty
provider message catalog with normal fallback. Class maps are not merged automatically. See
[Provider scope](./provide-form-nodes-config.md#provider-scope) for examples.

Angular's `provideSignalFormsConfig()` independently configures Angular `[formField]` controls.
The two providers use separate tokens and can coexist in the same injector. See
[`FormNode` binding configuration](./form-node-binding.md#automatic-css-classes).

## Injector ownership

`form()`, `field()`, `array()`, and `group()` remain safe outside Angular dependency injection. A
node first uses an explicit `injector` or the injector captured when it was created. Otherwise it
temporarily adopts the injector of a directly bound `[formNode]` host, then uses the nearest
injector on its parent chain by default. This means nodes produced later by array
templates and factories automatically belong to the array's Angular lifecycle. The effective
injector's `DestroyRef` owns asynchronous-validation watchers. Provider validator messages remain
the creation-time configuration of the node tree; rendering a node does not replace its catalog.

Set `adoptBindingInjector: false` to prevent a node from borrowing its directly bound host injector.
Set `inheritInjector: false` on any node to stop ancestor lookup there. The boundary also protects
otherwise injector-less descendants, while a descendant's own injector still takes precedence.
Moving a node transfers inherited ownership to its new tree; detaching it releases inherited
ownership. Binding injectors are revocable leases: rebinding or destroying a host cancels pending
work owned by that lease and falls back to another active binding, an ancestor, or weak ownership.
The first active binding remains selected until it is released. With no effective injector,
synchronous behavior and explicitly triggered async validation still work, and watcher ownership
remains weak so an unreachable node can be garbage-collected.

Pass an explicit injector when node creation happens later or outside the constructor but should
still belong to a known Angular lifecycle:

```ts
@Component({ ... })
export class ProfileEditor {
  private injector = inject(Injector);

  profileForm = form({
    displayName: field(''),
  }, {
    injector: this.injector,
  });
}
```

## Precedence at a glance

| Feature | Resolution rule |
| --- | --- |
| Validator messages | Local validator → nearest tree catalog → nearest provider catalog → global → built-in |
| Debounce | Closest node option; otherwise nearest configured ancestor; otherwise immediate |
| Disabled / readonly / hidden | Union of local imperative, local configured, and every inherited cause |
| Validators | Exact node only; `setValidators()` replaces that node's list |
| Binding CSS classes | Closest `provideFormNodesConfig()`; no automatic class-map merge |
| Nullability | Exact field declaration only |
| Submission | Exact form declaration only |
| Array identity | Exact array's `trackBy` only |

For runtime symptoms caused by configuration, see [Troubleshooting](../help/troubleshooting.md).


## Custom-control input synchronization

Optional custom-control input synchronization is experimental and disabled by default.
Use `syncInputs: true` for initial declarations or `'always'` for all supported state inputs.
Use `provideFormNodesConfig({ syncInputs: false })` when your component or template
should own inputs such as `disabled`, `readonly`, or `name`; value/checked bindings keep working.
Native controls and CVA `setDisabledState()` remain connected.
See [the simple example](../guides/custom-controls.md#keep-control-of-your-components-inputs)
and [all configuration details](./provide-form-nodes-config.md#custom-control-inputs).
