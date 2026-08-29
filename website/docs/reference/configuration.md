---
title: Configuration
description: Configuration scopes, reactivity, precedence, inheritance, and Angular providers in Gem Forms.
---

# Configuration

The [reactive configuration example](../examples/executable-examples.mdx#reactive-configuration-and-precedence)
is compiled and executed to verify message precedence and inherited state.

Gem Forms keeps configuration close to the feature it affects. Node options configure one node or
tree, Angular providers configure an injector scope, and the process-wide API supplies only a
fallback validator-message catalog.

## Configuration map

| Scope | API | Affects | Reactive |
| --- | --- | --- | --- |
| Validator call | `{ message }` | That validator instance | Message functions are reactive |
| Node or subtree | `field()`, `group()`, `form()`, and `array()` options | The declared node; selected options inherit | Function sources are reactive |
| Angular injector | `provideValidatorMessages()` | Nodes created in that injector scope | Selected message functions are reactive |
| Angular injector | `provideFormNodeConfig()` | Descendant `[formNode]` bindings | Class predicates are reactive |
| JavaScript process | `configureGlobalValidatorMessages()` | Fallback for every node | Catalog sources and selected messages are reactive |

There is currently no process-wide API that changes defaults such as nullability, debounce,
disabled state, or validators. Configure those decisions explicitly at the appropriate node or
ancestor.

### Find configuration by concern

| Concern | Details |
| --- | --- |
| Validators, nullability, state, and debounce | [Node options](#node-options) |
| Message catalogs and exact precedence | [Validator-message configuration](#validator-message-configuration) |
| Application, route, feature, or SSR scopes | [Angular application scope](#angular-application-scope) |
| One form subtree | [Form-tree scope](#form-tree-scope) |
| Non-Angular or process-wide defaults | [Process-wide fallback](#process-wide-fallback) |
| Reactive classes on rendered controls | [`[formNode]` binding configuration](#formnode-binding-configuration) |
| Async watcher cleanup and explicit injectors | [Injector ownership](#injector-ownership) |
| One consolidated resolution table | [Precedence at a glance](#precedence-at-a-glance) |

## Node options

### Options shared by nodes

| Option | `field()` | `group()` | `form()` | `array()` | Inheritance |
| --- | --- | --- | --- | --- | --- |
| `validators` | Yes | Yes | Yes | Yes | No; validates that exact node |
| `injector` | Yes | Yes | Yes | Yes | No; owns that node's async watcher and captures provider messages |
| `debounce` | Yes | Yes | Yes | Yes | Yes; nearest configured node wins for descendants |
| `hidden` | Yes | Yes | Yes | Yes | Effective state propagates through descendants |
| `disabled` | Yes | Yes | Yes | Yes | Effective state propagates through descendants |
| `readonly` | Yes | Yes | Yes | Yes | Effective state propagates through descendants |

`group()`, `form()`, and `array()` additionally accept `validatorMessages`. Only a form accepts `submission`.
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

Validators belong to the exact node where they are declared; they do not inherit. A form or array
validator receives the complete aggregate value, while descendant validators continue to own
their own errors:

```ts
const profileForm = form({
  displayName: field('', [required]),
}, {
  validators: [profilePolicy],
});
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
  displayName: field(''),                         // string | null
  countryCode: field('CH', { nullable: false }), // string
});
```

`form()` and `array()` are permanent structural containers and are not nullable. Individual array
items remain as nullable as their template permits. See [Choosing a primitive](../guides/choosing-a-primitive.md).

### Form submission

`submission` belongs to the form on which it is declared and is not inherited as another form's
action:

```ts
const profileForm = form({
  displayName: field(''),
}, {
  submission: {
    action: (_form, value) => saveProfile(value),
    onInvalid: formNode => formNode.focus(),
    ignoreValidators: 'pending',
  },
});
```

`ignoreValidators` accepts `'pending'`, `'none'`, or `'all'`. See
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
3. The closest captured `provideValidatorMessages()` catalog, walking toward the root.
4. `configureGlobalValidatorMessages()`.
5. The built-in English message.

Missing catalog entries and callbacks returning `undefined` continue to the next layer. A nested
catalog therefore overrides individual keys without having to repeat every message.

### Angular application scope

Register provider configuration in `ApplicationConfig` for a standalone Angular application:

```ts
import { ApplicationConfig, inject } from '@angular/core';
import { provideFormNodeConfig, provideValidatorMessages } from '@gem/ng-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideValidatorMessages(() => {
      const translations = inject(TranslationService);

      return {
        required: () => translations.translate('validation.required'),
      };
    }),
    provideFormNodeConfig({
      classes: {
        'is-invalid': binding => binding.node().invalid(),
      },
    }),
  ],
};
```

`provideValidatorMessages()` can also be registered in a route or another environment injector.
Nodes capture the nearest applicable catalog when created. Angular provider catalogs are not
merged automatically: a missing entry can continue to a different catalog captured by an ancestor
node, then to the global and built-in fallbacks. Use a closer provider for a route, feature, or SSR
request scope and include every override required by that injector scope.

For an NgModule application, place the same provider calls in the module's `providers` array.

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

Outside Angular, or for one immutable application default, configure the global catalog:

```ts
const restoreMessages = configureGlobalValidatorMessages({
  required: 'This value is required.',
});

// Restore the previous catalog when this temporary scope ends.
restoreMessages();
```

This is shared module state. Do not change it per SSR request; concurrent requests must use scoped
Angular providers or form catalogs. See [Validator messages and i18n](../guides/validator-messages.md).

## `[formNode]` binding configuration

`provideFormNodeConfig()` configures automatic CSS classes for bindings below the closest Angular
provider. Predicates run independently in reactive contexts:

```ts
provideFormNodeConfig({
  classes: {
    'is-touched': binding => binding.node().touched(),
    'is-invalid': binding => binding.node().invalid(),
  },
});
```

Use `FORM_NODE_STATUS_CLASSES` to opt into the familiar `ng-valid`, `ng-invalid`, `ng-pending`,
`ng-touched`, `ng-untouched`, `ng-dirty`, and `ng-pristine` classes:

```ts
provideFormNodeConfig({
  classes: FORM_NODE_STATUS_CLASSES,
});
```

This provider affects rendered bindings, not node state or validation. A closer
`provideFormNodeConfig()` supplies that binding scope's complete config; class maps are not merged
automatically. See [`FormNode` binding configuration](./form-node-binding.md#automatic-css-classes).

## Injector ownership

`form()`, `field()`, and `array()` remain safe outside Angular dependency injection. When a node is
created in an injection context, or receives an explicit `injector`, that injector supplies scoped
validator messages and its `DestroyRef` owns asynchronous-validation watchers. Outside dependency
injection, synchronous behavior and explicitly triggered async validation still work, and watcher
ownership remains weak so an unreachable node can be garbage-collected.

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
| Binding CSS classes | Closest `provideFormNodeConfig()`; no automatic class-map merge |
| Nullability | Exact field declaration only |
| Submission | Exact form declaration only |
| Array identity | Exact array's `trackBy` only |

For runtime symptoms caused by configuration, see [Troubleshooting](../help/troubleshooting.md).
