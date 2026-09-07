---
title: "[formNode] directive"
---

# [formNode] directive

`FormNode` is the standalone Angular directive imported by components to make `[formNode]`
available. The same symbol is also the public generic type returned by binding queries.

```ts
import { Component, viewChild } from '@angular/core';
import { field, form, FormNode } from '@ngblocks/form-nodes';

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
| Inject the binding on its host | `FORM_NODE` | [`FORM_NODE` reference](./form-node-token.md) |
| Apply reactive CSS classes | `provideFormNodesConfig()` | [Automatic CSS classes](#automatic-css-classes) |
| Delegate through a wrapper | `provideFormNodePassThrough()` | [Pass-through wrappers](#pass-through-wrappers) |
| Bind submit and reset on `<form>` | The same `FormNode` import | [Native form submission](#native-form-submission) |

## Directive input

Import `FormNode` in the component and bind a Form Nodes node to the required `formNode` input:

```ts
@Component({
  imports: [FormNode],
  template: `<input [formNode]="myForm.email" />`,
})
export class EmailEditor {
  myForm = form({
    email: field(''),
  });
}
```

**Binding:** `[formNode]="node"`

The directive accepts a field, form, group, or array node. Native controls require a `field()`;
native `<form>` elements require a `form()` or `group()`. Aggregate nodes can also bind to a
recognized custom component that models their complete value.

| Host | Accepted node | Purpose |
| --- | --- | --- |
| Native input, select, or textarea | `field()` | Two-way value and state synchronization |
| Signal custom-control component | Compatible field or aggregate node | Synchronizes its `value` or `checked` model |
| CVA component | Compatible field or aggregate node | Uses `ControlValueAccessor` interoperability |
| Native `<form>` | `form()` or `group()` | Handles submit and reset |
| Pass-through wrapper | Any delegated node | Leaves synchronization to an inner binding |

## Binding instance

| Member | Description |
| --- | --- |
| [`node()`](#node) | Reactive reference to the node currently bound to the host. |
| [`errors()`](#errors) | Node errors visible to this binding, excluding errors owned by another concrete binding. |
| [`element`](#element) | Host `HTMLElement`. |
| [`injector`](#injector) | Injector belonging to the host element. |
| [`focus(options?)`](#focus) | Focuses this concrete native or custom control. |
| [`flush()`](#flush) | Commits pending control-originated values for the bound node. |
| [`reset()`](#reset) | Resets node interaction state and control-specific parsing state. |

`FormNodeBinding<TNode>` is the structural version of this instance type for provider callbacks and
generic configuration code.

<div className="api-member-reference">

## Binding property reference

### node

**Signature:** `node: Signal<TNode>`

Returns the node currently attached to this concrete host. It updates when a dynamic binding is
reassigned.

```ts
const binding = this.emailBinding();

binding.node() === this.myForm.email; // true
```

### errors

**Signature:** `errors: Signal<readonly ValidationError.WithTargetNode<TNode>[]>`

Returns errors visible to this binding. Node errors without a concrete binding are included;
binding-specific errors belonging to another rendered control are excluded.

```ts
const firstError = this.emailBinding().errors()[0];

firstError?.targetNode === this.myForm.email; // true
```

This distinction matters when the same field is rendered by multiple controls and one binding has
a native parsing error.

### element

**Signature:** `element: HTMLElement`

The host DOM element carrying `[formNode]`.

```ts
this.emailBinding().element.focus();
```

Prefer `focus()` on the binding when a custom control may provide specialized focus behavior.

### injector

**Signature:** `injector: Injector`

The Angular injector belonging to the host element. It is primarily useful to integration and
configuration infrastructure.

```ts
const locale = this.emailBinding().injector.get(LOCALE_ID);
```

## Binding method reference

### focus()

**Signature:** `focus(options?: FocusOptions): void`

Focuses the concrete binding. Native controls use `HTMLElement.focus()`; recognized custom
controls can expose their own focus channel.

```ts
this.emailBinding().focus({ preventScroll: true });
```

This differs from `node.focus()`, which selects one registered binding for a node. Calling the
binding directly targets this exact rendered control.

### flush()

**Signature:** `flush(): void`

Immediately commits a control-originated value waiting for debounce or blur.

```ts
this.emailBinding().flush();

this.myForm.email(); // latest control value
```

Programmatic `set()` calls are already immediate and do not require a flush.

### reset()

**Signature:** `reset(): void`

Resets node interaction state and control-specific parsing state. It also restores the rendered
control from the node when a rejected native value was being displayed.

```ts
this.emailBinding().reset();
```

</div>

## FORM_NODE

`FORM_NODE` is the injection token for the binding on the current host. Most application code uses
a template reference and `viewChild()` instead. Inject the token only when a directive or service
co-located with the host genuinely needs the concrete binding.

```ts
@Directive({
  selector: '[focusInvalidNode]',
  host: {
    '(click)': 'focusWhenInvalid()',
  },
})
export class FocusInvalidNode {
  private binding = inject(FORM_NODE, { self: true });

