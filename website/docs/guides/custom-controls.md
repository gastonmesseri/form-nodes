---
title: Custom controls
---

import CodeBlock from '@theme/CodeBlock';
import controlStateSource from '!!raw-loader!../../examples/control-state-form-node.typecheck.ts';
import ngControlSource from '!!raw-loader!../../examples/cva-ng-control-subscriptions.typecheck.ts';
import dateErrorsSource from '!!raw-loader!../../examples/cva-date-errors.typecheck.ts';

# Custom controls

`[formNode]` works with standard Angular `ControlValueAccessor` components and signal-based controls.

## Angular API compatibility

### Use Angular's own [formField] directive

Every Form Nodes node exposes `$field`, a lazy view backed by an official Angular Signal Forms
`FieldTree`. This lets an application opt into Angular's directive for a particular control while
keeping Form Nodes as its model:

```ts
import { Component } from '@angular/core';
import { FormField } from '@angular/forms/signals';

import { field, form } from 'form-nodes';

@Component({
  imports: [FormField],
  template: `
    <input [formField]="profileForm.displayName.$field">
  `,
})
export class ProfileComponent {
  profileForm = form({
    displayName: field(''),
  });
}
```

### Import FormField where the template is compiled

`$field` provides the compatible field tree, but Angular still needs its own `FormField` directive
in the template's compilation scope. In a standalone component, import it directly from
`@angular/forms/signals` and add it to the component's `imports`, as in the example above. No
provider or adapter-specific setup is required.

For NgModule-based applications, import and re-export `FormField` from a shared module when many
declared components use `[formField]`:

```ts
import { NgModule } from '@angular/core';
import { FormField } from '@angular/forms/signals';

@NgModule({
  imports: [FormField],
  exports: [FormField],
})
export class SharedFormsModule {}
```

Every NgModule that declares a component using `[formField]` must import either `FormField` itself
or a module that re-exports it. Likewise, every standalone component must import `FormField`
directly or import a shared module that exports it.

`$field` is a supported, stable adapter and is not deprecated. Use it specifically in templates
that bind Angular's `[formField]`.

The adapter is intentionally type-erased to `any`. Angular's AOT strict-template checker calls and
inspects the bound field state, so narrower opaque types such as `never` reject valid templates.
The erased type deliberately avoids advertising Angular's field-state members in IntelliSense; it
is not an application-code API or a type-safe bridge. Select the intended Form Nodes node before
`$field`, as in `profileForm.displayName.$field`, and perform programmatic operations through that
Form Nodes node.

Most bindings target a `field()`. An aggregate `form()`, `group()`, or `array()` can also expose
`$field` for an uncommon custom control whose single value is the corresponding object or array;
native inputs normally bind to leaf fields.

No conversion function is required. Values synchronize in both directions, and the adapter mirrors
disabled, readonly, hidden, required, validation, touched, and dirty state. Every descendant uses
the same adapted Angular tree internally.

Control edits use the same value channel as `[formNode]`. With `debounce: 300` or
`debounce: 'blur'`, the node call keeps returning the last committed value while `controlValue()`
contains the text currently rendered by the control. Calling `flush()` commits it immediately;
calling `set()` programmatically replaces it and cancels the pending edit.

If application code writes the node in the same reactive turn as a real control-state edit, the
control edit takes precedence. This deterministic rule protects user input from effect-ordering
races; when no control edit occurred, the programmatic node value remains authoritative.

For a bound leaf field, control interaction flows back naturally: input marks the Form Nodes field
dirty and blur marks it touched. Calls such as `markAsUntouched()` and `markAsPristine()` also update the Angular field independently, so
clearing one does not clear the other.

Parsing errors also flow back into Form Nodes. This includes Angular's native parsing and custom
controls built with `transformedValue()`. A failed parse keeps the last committed node value while
making the node and its ancestors invalid:

```ts
profileForm.age();                   // 5
profileForm.age.getError('parse');  // the control's parsing error
profileForm.age.invalid();          // true
profileForm.invalid();              // true
```

