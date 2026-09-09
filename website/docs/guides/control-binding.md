---
title: Control binding
---

import CodeBlock from '@theme/CodeBlock';
import nativeRadioSource from '!!raw-loader!../../examples/native-radio-binding.typecheck.ts';

# Control binding {#control-binding}

The [type-checked Angular example](../examples/executable-examples.mdx#angular-binding-and-viewchild)
covers the standalone directive import, `[formNode]`, `FormNodeDirective`, and `viewChild.required()`.

Import `FormNodeDirective` and bind a node with `[formNode]`:

```ts
import { Component } from '@angular/core';
import { FormNodeDirective, field } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `<input [formNode]="name" />`,
})
export class Editor {
  name = field('');
}
```

It supports native `input`, `select`, and `textarea` elements, Angular `ControlValueAccessor`
components, `value = model<T>()` controls, and `checked = model<boolean>()` checkbox controls. Native controls bind scalar `field()` nodes; aggregate forms and
arrays require a custom control that represents their complete value. Separate input/output pairs
are also available through [experimental `bindInputOutputPairs`](./custom-controls.md#separate-input-output-pairs). See
[Advanced custom controls](./custom-controls-advanced.md#angular-api-compatibility) for the complete compatibility
matrix and integration boundaries.

## 🔌 Native controls {#native-controls}

The directive synchronizes value, disabled, readonly, required, name, and applicable constraint state. DOM input updates use `value.control.set()`, mark the field dirty, and follow its debounce. Blur marks it touched.

```html
<input [formNode]="profile.name" />
<input type="number" [formNode]="profile.age" />
<select [formNode]="profile.country">
  <option value="ch">Switzerland</option>
  <option value="es">Spain</option>
</select>
```

Native support includes text and numeric inputs, range, checkbox, radio, date-like inputs, single and multiple selects, and textareas. IME composition is buffered until `compositionend`. Dynamically changing between compatible textual input types preserves synchronization.

Bindings receive a stable generated `name` based on the application, structural root, and reactive path. Controls bound to the same field share a name, preserving radio groups; moving an array item updates that path-derived name. An explicitly authored native name is replaced.

Select values are reapplied when options change, including asynchronously rendered options. Radio bindings reevaluate their authored option value after Angular renders.

### 🔸 Radio buttons {#radio-buttons}

Bind every radio in a group to the same field and give each option a distinct string `value`.
The field's initial value selects the matching option. `[formNode]` generates the shared `name`,
so you do not need to set `name` or `checked` yourself.

<CodeBlock language="ts">{nativeRadioSource}</CodeBlock>

Standard delivery starts selected. Selecting Express delivery updates `checkout.delivery()`
to `'express'` and updates the displayed selection. The labels make each option clickable,
and the `fieldset` and `legend` identify the group.

## ✅ Native constraints {#native-constraints}

`required`, `aria-invalid`, `min`, `max`, `minLength`, `maxLength`, and combined pattern metadata are synchronized when applicable:

- Numeric and date `min`/`max` are written to number, range, date, and month inputs.
- `minLength` and `maxLength` apply to inputs and textareas, not selects.
- Multiple pattern validators become one native pattern requiring every expression.
- Node validation remains authoritative; browser constraints improve native UI interoperability.
- Time, week, and datetime-local currently do not receive `min`/`max`, matching Angular 22 Signal Forms behavior.

Invalid native numeric or date input produces a `parse` error while retaining the last valid model value and the user's raw text. A later valid input, programmatic update, reset, rebind, or binding destruction clears the binding-owned parse error.

## 🔌 Querying the binding {#querying-the-binding}

Export the directive and query it with Angular's signal-based `viewChild()`:

```ts
import { Component, viewChild } from '@angular/core';
import { FormNodeDirective, field } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `<input #nameBinding="formNode" [formNode]="name" />`,
})
export class Editor {
  name = field('');
  readonly nameBinding = viewChild.required<FormNodeDirective<typeof this.name>>('nameBinding');

  focusName() {
    this.nameBinding().focus();
  }
}
```

The public binding exposes `node()`, `errors()`, `element`, `injector`, `focus()`, `flush()`, and `reset()`.

## 👆 Focus {#focus}

Every node also exposes `focus(options?)`. A field focuses its first binding in DOM order; a form or array searches its current subtree. Calling it without a rendered binding is a no-op.

```ts
profile.name.focus();
profile.focus();
```

## ⚡ Status classes {#status-classes}

If your application uses a shared NgModule, it can import and re-export `FormNodeDirective`. Configure
bindings in either the application providers or `SharedModule.providers`, according to who owns
the convention. See [Using FormNodeDirective through SharedModule](../reference/provide-form-nodes-config.md#using-formnode-through-sharedmodule)
for complete examples of both approaches and their injector scopes.

Configure reactive classes once in the standalone application providers:

```ts
import type { ApplicationConfig } from '@angular/core';
import { provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      classes: {
        'is-invalid': binding => binding.node().$api.invalid(),
        'is-touched': binding => binding.node().$api.touched(),
        'is-pending': binding => binding.node().$api.pending(),
      },
    }),
  ],
};
```

The configuration applies to `[formNode]` bindings below that injector. Routes and components can
provide a more local configuration. An NgModule provider's scope depends on how that module is
loaded: an eagerly imported root module does not create an isolated configuration scope.
The nearest provider wins, and each predicate tracks only the signals it reads. Angular's `provideSignalFormsConfig()` independently configures
Angular `[formField]` controls; both providers can coexist.

Use the optional preset when application styles or a UI library expect Angular Forms status
classes. `[formNode]` does not require the preset:

```ts
import type { ApplicationConfig } from '@angular/core';
import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({ classes: ANGULAR_FORMS_STATUS_CLASSES }),
  ],
};
```

It adds `ng-valid`/`ng-invalid`, `ng-pending`, `ng-pristine`/`ng-dirty`, and
`ng-untouched`/`ng-touched`. The classes update reactively with the bound node and do not alter its
state. No status classes are installed by default. See
[`ANGULAR_FORMS_STATUS_CLASSES`](../reference/form-node-binding.md#automatic-css-classes) for the
complete mapping and extension example.

## 🔌 Hidden controls {#hidden-controls}

`hidden()` is form state and does not alter DOM visibility. Remove hidden controls in the template with `@if`. Development builds warn when a hidden node remains rendered.

## 💡 Server rendering and hydration {#server-rendering-and-hydration}

Initial native and custom-control state renders on the server. Browser-only observation is deferred until the browser, and hydration reuses the rendered controls while reconnecting events and reactive state.

See [Custom controls](./custom-controls.md) for component integration.
For multiple bindings, control-owned error filtering, accessor precedence, and SSR edge cases, see
[Advanced behavior and edge cases](../advanced/behavior-details.md#multiple-bindings-and-control-owned-errors).
The [`FormNodeDirective` binding reference](../reference/form-node-binding.md) lists its instance API,
configuration providers, control contracts, pass-through registration, and native form directive.

## Receiving control edits

Prefer `(formNodeValueChange)` when reacting to an updated node value, or
`(formNodeControlValueChange)` for the immediate draft before debounce. Both work across native
controls, CVAs, signal controls, and enabled input/output pairs, so consumers do not need to select
a native `input` or `change` event for each control type. See the
[value output reference](../reference/form-node-binding.md#value-outputs) for a complete component
example and the control-originated event contract.
