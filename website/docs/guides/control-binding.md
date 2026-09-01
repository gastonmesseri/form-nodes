---
title: Control binding
---

# Control binding

The [type-checked Angular example](../examples/executable-examples.mdx#angular-binding-and-viewchild)
covers the standalone directive import, `[formNode]`, `FormNode`, and `viewChild.required()`.

Import `FormNode` and bind a node with `[formNode]`:

```ts
import { Component } from '@angular/core';
import { FormNode, field } from '@gem/ng-forms';

@Component({
  imports: [FormNode],
  template: `<input [formNode]="name" />`,
})
export class Editor {
  name = field('');
}
```

It supports native `input`, `select`, and `textarea` elements, Angular `ControlValueAccessor`
components, `value = model<T>()` controls, `checked = model<boolean>()` checkbox controls, and
equivalent input/output pairs. Native controls bind scalar `field()` nodes; aggregate forms and
arrays require a custom control that represents their complete value. See
[Custom controls](./custom-controls.md#angular-api-compatibility) for the complete compatibility
matrix and integration boundaries.

## Native controls

The directive synchronizes value, disabled, readonly, required, name, and applicable constraint state. DOM input updates use `setControlValue()`, mark the field dirty, and follow its debounce. Blur marks it touched.

```html
<input [formNode]="profile.name" />
<input type="number" [formNode]="profile.age" />
<select [formNode]="profile.country">
  <option value="ch">Switzerland</option>
  <option value="es">Spain</option>
</select>
```

Native support includes text and numeric inputs, range, checkbox, radio, date-like inputs, single and multiple selects, and textareas. IME composition is buffered until `compositionend`. Dynamically changing between compatible textual input types preserves synchronization.

Bindings receive a stable generated `name` based on the application, root form, and reactive path. Controls bound to the same field share a name, preserving radio groups; moving an array item updates that path-derived name. An explicitly authored native name is replaced.

Select values are reapplied when options change, including asynchronously rendered options. Radio bindings reevaluate their authored option value after Angular renders.

## Native constraints

`required`, `aria-invalid`, `min`, `max`, `minLength`, `maxLength`, and combined pattern metadata are synchronized when applicable:

- Numeric and date `min`/`max` are written to number, range, date, and month inputs.
- `minLength` and `maxLength` apply to inputs and textareas, not selects.
- Multiple pattern validators become one native pattern requiring every expression.
- Node validation remains authoritative; browser constraints improve native UI interoperability.
- Time, week, and datetime-local currently do not receive `min`/`max`, matching Angular 22 Signal Forms behavior.

Invalid native numeric or date input produces a `parse` error while retaining the last valid model value and the user's raw text. A later valid input, programmatic update, reset, rebind, or binding destruction clears the binding-owned parse error.

Date-like controls can change native validity without emitting an input event. Browser bindings monitor those transitions; the mechanism is CSP nonce-aware and is not installed during server rendering.

## Querying the binding

Export the directive and query it with Angular's signal-based `viewChild()`:

```ts
import { Component, viewChild } from '@angular/core';
import { FormNode, field } from '@gem/ng-forms';

@Component({
  imports: [FormNode],
  template: `<input #nameBinding="formNode" [formNode]="name" />`,
})
export class Editor {
  name = field('');
  readonly nameBinding = viewChild.required<FormNode<typeof this.name>>('nameBinding');

  focusName() {
    this.nameBinding().focus();
  }
}
```

The public binding exposes `node()`, `errors()`, `element`, `injector`, `focus()`, `flush()`, and `reset()`.

## Focus

Every node also exposes `focus(options?)`. A field focuses its first binding in DOM order; a form or array searches its current subtree. Calling it without a rendered binding is a no-op.

```ts
profile.name.focus();
profile.focus();
```

## Status classes

Configure reactive classes once through dependency injection:

```ts
provideFormNodeConfig({
  classes: {
    'is-invalid': binding => binding.node().$api.invalid(),
    'is-touched': binding => binding.node().$api.touched(),
    'is-pending': binding => binding.node().$api.pending(),
  },
});
```

The nearest provider wins. Each predicate tracks only the signals it reads.

Use the optional preset for Angular-style status classes:

```ts
provideFormNodeConfig({
  classes: FORM_NODE_STATUS_CLASSES,
});
```

It adds `ng-valid`/`ng-invalid`, `ng-pending`, `ng-pristine`/`ng-dirty`, and `ng-untouched`/`ng-touched`. No status classes are installed by default.

## Hidden controls

`hidden()` is form state and does not alter DOM visibility. Remove hidden controls in the template with `@if`. Development builds warn when a hidden node remains rendered.

## Server rendering and hydration

Initial native and custom-control state renders on the server. Browser-only observation is deferred until the browser, and hydration reuses the rendered controls while reconnecting events and reactive state.

See [Custom controls](./custom-controls.md) for component integration.
For multiple bindings, control-owned error filtering, accessor precedence, and SSR edge cases, see
[Advanced behavior and edge cases](../advanced/behavior-details.md#multiple-bindings-and-control-owned-errors).
The [`FormNode` binding reference](../reference/form-node-binding.md) lists its instance API,
configuration providers, control contracts, pass-through registration, and native form directive.
