---
title: Control binding
---

# Control binding

Import `FormNode` and bind a node with `[formNode]`:

```ts
import { Component } from '@angular/core';
import { FormNode, field } from '@gem/ng-forms';

@Component({
  imports: [FormNode],
  template: `<input [formNode]="name" />`,
})
export class Editor {
  readonly name = field('', { nullable: false });
}
```

It supports native `input`, `select`, and `textarea` elements, Angular `ControlValueAccessor` components, and signal custom controls. Native controls bind scalar `field()` nodes; aggregate forms and arrays require a custom control that represents their complete value.

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

Invalid native numeric or date input produces a `parse` error while retaining the last valid model value and the user's raw text. A later valid input, programmatic update, reset, rebind, or binding destruction clears the binding-owned parse error.

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
  readonly name = field('', { nullable: false });
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
profile.api.focus();
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