Correcting the control removes its parsing error. Resetting the Form Nodes node also clears parsing state
and restores the control to the committed value. With multiple controls bound to one node, each
control owns its parsing error independently; destroying or rebinding a control removes only its
contribution. Form Nodes validator errors remain present alongside binding parsing errors.

Validator constraints flow in the other direction. Form Nodes validators remain responsible for
validation, while `[formField]` receives their active metadata for rendering and custom-control
inputs:

```ts
profileForm = form({
  age: field(18, [min(16), max(120)]),
  userName: field('', [minLength(3), maxLength(24), pattern(/^[a-z]+$/i)]),
});
```

A custom Angular control that declares `min`, `max`, `minLength`, `maxLength`, or `pattern` inputs
receives the corresponding reactive values naturally. Native controls receive the properties that
Angular supports for their element and input type. Angular 22 currently exposes patterns to custom
controls but does not write them to a native input's `pattern` property. Form Nodes still validates every
configured pattern, and metadata propagation does not run a second Angular validator or duplicate
errors.

The same state remains consistent through materialized forms, groups, arrays, and their ancestors.
Aggregate `markAsTouched()` reaches descendants unless `skipDescendants` is used, while
`markAsDirty()` marks only the aggregate itself. Reset clears the complete subtree. A disabled,
readonly, or hidden node temporarily appears untouched and pristine on both sides and restores its
previous interaction state when it becomes interactive again.

Calling `node.focus()` also works for controls bound through `$field`. With multiple bindings, the
first connected control in DOM order is chosen. Custom Angular controls retain their own `focus()`
implementation, including `FocusOptions`, and destroyed or rebound controls are removed from the
old node automatically. Calling `focus()` on a form, group, or array can discover the first adapted
control among its descendants.

Reset through the Form Nodes node API. Calling `node.reset()` resets Angular's control state, invokes
native, custom-control, or CVA reset handling, and cancels pending Form Nodes debounce. Explicit reset
values update the control as well. A reset without a value keeps the last committed Form Nodes value
rather than committing text that was still waiting for debounce. Angular's internal field-state
reset is deliberately not another application API: `$field` is opaque and Form Nodes remains the
sole authority.

For native form reset events, bind the form root with `[formNode]` while its controls may continue
using `[formField]`:

```html
<form [formNode]="profileForm">
  <input [formField]="profileForm.displayName.$field">
</form>
```

Angular 22's `FormRoot` handles submission but does not handle the native `reset` event. The
`[formNode]` root receives that event, resets Form Nodes, and the adapter resets every Angular-bound
control in the subtree.

Availability is intentionally node-owned. Calling `disable()`, `markAsReadonly()`, or `hide()` on
the Form Nodes node updates Angular's field state and the bound control. Angular models disabled,
readonly, hidden, and required as derived schema state and does not expose reverse setters, so a
control does not mutate those states back into the Form Nodes node.

Classes configured through `provideFormNodeConfig({ classes })` also apply to controls using this
`$field` binding. The predicate receives the same `FormNodeBinding` shape as it does for
`[formNode]`, so existing class maps and `ANGULAR_FORMS_STATUS_CLASSES` can be reused unchanged.

If an application already uses Angular's `provideSignalFormsConfig({ classes })`, those classes also
apply automatically: `$field` is a real Angular `FieldTree`, so its `[formField]` binding consumes
the normal Angular configuration. Those predicates receive Angular's `FormFieldBinding`, not Form Nodes' `FormNodeBinding`.

Choose one provider in each injector scope. Do not add both class-config providers in the same
injector because Angular exposes a single, non-multi Signal Forms config and the last provider would
replace the other.

The adapter is created only when `$field` is read. Component field initializers automatically
capture their Angular injector. If a form is created outside an Angular injection context, pass an
explicit `injector` option before using `$field`:

```ts
const profileForm = form({
  displayName: field(''),
}, {
  injector,
});
```

