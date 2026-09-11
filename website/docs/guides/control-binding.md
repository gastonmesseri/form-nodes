---
title: Control binding
---

import CodeBlock from '@theme/CodeBlock';
import fileValuesSource from '!!raw-loader!../../examples/file-values.example.ts';
import nativeFileSource from '!!raw-loader!../../examples/native-file-binding.typecheck.ts';
import presenceBindingSource from '!!raw-loader!../../examples/presence-binding.typecheck.ts';
import nativeRadioSource from '!!raw-loader!../../examples/native-radio-binding.typecheck.ts';
import standaloneSource from '!!raw-loader!../../examples/standalone-control-value.typecheck.ts';

# Control binding {#control-binding}

The [type-checked Angular example](../examples/executable-examples.mdx#angular-binding-and-viewchild)
covers the standalone directive import, [`[formNode]`](../reference/form-node-binding.md), `FormNodeDirective`, and `viewChild.required()`.

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
components, `value = model<T>()` controls, and `checked = model<boolean>()` checkbox controls. Native controls bind leaf [`field()`](../reference/field.md) nodes; aggregate forms and
arrays require a custom control that represents their complete value. Separate input/output pairs
are also available through [experimental `bindInputOutputPairs`](./custom-controls.md#separate-input-output-pairs). See
[Advanced custom controls](./custom-controls-advanced.md#angular-api-compatibility) for the complete compatibility
matrix and integration boundaries.

## File inputs {#file-inputs}

Bind a file input directly to a field. The `multiple` attribute determines the value shape:

| Native control | Field declaration | Empty user selection |
| --- | --- | --- |
| `<input type="file">` | `field<File>(null)` | `null` |
| `<input type="file" multiple>` | `field<File[]>([])` | `[]` |

A multiple selection is one `field<File[]>`, not an `array()` node. Its value is a snapshot of
`input.files` as a normal array containing the original `File` objects.

<CodeBlock language="ts" title="document-editor.component.ts">{nativeFileSource}</CodeBlock>

Reading `upload.cover()?.name` in a template or `computed()` tracks the field: selecting or
clearing a file updates the displayed name. Files also expose `size` (bytes), `type`, and
`lastModified`. File metadata itself is immutable; replace the field value to select a different
file. Replace arrays with `set()` or `update()` instead of mutating them in place.

These bindings use the usual dirty, touched, validation, debounce, and committed-output rules.
With debounce, ordinary node reads show the committed file until the pending selection commits.
Cancelling the picker leaves the selection unchanged. The browser's `input` and `change` events
for the same selection produce one value update.

Use `set(null)` to clear a single input and `set([])` to clear a multiple input. Nullish values
also clear either control. Existing `File` objects can be assigned programmatically; populated
selections synchronize through the browser's `DataTransfer` and `input.files` APIs. A string
path cannot select a local file. Keep `multiple` consistent with the model shape: a non-null
single value must be a `File`, and a multiple value must be a `File[]`.

`reset()` preserves the current committed value and clears interaction state; `resetToInitial()`
restores the original file value, including the native selection. Files are not serialized into
server-rendered HTML. Populating a selection requires browser `DataTransfer` support; clearing
it does not.

Selection does **not** upload anything. Build a `FormData` payload and send it through your own
HTTP client when appropriate; JSON does not serialize file contents. The `accept` attribute is a
picker hint, not a validator. Validate size/type in your application and validate uploaded data
on the server.

<CodeBlock language="ts" title="file-values.ts">{fileValuesSource}</CodeBlock>

## Standalone values {#standalone-values}

Use `[formNodeValue]` when you have a value or an application signal and do not need to declare
an explicit field. The directive creates one independent field and keeps it for the lifetime of
the binding. Use `[(formNodeValue)]` to write committed control edits back to your writable signal
or component property.

<CodeBlock language="ts" title="contact-editor.component.ts">{standaloneSource}</CodeBlock>

Editing the suggested name updates the internal field and `lastEdit`, while `suggestedName`
keeps its original value. A later change to `suggestedName` updates the control. Ordinary change
detection does not restore the original value over local edits. The search uses two-way binding,
so each committed edit updates `search`.

The contact input reuses `contact.name`: incoming `loadedName` changes call its programmatic
setter, preserving its validators, dirty state, and touched state. These source updates do not
emit `formNodeValueChange`; user edits do, following the node's debounce configuration.

The same inputs work with CVAs and supported signal controls. `useFormNodeState()` observes the
internal field, including contributed errors, just as it observes an explicit node.

An internal field is a separate root, even inside a bound `<form>`. It does not participate in
that form's value, validation, submission, or reset. Objects and arrays stay atomic field values;
they do not create child nodes. Separate standalone radio bindings also have separate roots:
use a shared explicit field for a radio group.

Read or operate on the internal field with `#suggestion="formNode"` and `suggestion.node()`.
For validators, debounce, or participation in a larger form, pass an explicit `[formNode]`.
See the [value input reference](../reference/form-node-binding.md#value-input) for rebinding,
reset, and typing details.

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

### ◆ Radio buttons {#radio-buttons}

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

A custom `equal` comparator can retain the previously exposed `node()` value without preventing
the control from displaying new input. Rendering uses `value.control()`, while
`value.committed()` exposes the latest committed data before the public equality check.
Consequently, [`formNodeValueChange`](../reference/form-node-binding.md#value-outputs) can emit the retained public value for an edit that compares
equal; `formNodeControlValueChange` carries the latest control value. Debounce still determines
when input is committed. See [value outputs](../reference/form-node-binding.md#value-outputs).

## Boolean presence and acceptance {#boolean-presence-and-acceptance}

Use `required` for a yes/no question initialized to `null`, so `false` is a valid answer.
Use `requiredTrue` for a checkbox that must be checked. `notNil` only rejects null and undefined.

<CodeBlock language="ts" title="checkout.component.ts">{presenceBindingSource}</CodeBlock>

A native checkbox receives HTML `required` for `requiredTrue`, including its reactive `when`
condition. A presence-only `required` rule leaves the native checkbox constraint false, while
`node.required()` remains true. This keeps the browser's `checkValidity()` consistent with a
valid negative answer. `notNil` does not add HTML `required` to any control.

When experimental `syncInputs` includes `required`, custom controls exposing a public `checked`
input receive the same acceptance-specific value, including checkbox CVAs such as Angular Material.
Other custom controls receive the node's logical `required()` state. Existing CVA validators
still apply their own rules.

Inside a custom checkbox, use `useFormNodeState().required()` for a required indicator, but do
not automatically copy it to an inner native checkbox's `[required]`: the logical flag also
represents presence-only rules. Let Form Nodes errors drive validation, use the synchronized
`required` input on a `checked` control, or expose an explicit acceptance option in your wrapper.
