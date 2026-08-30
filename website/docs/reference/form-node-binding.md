---
title: FormNode binding API
---

# `FormNode` and control-binding APIs

`FormNode` is the standalone Angular directive imported by components to make `[formNode]`
available. The same symbol is also the public generic type returned by binding queries.

```ts
import { Component, viewChild } from '@angular/core';

import { field, form, FormNode } from '@gem/ng-forms';

@Component({
  imports: [FormNode],
  template: `
    <input #emailBinding="formNode" [formNode]="myForm.email" />
  `,
})
export class EmailEditor {
  myForm = form({
    email: field(''),
  });

  emailBinding = viewChild.required<FormNode<typeof this.myForm.email>>('emailBinding');
}
```

Import neither `_FormNode` nor internal package paths. `_FormNode` is exported only for Angular AOT
and linker infrastructure.

## API map

| I want to… | Start with | Details |
| --- | --- | --- |
| Query or inspect one concrete binding | `FormNode<TNode>`, `FormNodeBinding<TNode>` | [Binding instance](#binding-instance) |
| Inject the binding on its host | `FORM_NODE` | [`FORM_NODE`](#form_node) |
| Apply reactive CSS classes | `provideFormNodeConfig()` | [Automatic CSS classes](#automatic-css-classes) |
| Adapt an unusual signal component | `provideFormNodeControl()` | [Custom-control registration](#custom-control-registration) |
| Delegate through a wrapper | `provideFormNodePassThrough()` | [Pass-through wrappers](#pass-through-wrappers) |
| Bind submit and reset on `<form>` | The same `FormNode` import | [Native form submission](#native-form-submission) |

## Binding instance

| Member | Description |
| --- | --- |
| `node()` | Reactive reference to the node currently bound to the host. |
| `errors()` | Node errors visible to this binding, excluding errors owned by another concrete binding. |
| `element` | Host `HTMLElement`. |
| `injector` | Injector belonging to the host element. |
| `focus(options?)` | Focuses this concrete native or custom control. |
| `flush()` | Commits pending control-originated values for the bound node. |
| `reset()` | Resets node interaction state and control-specific parsing state. |

`FormNodeBinding<TNode>` is the structural version of this instance type for provider callbacks and
generic configuration code.

## `FORM_NODE`

`FORM_NODE` is the injection token for the binding on the current host. Most application code uses
a template reference and `viewChild()` instead. Inject the token only when a directive or service
co-located with the host genuinely needs the concrete binding.

## Automatic CSS classes

For the common application-wide setup, register `provideFormNodeConfig()` in the standalone
application configuration. The same predicates apply to `[formNode]` and to `[formField]` controls
whose field comes from a Gem Forms node's `$field`:

```ts
import type { ApplicationConfig } from '@angular/core';

import { provideFormNodeConfig } from '@gem/ng-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodeConfig({
      classes: {
        'is-invalid': binding => binding.node().$api.invalid(),
        'is-touched': binding => binding.node().$api.touched(),
      },
    }),
  ],
};
```

Each predicate tracks its own signal dependencies independently. The nearest provider applies.
Register the provider in a route, component, or NgModule instead when the configuration should
apply only to that injector subtree.

`ANGULAR_FORMS_STATUS_CLASSES` is an optional compatibility preset for applications, component
libraries, and existing styles that expect Angular Forms status classes. It maps the node's reactive
state to the following classes:

| Node state | Applied class |
| --- | --- |
| Valid | `ng-valid` |
| Invalid | `ng-invalid` |
| Async validation in progress | `ng-pending` |
| Pristine | `ng-pristine` |
| Dirty | `ng-dirty` |
| Untouched | `ng-untouched` |
| Touched | `ng-touched` |

Opposite classes are updated together as state changes. For example, a binding moves from
`ng-pristine` to `ng-dirty`; it does not retain both classes. No status classes are installed by
default, so applications that do not need Angular-compatible CSS incur no class-management work.

```ts
import type { ApplicationConfig } from '@angular/core';

import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodeConfig } from '@gem/ng-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodeConfig({
      classes: ANGULAR_FORMS_STATUS_CLASSES,
    }),
  ],
};
```

The preset is an ordinary class map. Spread it when Angular-compatible classes and application
classes should coexist:

```ts
provideFormNodeConfig({
  classes: {
    ...ANGULAR_FORMS_STATUS_CLASSES,
    'has-visible-error': binding => binding.node().invalid() && binding.node().touched(),
  },
});
```

These classes reflect state only. Adding or removing them does not change validation, interaction
state, or submission behavior.

`provideFormNodeConfig()` uses Angular's Signal Forms configuration internally for adapted
`[formField]` controls. Do not combine it with `provideSignalFormsConfig({ classes })` in the same
injector because Angular's config token is not multi and the last provider would replace the first.
Angular `[formField]` controls backed by ordinary Angular field trees do not receive Gem Forms class
predicates.

Conversely, an existing `provideSignalFormsConfig({ classes })` works normally with
`[formField]="node.$field"` without any Gem Forms configuration. Its callbacks receive Angular's
`FormFieldBinding` and can read `binding.state()`. Choose this when the application wants one Angular
class map for both adapted and native Angular field trees; choose `provideFormNodeConfig()` when the
same `FormNodeBinding` callbacks should work with both `[formNode]` and adapted `[formField]`.

## Custom-control registration

Components exposing `value = model<T>()`, `checked = model<boolean>()`, compatible input/output
pairs, or a CVA are normally discovered automatically.

Use `provideFormNodeControl()` when a custom control should register its signal contract explicitly
instead of relying on compiled component-metadata discovery. This is also the supported discovery
path for directive and host-directive controls, because `getDebugNode()` does not expose arbitrary
directive instances. The provider belongs to the custom control itself:

```ts
import { Component, input, model, output } from '@angular/core';

import { FormNode, field, form, provideFormNodeControl, type FormNodeValueControl } from '@gem/ng-forms';

@Component({
  selector: 'app-date-picker',
  providers: [provideFormNodeControl(() => DatePicker)],
  template: `
    <input
      type="date"
      [value]="value() ?? ''"
      [disabled]="disabled()"
      (input)="select($any($event.target).value)"
      (blur)="touch.emit()"
    >
  `,
})
export class DatePicker implements FormNodeValueControl<string | null> {
  value = model<string | null>(null);
  disabled = input(false);
  touch = output<void>();

  select(value: string) {
    this.value.set(value || null);
  }
}

@Component({
  selector: 'app-appointment-editor',
  imports: [FormNode, DatePicker],
  template: `
    <app-date-picker [formNode]="appointmentForm.date" />
    <p>Selected date: {{ appointmentForm.date() ?? 'None' }}</p>
  `,
})
export class AppointmentEditor {
  appointmentForm = form({
    date: field<string | null>(null),
  });
}
```

`[formNode]` initializes `value`, receives subsequent `value` changes, supplies `disabled`, and
marks the field touched when the component emits `touch`. Consumers use the component exactly like
any automatically discovered custom control; they do not repeat the provider.

The related public types are:

| Type | Purpose |
| --- | --- |
| `FormNodeValueControl<T>` | Signal control whose primary model is `value`. |
| `FormNodeCheckboxControl` | Boolean signal control whose primary model is `checked`. |
| `FormNodeControl<T>` | Union of recognized value and checkbox control contracts. |
| `FormNodeUiControl<T>` | Common optional UI state and node-integration surface. |

`FORM_NODE_CONTROL` is the low-level injection token populated by the provider. Prefer the provider
function over creating the token binding manually.

## Pass-through wrappers

A component with a public `formNode` input can delegate the node to an inner control and is detected
automatically. A directive or host directive doing the same must install
`provideFormNodePassThrough()` so the outer `[formNode]` remains passive:

```ts
@Directive({
  providers: [provideFormNodePassThrough()],
})
export class FormNodeWrapperDirective {}
```

## Native form submission

Use `FormNode` as the single root binding. Its controls may use either `[formNode]` or Angular's
`[formField]` adapter:

```ts
import { Component } from '@angular/core';
import { FormField } from '@angular/forms/signals';

import { FormNode, field, form } from '@gem/ng-forms';

@Component({
  imports: [FormNode, FormField],
  template: `
    <form [formNode]="myForm">
      <input [formField]="myForm.email.$field" />
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>
  `,
})
export class EmailEditor {
  myForm = form({
    email: field(''),
  }, {
    submission: {
      action: (_form, value) => save(value),
    },
  });
}
```

On a native `<form>`, the directive prevents native navigation and applies `novalidate`. A bound
`form()` delegates submit to `form.submit()`. A bound `group()` is also accepted: submit marks and
flushes its tree without running an action. Native reset delegates to either node's `reset()`.
Fields and arrays remain invalid native-form roots.
Do not combine `[formNode]` with Angular's separate form-root directive on the same element.

See [Control binding](../guides/control-binding.md), [Custom controls](../guides/custom-controls.md),
and [Form submission](../guides/submission.md).