For the library-native binding and its broader control discovery options, continue with
[`[formNode]`](../reference/form-node-binding.md).

Choose the Angular contract that already fits your control. Conventional components require no
Form Nodes interface, base class, or registration provider.

| Angular control API | Recognized shape | Binding support |
| --- | --- | --- |
| Signal Forms value control | `value = model<T>()` | Fields, forms, and arrays |
| Signal Forms checkbox control | `checked = model<boolean>()` | Boolean fields |
| Signal input and output pair | `value` + `valueChange`, or `checked` + `checkedChange` | Fields, forms, and arrays |
| Classic input and output pair | `@Input() value` + `@Output() valueChange` | Fields, forms, and arrays |
| Reactive Forms / Forms API | `ControlValueAccessor` through `NG_VALUE_ACCESSOR` | Fields and compatible aggregate values |
| Native form element | `input`, `select`, or `textarea` | Scalar fields |

The `value` and `checked` contracts follow Angular's `FormValueControl<T>` and
`FormCheckboxControl` shapes. A component does not have to declare that it implements those types;
`[formNode]` discovers the public Angular inputs and outputs from component metadata.

Binding precedence is deterministic when a component exposes more than one mechanism:

1. `ControlValueAccessor`
2. An automatically discovered signal or input/output control
3. Native element handling

## Signal model controls

The zero-configuration approach is a component exposing `value = model<T>()` or, for a checkbox, `checked = model<boolean>()`:

```ts
import { Component, model, output } from '@angular/core';

@Component({
  selector: 'app-rating',
  template: `...`,
})
export class Rating {
  readonly value = model(0);
  readonly touch = output<void>();

  focus(options?: FocusOptions) {
    // Focus the component's interactive element.
  }
}
```

```html
<app-rating [formNode]="review.rating" />
```

Separate `value`/`valueChange` or `checked`/`checkedChange` pairs are also supported. A separate input must have a default value rather than be required.

For example, the equivalent value contract can be written without `model()`:

```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-rating',
  template: `...`,
})
export class Rating {
  readonly value = input<number | null>(null);
  readonly valueChange = output<number | null>();

  choose(value: number) {
    this.valueChange.emit(value);
  }
}
```

:::caution Do not require the control model input

A custom control intended for both `formField` and `formNode` must initialize its `value` or
`checked` model itself. Making that model required can compile with Angular's directive while
rejecting the equivalent third-party binding because third-party directives cannot participate in
Angular's special required-model rule. The bound node replaces the initial value during setup.

:::

### Aggregate value models

A `value = model<T>()` control may bind directly to a `form()` or `array()` when `T` is the complete
aggregate value:

```ts
@Component({
  selector: 'app-address-editor',
  template: `...`,
})
export class AddressEditor {
  readonly value = model({ city: '', country: '' });
}
```

```html
<app-address-editor [formNode]="myForm.address" />
```

A value emitted by the control marks the directly bound aggregate node dirty and distributes or
reconciles the complete value through its children. The descendants are not individually marked
dirty solely because the aggregate control changed them.

Optional standard state inputs—such as `errors`, `disabled`, `dirty`, `hidden`, `invalid`, `min`, `max`, `name`, `pending`, `readonly`, `required`, and `touched`—receive node state automatically. Optional `touch`, `focus()`, and `reset()` hooks integrate with interaction and reset behavior.

The complete recognized state surface is `errors`, `disabled`, `disabledReasons`, `dirty`,
`hidden`, `invalid`, `max`, `maxLength`, `min`, `minLength`, `name`, `pattern`, `pending`,
`readonly`, `required`, and `touched`.

Declare only the inputs the component uses. Public input aliases and transforms are preserved for
both `input()` and decorator inputs, and components implementing `ngOnChanges` receive the state
changes. The optional `touch` output marks the node touched; `focus(options?)` is used by
`node.focus()`, and `reset()` is called during the binding reset lifecycle.

## Read bound state without state inputs