  focusWhenInvalid() {
    if (this.binding.node().$api.invalid()) this.binding.focus();
  }
}
```

Use `{ self: true }` when the directive must share the same host rather than accidentally resolving
an ancestor binding.

## Binding lifecycle and rebinding

`[formNode]` may receive a computed or otherwise changing node. When it changes, the directive
disconnects the previous node, releases its binding ownership, connects the new node, and updates
`node()` reactively:

```ts
@Component({
  imports: [FormNode],
  template: `<input [formNode]="selectedField()" />`,
})
export class DynamicEditor {
  firstName = field('');
  lastName = field('');
  selectedField = signal(this.firstName);
}
```

Destroying the host removes listeners, class effects, external control errors, and its temporary
injector ownership. A node can then remain in use or bind somewhere else.

## Automatic CSS classes

For the common application-wide setup, register `provideFormNodesConfig()` in the standalone
application configuration. Its predicates apply to `[formNode]` controls:

```ts
import type { ApplicationConfig } from '@angular/core';
import { provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
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

[`ANGULAR_FORMS_STATUS_CLASSES`](./angular-forms-status-classes.md) is an optional compatibility preset for applications, component
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
import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      classes: ANGULAR_FORMS_STATUS_CLASSES,
    }),
  ],
};
```

The preset is an ordinary class map. Spread it when Angular-compatible classes and application
classes should coexist:

```ts
provideFormNodesConfig({
  classes: {
    ...ANGULAR_FORMS_STATUS_CLASSES,
    'has-visible-error': binding => binding.node().invalid() && binding.node().touched(),
  },
});
```

These classes reflect state only. Adding or removing them does not change validation, interaction
state, or submission behavior.

The binding options in `provideFormNodesConfig()` configure `[formNode]` only; its `validatorMessages` option configures node messages. Angular's `provideSignalFormsConfig()`
configures Angular `[formField]` independently, so both providers can share an injector.

## Custom-control components

Components exposing `value = model<T>()`, `checked = model<boolean>()`,
or a CVA are normally discovered automatically. Separate `value`/`valueChange` and
`checked`/`checkedChange` pairs are recognized too, but their value transport requires enabled
experimental `syncInputs` (including `[]` for value transport without optional state writes).

For `FormValueControl`, value binding through `model()` works without experimental options.
Full automatic state/constraint input synchronization requires experimental `syncInputs: 'always'`;
other modes select fewer inputs. Alternatively, a component can combine its value model with
`useFormNodeState()` for full bound-state access and render that state itself without input writes.
Standard CVA value, touch, and disabled-state integration does not require `syncInputs`.
See [FormValueControl support and a complete example](../guides/custom-controls.md#create-a-signal-model-control).


Signal custom controls are discovered from their compiled component metadata and require no
library-specific provider. The integration intentionally applies to components: `getDebugNode()`
does not expose arbitrary directive or host-directive instances. Use a component wrapper or
`ControlValueAccessor` for those cases.

```ts
import { Component, input, model, output } from '@angular/core';
import { FormNode, field, form, type FormNodeValueControl } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-date-picker',
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
marks the field touched when the component emits `touch`. No registration provider is required.

The related public types are:

| Type | Purpose |
| --- | --- |
| `FormNodeValueControl<T>` | Signal control whose primary model is `value`. |
| `FormNodeCheckboxControl` | Boolean signal control whose primary model is `checked`. |
| `FormNodeControl<T>` | Union of recognized value and checkbox control contracts. |
| `FormNodeUiControl<T>` | Common optional UI state and node-integration surface. |

These contracts are declared by Form Nodes using Angular core signal types. They keep the same
value/checked models, typed constraints, `touch` output, and `focus()`/`reset()` hooks on Angular
21 and 22; implementing Angular's version-specific `FormUiControl` is not required.

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
import { FormNode, field, form } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNode],
  template: `
    <form [formNode]="myForm">
      <input [formNode]="myForm.email" />
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>
  `,
})
export class EmailEditor {
  myForm = form({
    email: field(''),
  }, {
    onSubmit: value => save(value),
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


## Custom-control input synchronization

Optional custom-control input synchronization is experimental and disabled by default.
Use `syncInputs: true` for initial declarations or `'always'` for all supported state inputs.
Use `provideFormNodesConfig({ syncInputs: false })` when your component or template
should own inputs such as `disabled`, `readonly`, or `name`; value/checked bindings keep working.
Native controls and CVA `setDisabledState()` remain connected.
See [the simple example](../guides/custom-controls.md#keep-control-of-your-components-inputs)
and [all configuration details](./provide-form-nodes-config.md#custom-control-inputs).


## Direct NgControl accessors

Hooks that assign `inject(NgControl).valueAccessor` during component construction work with
`[formNode]` without an `NG_VALUE_ACCESSOR` provider. The direct accessor takes precedence;
value/change and touched callbacks follow rebinding and stop changing nodes after destruction.
See [the complete example and compatibility boundaries](../guides/custom-controls-advanced.md#hooks-that-assign-ngcontrolvalueaccessor).
