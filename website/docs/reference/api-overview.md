---
title: API overview
description: A task-oriented map of the Gem Forms public API and its detailed reference pages.
---

# API overview

Use this page to find the API that matches what you are trying to model or integrate. Import public
symbols from `@gem/ng-forms`; do not import internal files or deep package paths.

## Choose an API by task

| I want to… | Start with | Details |
| --- | --- | --- |
| Model one logical value | `field()` | [`field()` reference](./field.md) |
| Model a fixed object with independently addressable children | `form()` | [`form()` reference](./form.md) |
| Model a dynamic ordered collection of independent nodes | `array()` | [`array()` reference](./array.md) |
| Choose between a structured field, form, or array | — | [Choosing a primitive](../guides/choosing-a-primitive.md) |
| Add a built-in validation rule | `required`, `email`, `min`, and others | [Built-in validators](./built-in-validators.md) |
| Author a reusable synchronous rule | `validator()` | [Custom validator reference](./custom-validators.md) |
| Run Promise- or Observable-based validation | `asyncValidator()` | [`asyncValidator()` reference](./async-validator.md) |
| Bind a node to an Angular control | `FormNode` and `[formNode]` | [`FormNode` binding API](./form-node-binding.md) |
| Submit through a native `<form>` | `FormRootDirective` | [Form submission](../guides/submission.md) |
| Configure translated validator messages | `provideValidatorMessages()` | [Validator messages and i18n](../guides/validator-messages.md) |
| Add reactive status classes to every binding | `provideFormNodeConfig()` | [`FormNode` binding API](./form-node-binding.md#automatic-css-classes) |
| Integrate an unusual signal control | `provideFormNodeControl()` | [Custom controls](../guides/custom-controls.md) |
| Inspect the API shared by all nodes | `Node` and `NodeApi` | [Node API](./node-api.md) |

## Modeling primitives

### `field()`

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

Main exports: `field`, `Field`, `FieldApi`, and `FieldOptions`.

### `form()`

Creates a fixed object tree whose named children retain their exact node types. Plain nested objects
are shorthand for nested forms.

```ts
const myForm = form({
  displayName: field(''),
  address: {
    city: field(''),
    country: field(''),
  },
});
```

Main exports: `form`, `Form`, `FormApi`, `FormOptions`, `FormValue`, `FormSet`, `FormPatch`, and
`FormSubmissionOptions`.

### `array()`

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

## Validation

### Synchronous validation

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

### Asynchronous validation

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

### Validator messages

Message configuration follows this precedence, from highest to lowest:

1. Validator-local `message`.
2. Closest form or array `validatorMessages` catalog.
3. Closest `provideValidatorMessages()` provider.
4. `configureGlobalValidatorMessages()`.
5. Built-in English message.

Use provider or form scopes for request-specific SSR locales. Process-wide configuration is better
suited to non-Angular usage or one immutable application default.

## Angular integration

### `[formNode]`

Import `FormNode` into a standalone component and bind nodes directly:

```ts
@Component({
  imports: [FormNode],
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
and input/output control pairs. Its public query type exposes `node()`, `errors()`, `element`,
`injector`, `focus()`, `flush()`, and `reset()`.

Main exports: `FormNode`, `FormNodeBinding`, `FORM_NODE`, and `FormRootDirective`.

### Custom-control and binding configuration

| API | Purpose |
| --- | --- |
| `provideFormNodeConfig()` | Configures reactive CSS classes for descendant bindings. |
| `FORM_NODE_STATUS_CLASSES` | Optional Angular-style validity and interaction class preset. |
| `provideFormNodeControl()` | Explicitly registers a signal-based custom control. |
| `provideFormNodePassThrough()` | Marks a directive or host directive that delegates `formNode`. |
| `FormNodeValueControl<T>` | Signal control whose main model is `value`. |
| `FormNodeCheckboxControl` | Boolean signal control whose main model is `checked`. |

Most ordinary signal components and CVAs require no explicit provider. See
[Custom controls](../guides/custom-controls.md) before choosing a lower-level integration API.

## Shared node state

Every field, form, and array exposes common reactive state:

| Area | Main members |
| --- | --- |
| Value | Node call, `value()`, `controlValue()`, `set()`, `update()`, `reset()` |
| Validation | `errors()`, `allErrors()`, `getError()`, `valid()`, `invalid()`, `pending()` |
| Interaction | `touched()`, `dirty()`, their complements, and marking methods |
| Availability | `disabled()`, `readonly()`, `hidden()`, their complements, reasons, and actions |
| Tree | `form()`, `parent()`, `path()`, `keyInParent()` |
| Controls | `debouncing()`, `flush()`, `focus()` |

Call the node itself for its committed value and use direct members for normal application code.
Use `.api` for generic infrastructure or name collisions and `$api` only when a guaranteed
collision-safe path is required.

## Importing types

Use type-only imports when a symbol is used only by TypeScript:

```ts
import { field, form, FormNode } from '@gem/ng-forms';
import type { Field, FormValue, ValidationError } from '@gem/ng-forms';
```

`_FormNode` is framework infrastructure exported for Angular's compiler and linker. Applications
must use `FormNode` instead.

For behavioral details that are intentionally too specialized for the normal reference flow, see
[Advanced behavior and edge cases](../advanced/behavior-details.md).