The [`useControlState()` reference](../reference/control-state.md) lists the complete API,
defaults, source precedence, and lifecycle behavior.

`useControlState()` is the stable alternative when a component does not want `[formNode]` to
write optional `disabled`, `readonly`, `required`, or error inputs through Angular internals. Call
it in the component injection context and read its signals directly:

<CodeBlock language="ts">{controlStateSource}</CodeBlock>

The facade recognizes `[formNode]`, `[formField]`, `[formControl]`, `formControlName`, and `ngModel`.
`connected()` reports whether a supported binding is present, and `source()` identifies the active
adapter without changing the component's API.

The Reactive Forms and template-driven adapters observe the public `AbstractControl.events` stream
and reconcile the current directive control after rendering. They therefore follow a replaced
`FormControl` and pick up `{ emitEvent: false }` mutations on the next render. They provide value,
disabled, dirty, touched, invalid, pending, errors, and names declared by `formControlName` or
`ngModel`. Properties these APIs do not expose, including readonly, hidden, disabled reasons, and
constraint metadata, retain their safe neutral defaults. `[formField]` instead exposes Angular
Signal Forms state, including constraints, required, readonly, hidden, and disabled reasons.

All errors are exposed as `readonly { kind: string; ... }[]`, regardless of the source-specific
error representation. The remaining signals include `value`, `disabled`, `disabledReasons`,
`dirty`, `hidden`, `invalid`, constraints, `name`, `pattern`, `pending`, `readonly`, `required`, and
`touched`. Disabled reasons are normalized to `{ message?: string }`, without exposing a Form Nodes node or
Angular field tree. An unnamed active reason remains `{}` rather than being removed, so an empty
array always means that no known reason is active. An unbound component receives neutral values
such as `false`, `[]`, `undefined`, and `null` rather than an injection error.

Server rendering safely starts render-discovered Angular adapters disconnected; they connect after
the component is rendered in the browser. `[formNode]` can connect synchronously through its host
registry. Code should always treat `connected()` as the authority and rely on the neutral defaults
while no source is available.

Call `markAsTouched()` from the custom control's blur interaction to notify whichever forms API is
currently connected. The operation delegates to that API's native touched behavior and is a safe
no-op while disconnected.

`useControlState()` is deliberately not a second form-control API. Read state from its signals
and use `markAsTouched()` to report the control's blur interaction. Send user-authored value changes
through the component's `model()`, Angular `FormValueControl`, or `ControlValueAccessor` callbacks.
Programmatic value writes, reset, disabled state, and other form operations remain owned by the API
that created the form. Consequently, the facade does not expose `setValue()`, `reset()`,
`disable()`, or `enable()`.

## ControlValueAccessor

Existing CVA controls work without changes:

```html
<app-existing-date-picker [formNode]="myForm.appointment" />
```

`[formNode]` calls `writeValue()`, registers change and touch callbacks, and propagates disabled
state through the normal CVA contract. It also provides a lightweight `NgControl` view for
components—such as Angular Material-style controls—that inspect their injected control.

If several accessors match, selection follows Angular's precedence: custom, specialized built-in,
then default. Reentrant change callbacks fired from inside `writeValue()` are ignored so legacy
controls cannot create a feedback loop or mark a programmatic update dirty.

Synchronous validators registered through `NG_VALIDATORS` join the node's validation state, and
`registerOnValidatorChange()` triggers reevaluation. `NG_ASYNC_VALIDATORS` are intentionally not
adapted; use the node's [async validation](./async-validation.md) pipeline, which owns pending state,
cancellation, debounce, and stale-result handling.

A CVA component can also declare the standard signal state inputs listed above. Those inputs receive
the same node state as a signal-model control.

### Existing controls that inject NgControl

A CVA can obtain `NgControl` from its host injector in `ngAfterContentInit()` or
`ngAfterViewInit()` and keep its existing subscriptions. `[formNode]` supplies the adapter automatically; no extra provider or Angular
`FormControl` is needed in the application.

