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
application configuration:

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

`FORM_NODE_STATUS_CLASSES` is an optional preset containing Angular-style validity, pending, dirty,
pristine, touched, and untouched classes. No classes are installed by default.

```ts
import type { ApplicationConfig } from '@angular/core';

import { FORM_NODE_STATUS_CLASSES, provideFormNodeConfig } from '@gem/ng-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodeConfig({
      classes: FORM_NODE_STATUS_CLASSES,
    }),
  ],
};
```

## Custom-control registration

Components exposing `value = model<T>()`, `checked = model<boolean>()`, compatible input/output
pairs, or a CVA are normally discovered automatically.

Use `provideFormNodeControl()` when an unusual component or directive must register its control
contract explicitly:

```ts
@Component({
  selector: 'app-date-picker',
  providers: [provideFormNodeControl(() => DatePicker)],
  template: `...`,
})
export class DatePicker implements FormNodeValueControl<Date | null> {
  value = model<Date | null>(null);
}
```

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

Import `FormRoot` alongside `FormNode` when binding a root node to a native form:

```ts
@Component({
  imports: [FormNode, FormRoot],
  template: `
    <form [formNode]="myForm">
      <input [formNode]="myForm.email" />
      <button type="submit">Save</button>
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

The directive prevents native navigation, applies `novalidate`, calls `submit()` on submit, and
maps native reset events to `form.reset()`.

See [Control binding](../guides/control-binding.md), [Custom controls](../guides/custom-controls.md),
and [Form submission](../guides/submission.md).
