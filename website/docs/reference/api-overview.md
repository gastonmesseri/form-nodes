---
title: API overview
description: A task-oriented map of the Form Nodes public API and its detailed reference pages.
---

# API overview {#api-overview}

Use this page to find the API that matches what you are trying to model or integrate. Import public
symbols from `@ngblocks/form-nodes`; do not import internal files or deep package paths.

If you already have a concrete failure or unexpected state, use the symptom-oriented
[Troubleshooting guide](../help/troubleshooting.md).

## 🧭 Choose an API by task {#choose-an-api-by-task}

| I want to… | Start with | Details |
| --- | --- | --- |
| Model one logical value | `field()` | [`field()` reference](./field.md) |
| Type a node input or reusable utility | `AnyNode`, `DynamicNode`, or a concrete node type | [Node types reference](./node-types.md) |
| Organize unrelated standalone nodes without aggregate behavior | Plain JavaScript object | [Creating nodes](../concepts/creating-nodes.md#a-container-is-optional) |
| Define a submission workflow boundary | `form()` | [`form()` reference](./form.md) |
| Choose the default field nullability for an application | `createFormPrimitives()` | [`createFormPrimitives()` reference](./create-form-primitives.md) |
| Check an inferred aggregate against a named value model | `FormValueContract<TValue>` | [`FormValueContract` reference](./form-value-contract.md) |
| Extract the value type of any node | `FormNodeValue<typeof node>` | [`FormNodeValue` reference](./form-node-value.md) |
| Model a dynamic ordered collection of independent nodes | `array()` | [`array()` reference](./array.md) |
| Give an object branch its own options without creating a submission workflow | Explicit `group()` | [`group()` reference](./group.md) |
| Choose between a structured field, form, or array | — | [Choosing a primitive](../guides/choosing-a-primitive.md) |
| Design a large domain-oriented form tree | Modeling boundaries and lifecycle | [Form modeling patterns](../guides/form-modeling-patterns.md) |
| Add a built-in validation rule | `required`, `email`, `min`, and others | [Built-in validators](./built-in-validators.md) |
| Understand validation across every node | `validators`, errors, and status | [Validation reference](./validation.md) |
| Author a reusable synchronous rule | `validator()` | [`validator()` reference](./validator.md) |
| Run Promise- or Observable-based validation | `asyncValidator()` | [`asyncValidator()` reference](./async-validator.md) |
| Bind a node to an Angular control | `FormNodeDirective` and `[formNode]` | [`FormNodeDirective` binding API](./form-node-binding.md) |
| Submit through a native `<form>` | `FormNodeDirective` | [Form submission](../guides/submission.md) |
| Configure validator messages through Angular DI | `provideFormNodesConfig()` | [`provideFormNodesConfig()`](./provide-form-nodes-config.md) |
| Configure process-wide messages and binding defaults | `configureGlobalFormNodes()` | [`configureGlobalFormNodes()`](./configure-global-form-nodes.md) |
| Add reactive status classes to every binding | `provideFormNodesConfig()` | [`provideFormNodesConfig()`](./provide-form-nodes-config.md) |
| Inspect the API shared by all nodes | `AnyNode`, `DynamicNode`, and `NodeApi` | [Node API](./node-api.md) |
| Test a form model or Angular binding | Public node API and, when needed, `TestBed` | [Testing forms](../guides/testing.md) |
| Use Angular Material controls | `FormNodeDirective` with Material's normal modules | [Angular Material integration](../integrations/angular-material.md) |
| Use PrimeNG controls | `FormNodeDirective` with PrimeNG's normal modules | [PrimeNG integration](../integrations/primeng.md) |

## 🧩 Modeling primitives {#modeling-primitives}

### ◆ field() {#field}

Creates one leaf node. Its value can be a string, number, date, object, array, or any other
application type. Fields are nullable by default.

```ts
const myForm = form({
  displayName: field(''),
  birthDate: field<Date>(),
  selectedRoles: field<string[]>([]),
});
```

An array-valued field is appropriate when one control owns the complete array, such as a
multi-select. It intentionally has no per-item nodes or structural operations.

Main exports: `field`, `FieldNode`, `FieldApi`, and `FieldOptions`.

Use `createFormPrimitives({ nullable: false })` to obtain application-scoped factories whose fields and
shorthands are non-nullable by default. Explicit field options always take precedence.

### ◆ form() {#form}

Creates the typed object tree that owns a submission workflow. It has the same structural behavior
as a group plus `onSubmit` configuration and `submit()`. Root application workflows normally
start with `form()`; explicit nested forms are reserved for independent subflows.

Values such as `name: ''`, `age: 23`, `birthday: new Date()`, `value: null`, `value: undefined`,
and `roles: ['admin']` are concise field definitions. Object literals remain group definitions.
An array value always becomes a field; only an explicit `array(...)` creates a dynamic collection
of item nodes. Ordinary functions and non-plain object instances become concise fields too.

Main exports: `form`, `FormNode`, `FormApi`, `FormOptions`, `FormValue`, `FormNodeValue`, `FormValueContract`, `FormSet`,
`FormPatch`.

### ◆ array() {#array}

Creates a dynamic collection by cloning one node template or invoking a factory. Use it when items
need independent bindings, paths, validation, interaction state, or structural operations.

```ts
const myForm = form({
  contacts: array({
    label: field(''),
    email: field(''),
  }, 2),
});
```

Main exports: `array`, `ArrayNode`, `ArrayApi`, `ArrayOptions`, `ArrayValue`, `ArraySet`,
`ArrayPatch`, `ArrayItems`, `ArrayIndexes`, and `ArrayItemWithParent`.

### ◆ Explicit group() {#explicit-group}

Plain nested objects already create structural groups and are the preferred way to model ordinary
fixed branches:

```ts
const myForm = form({
  displayName: field(''),
  address: {
    city: field(''),
    country: field(''),
  },
});
```

Use explicit `group({...}, options)` only when an object branch needs its own aggregate validators,
state options, or message configuration without becoming a submission workflow. Main exports:
`group`, `GroupNode`, `GroupApi`, `GroupOptions`, `GroupValue`, `GroupSet`, and `GroupPatch`.

## ✅ Validation {#validation}

### ◆ Synchronous validation {#synchronous-validation}

Pass built-in or custom validators to any node. `validator<TValue>()` supplies an explicit reusable
authoring type but does not wrap or alter the callback at runtime.

```ts
const positive = validator<number | null>(({ value }) => {
  const number = value();

  return number !== null && number <= 0
    ? { kind: 'positive', actual: number }
    : null;
});

const myForm = form({
  quantity: field<number>(null, [required, positive]),
});
```

Frequently used types include `ValidationError`, `ValidationResult`, `ValidationStatus`,
`ValidatorContext`, `ValidatorSource`, `Validators`, and the extensible `ValidationErrorMap`.

### ◆ Asynchronous validation {#asynchronous-validation}

`asyncValidator()` marks asynchronous work explicitly so the node owns pending state, debounce,
cancellation, dependency tracking, and stale-result protection.

```ts
const myForm = form({
  username: field('', [
    asyncValidator(({ value, abortSignal }) => {
      return checkUsername(value(), abortSignal).then(available =>
        available ? null : { kind: 'usernameTaken' },
      );
    }, {
      debounce: 300,
    }),
  ]),
});
```

Related types include `AsyncValidator`, `AsyncValidatorContext`, `AsyncValidatorOptions`,
`ParameterizedAsyncValidatorConfig`, and `ParameterizedAsyncValidatorContext`.

### ◆ Validator messages {#validator-messages}

Message configuration follows this precedence, from highest to lowest:

1. Validator-local `message`.
2. Closest form or array `validatorMessages` catalog.
3. Closest `createFormPrimitives()` validator-message default.
4. Closest `provideFormNodesConfig()` provider.
5. `configureGlobalFormNodes()`.
6. Built-in English message.

Use provider or form scopes for request-specific SSR locales. Process-wide configuration is better
suited to non-Angular usage or one immutable application default.

```ts
const restoreMessages = configureGlobalFormNodes({
  validatorMessages: {
    required: 'This value is required.',
    min: ({ min }) => `The minimum value is ${min}.`,
  },
});

// Restore the previous global catalog when a temporary scope ends.
restoreMessages();
```

In an Angular application, use `provideFormNodesConfig()` when the catalog should follow an
application, route, environment injector, or SSR request scope:

```ts
provideFormNodesConfig({
  validatorMessages: () => ({
    required: () => translations().required,
  }),
});
```

## 🔌 Angular integration {#angular-integration}

### ◆ [formNode] {#formnode}

Import `FormNodeDirective` into a standalone component and bind nodes directly:

```ts
@Component({
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="myForm.displayName" />
  `,
})
export class ProfileEditor {
  myForm = form({
    displayName: field(''),
  });
}
```

The binding supports native controls, `ControlValueAccessor`, Angular-compatible signal models,
and input/output control pairs (the latter require experimental `bindInputOutputPairs: true`). Its public query type exposes `node()`, `errors()`, `element`,
`injector`, `focus()`, `flush()`, and `reset()`.

Main exports: `FormNodeDirective`, `FormNodeBinding`, and [`FORM_NODE`](./form-node-token.md). One `FormNodeDirective` import supports native controls, custom controls, and native form roots.

### ◆ Custom-control and binding configuration {#custom-control-and-binding-configuration}

| API | Purpose |
| --- | --- |
| `provideFormNodesConfig()` | Configures validator messages, custom-control inputs, and reactive CSS classes. |
| [`ANGULAR_FORMS_STATUS_CLASSES`](./angular-forms-status-classes.md) | Optional Angular Forms-compatible validity and interaction class preset. |
| [`provideFormNodePassThrough()`](./provide-form-node-pass-through.md) | Marks a directive or host directive that delegates `formNode`. |
| `FormNodeValueControl<T>` | Signal control whose main model is `value`. |
| `FormNodeCheckboxControl` | Boolean signal control whose main model is `checked`. |
| `useFormNodeState<T>()` | Reads normalized state from `[formNode]`, `[formField]`, `[formControl]`, `formControlName`, or `ngModel`. |
| `ControlState<T>` | Source-neutral signal facade returned by `useFormNodeState()`. |
| `ControlStateDisabledReason` | Source-neutral disabled reason containing an optional message. |

See the [`useFormNodeState()` reference](./form-node-state.md) for its complete signal surface,
source precedence, normalization rules, lifecycle, and examples for every supported binding API.

Configure binding classes once in the application providers for the common application-wide case:

```ts
import type { ApplicationConfig } from '@angular/core';
import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      classes: ANGULAR_FORMS_STATUS_CLASSES,
    }),
  ],
};
```

The configuration applies to `[formNode]` bindings created
below that injector. Put the same provider in a route, component, or NgModule `providers` array when
only that subtree should use it; the nearest provider wins. No automatic classes are installed
unless this provider is configured.

Most ordinary signal components and CVAs require no explicit provider. See
[Custom controls](../guides/custom-controls.md) before choosing a lower-level integration API.

## ⚡ Shared node state {#shared-node-state}

Every field, form, and array exposes common reactive state:

| Area | Main members |
| --- | --- |
| Value | Node call, `value()`, `value.control()`, `set()`, `update()`, `reset()` |
| Validation | `errors()`, `allErrors()`, `getError()`, `valid()`, `invalid()`, `pending()` |
| Interaction | `touched()`, `dirty()`, their complements, and marking methods |
| Availability | `disabled()`, `readonly()`, `hidden()`, their complements, reasons, and actions |
| Tree | `form()`, `root()`, `parent()`, `path()`, `keyInParent()`, and object-node `add()`, `get()`, `remove()` |
| Controls | `debouncing()`, `flush()`, `focus()` |

Call the node itself for its committed value and use direct members for normal application code.
Use `.$api` for generic infrastructure or child-name collisions.

## 📐 Importing types {#importing-types}

Use type-only imports when a symbol is used only by TypeScript:

```ts
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';
import type { FieldNode, FormValue, ValidationError } from '@ngblocks/form-nodes';
```

`_FormNode` is framework infrastructure exported for Angular's compiler and linker. Applications
must use `FormNodeDirective` instead.

For behavioral details that are intentionally too specialized for the normal reference flow, see
[Advanced behavior and edge cases](../advanced/behavior-details.md).

## Submission context

[useClosestForm()](./use-closest-form.md) finds the owning form through the nearest injectable
`[formNode]` binding. Observe [submitted()](./form.md#submitted) for attempts since reset and
`submitting()` for an action currently in progress.

See [Public types](./types/index.md) for every exported type alias and interface. For integration workflows, start with [custom control contracts](./custom-control-contracts.md) or [validation error types](./validation-errors.md).