<CodeBlock language="ts">{ngControlSource}</CodeBlock>

Both `ngControl` and `ngControl.control` expose current `value`, `errors`, validation status,
disabled state, and dirty/touched state. Error keys come from each node error's `kind`. Validator errors retain the complete Form Nodes
error; errors supplied through `control.setErrors()` return their original Angular payload.
`value` includes pending debounced input, even when the
node's committed or equality-filtered public value still differs.

The injected directive's `name` and `path` describe the bound node's current structural location:

| Bound node | `name` | `path` |
| --- | --- | --- |
| Root or detached node | `null` | `[]` |
| Group or nested form `profile.address` | `'address'` | `['address']` |
| Leaf `profile.address.city` | `'city'` | `['address', 'city']` |
| Array item `profile.contacts[0]` | `0` | `['contacts', '0']` |

Nested forms remain part of the full structural path. Detaching a subtree makes that subtree
its own root; its descendants keep their relative paths within it. Reads track structural
changes and binding replacement, including array reordering, independently of public value equality.
Each `path` read returns a fresh array, so modifying it cannot modify node metadata.
These properties are read-only views: use node operations to change structure.

This intentionally differs from Angular's directive-container paths: DOM nesting, HTML `name`
attributes, and a custom control's `name` input do not determine this identity. Read these members
from `ngControl`; Angular's `AbstractControl` type has neither member. The combined adapter uses
one runtime object for `ngControl` and `ngControl.control`, so both have the same runtime values.
A local `useNgControl` helper can capture the host injector during construction and resolve
`NgControl` in a lifecycle hook, following the same deferred lookup as the example above.

Both surfaces also support `getError(code, path?)` and `hasError(code, path?)`. For example,
after the date control below reports an invalid date:

```ts
ngControl.hasError('invalidDateFormat'); // true
ngControl.control!.getError('invalidDateFormat'); // { message: 'Enter a date as YYYY-MM-DD.', actual: '2026-02-30' }
```

Without a path, these methods inspect only the bound node's own errors. When a custom control
binds a form, group, or array, a relative path can select a descendant, for example
`control.getError('required', 'contacts.0.email')` or
`control.hasError('required', ['contacts', 0, 'email'])`. Queries follow current children and array
positions after structural changes. Segment arrays also support child names containing dots.

`getError()` returns the same payload as the corresponding entry in `control.errors`: the complete
Form Nodes error for validators, or the original payload passed to `setErrors()`. It returns `null`
for an unresolved path or a node without errors, and `undefined` for a missing key in an existing
error map. Like Angular, `hasError()` checks the payload's truthiness, so a payload of `false`,
`null`, or `undefined` returns `false` even though that error key can make the node invalid.

The adapter supports these observable subscriptions:

- `ngControl.valueChanges` and `ngControl.control.valueChanges` report control-value changes.
- `ngControl.statusChanges` and `ngControl.control.statusChanges` report validation status,
  including error-detail or pending-state changes when the status string stays the same.
- `ngControl.control.events` emits Angular `ValueChangeEvent`, `StatusChangeEvent`,
  `TouchedChangeEvent`, and `PristineChangeEvent` objects. Their `source` is the adapter control.

Getters are current immediately. Observables run during Angular effect synchronization, so several
writes before synchronization can produce one notification with the latest state. The first
synchronization publishes the current state; subscriptions added afterward do not replay it.
Read the getters for initial state, or use `startWith(control.status)` as the example does. This timing differs from the synchronous
notifications of Reactive Forms.

Replacing `[formNode]` with another node preserves the adapter and its subscriptions and publishes
the replacement's state. Destroying the binding completes all three streams.

The adapter supports state observation and control-originated errors through `control.setErrors()`.
Keep value writes in the CVA change callback and programmatic operations on the Form Nodes node.
`control.setValue()` and general Reactive Forms tree traversal such as `control.get()` are not provided.

