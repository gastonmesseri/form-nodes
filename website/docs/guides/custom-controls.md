---
title: Custom controls
---

# Custom controls

`[formNode]` works with standard Angular `ControlValueAccessor` components and signal-based controls.

## Angular API compatibility

### Use Angular's own `[formField]` directive

Every Gem Forms node exposes `$field`, a lazy view backed by an official Angular Signal Forms
`FieldTree`. This lets an application opt into Angular's directive for a particular control while
keeping Gem Forms as its model:

```ts
import { Component } from '@angular/core';
import { FormField } from '@angular/forms/signals';

import { field, form } from '@gem/ng-forms';

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

### Import `FormField` where the template is compiled

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

The adapter is intentionally opaque in TypeScript: it cannot be called, inspected, or navigated.
Its public `never` type exists only so strict template checking accepts it for Angular's
`FormField` input. Select the intended Gem Forms node before `$field`, as in
`profileForm.displayName.$field`; do not use `$field` as an application-code API.

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

If application code writes the node in the same reactive turn as a real bound-control edit, the
control edit takes precedence. This deterministic rule protects user input from effect-ordering
races; when no control edit occurred, the programmatic node value remains authoritative.

For a bound leaf field, control interaction flows back naturally: input marks the Gem Forms field
dirty, blur marks it touched, and an Angular field reset clears both interaction flags. Calls such
as `markAsUntouched()` and `markAsPristine()` also update the Angular field independently, so
clearing one does not clear the other.

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

Availability is intentionally node-owned. Calling `disable()`, `markAsReadonly()`, or `hide()` on
the Gem Forms node updates Angular's field state and the bound control. Angular models disabled,
readonly, hidden, and required as derived schema state and does not expose reverse setters, so a
control does not mutate those states back into the Gem Forms node.

Classes configured through `provideFormNodeConfig({ classes })` also apply to controls using this
`$field` binding. The predicate receives the same `FormNodeBinding` shape as it does for
`[formNode]`, so existing class maps and `ANGULAR_FORMS_STATUS_CLASSES` can be reused unchanged.

If an application already uses Angular's `provideSignalFormsConfig({ classes })`, those classes also
apply automatically: `$field` is a real Angular `FieldTree`, so its `[formField]` binding consumes
the normal Angular configuration. Those predicates receive Angular's `FormFieldBinding`, not Gem
Forms' `FormNodeBinding`.

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
Gem Forms interface, base class, or registration provider.

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
2. An explicit `provideFormNodeControl()` registration
3. An automatically discovered signal or input/output control
4. Native element handling

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

Do not make a separate `value` or `checked` input required. Angular's compiler has a special rule
that lets its own `[formField]` directive satisfy a required model input, but third-party binding
directives cannot participate in that rule. Give the input or model a sensible initial value; the
bound node replaces it during initialization.

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

Declare only the inputs the component uses. Input transforms are preserved. The optional
`touch` output marks the node touched; `focus(options?)` is used by `node.focus()`, and `reset()` is
called during the binding reset lifecycle.

## Explicit registration

Use `provideFormNodeControl()` when a control should declare its signal contract explicitly instead
of relying on automatic metadata discovery. Configure it once on the control component—not on every
consumer:

```ts
import { Component, input, model, output } from '@angular/core';

import { provideFormNodeControl, type FormNodeValueControl } from '@gem/ng-forms';

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
```

Consume it normally; the application using the component does not repeat the provider:

```ts
import { Component } from '@angular/core';

import { FormNode, field, form } from '@gem/ng-forms';

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

A library-specific optional `node` signal may receive the exact bound node when the component needs direct access to additional state.

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
  directive or host directive should use `provideFormNodeControl()`.
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