If an existing component copies these errors into its own Angular `FormControl`, check the order
of its operations: `setErrors(externalErrors)` followed by `enable()` runs the internal validators
again and replaces those manual errors, even if the internal control was already enabled.
`disable()` clears its errors too. The injected adapter still exposes the original node errors.
An internal validator that returns the external errors can preserve them during validation;
alternatively, enable the internal control before copying errors while it is enabled.
`emitEvent: false` suppresses notifications but does not prevent this revalidation.

Reading component signals such as `disabledInput()` inside a subscription does not subscribe to
those signals. If those inputs can change independently, the component needs its own mechanism
to synchronize them; `statusChanges` reports the bound node's state.

### Reporting parsing errors with setErrors

A custom control can report an error that originates in its own UI, such as an unparseable date,
through its injected `NgControl.control.setErrors()`:

<CodeBlock language="ts">{dateErrorsSource}</CodeBlock>

In this example, `2026-02-30` produces `invalidDateFormat`. The error makes the appointment field
and its parent form invalid. The component preserves the typed text and sends `null` through its
normal CVA callback; `required` remains an independent validator. Correcting the date calls
`setErrors(null)` to remove the parsing error. `writeValue()` also clears it when the application
supplies a new date.

Each binding owns one imperative error source. `setErrors(errors)` replaces that source, and
`setErrors(null)` or `setErrors({})` clears it. Pass the errors produced by this component; Form Nodes
already merges them with configured validators and other bindings. Clearing this source preserves
all other errors. Changes immediately update node and ancestor validity, including submission checks.

Angular payloads keep their shape in `ngControl.errors`: for example,
`{ invalidDateFormat: { message: 'Invalid date' } }`. On the node, the corresponding error has
`kind: 'invalidDateFormat'`, the original payload in `context`, and `targetNode` and `formNode`
identifying its owners. A string `payload.message` is also exposed as the node error's `message`.
Validator-originated errors continue using the complete Form Nodes error object in `ngControl.errors`.

These are control-owned errors, so they persist across value changes and validation runs until the
component replaces or clears them. A node reset, binding replacement, or binding destruction also
clears them. Disabled, readonly, and hidden nodes suppress them using normal Form Nodes state rules;
they become visible again when the node becomes interactive unless the component cleared them.
This lifetime deliberately differs from Reactive Forms, which replaces manual errors on its next
validation run.

`setErrors(errors, { emitEvent: false })` suppresses the resulting `statusChanges` and
`StatusChangeEvent` notification on this adapter. Getters, node signals, and ancestor state still
update, and other bindings remain reactive. Independent state changes still produce notifications.
Notifications otherwise follow the effect timing described above.

## Wrapper components

A component can accept a `formNode` input and delegate it to an inner control:

```ts
@Component({
  selector: 'app-text-field',
  imports: [FormNode],
  template: `<input [formNode]="formNode()" />`,
})
export class TextField {
  readonly formNode = input.required<Field<string>>();
}
```

```html
<app-text-field [formNode]="profile.name" />
```

The wrapper is detected as pass-through, so only the inner control creates a binding. A directive or host directive that consumes or re-exports `formNode` must register `provideFormNodePassThrough()` because Angular does not expose equivalent public runtime input reflection for directives.

## Compatibility boundaries

- Automatic signal-control discovery applies to Angular components. A control implemented as a
  directive or host directive should use a component wrapper or `ControlValueAccessor`.
- Native elements bind scalar fields. Use a value-model or CVA component when one control edits a
  complete object or array.
- State inputs declared by a component take precedence over same-named native host properties.
- Custom-element hosts do not receive synthetic native properties such as `disabled`, `required`,
  `readonly`, `name`, `min`, or `max` unless the component declares the corresponding input.
- Initial state is rendered during server rendering, and browser behavior reconnects during
  hydration.

See [Control binding](./control-binding.md) for native element behavior and state propagation.
The [advanced binding details](../advanced/behavior-details.md#binding-selection-and-compatibility)
cover selection precedence, ambiguous accessors, binding ownership, and server rendering semantics.
