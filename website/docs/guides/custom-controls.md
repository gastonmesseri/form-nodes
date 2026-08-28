---
title: Custom controls
---

# Custom controls

`[formNode]` works with standard Angular `ControlValueAccessor` components and signal-based controls.

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

Optional standard state inputs—such as `errors`, `disabled`, `dirty`, `hidden`, `invalid`, `min`, `max`, `name`, `pending`, `readonly`, `required`, and `touched`—receive node state automatically. Optional `touch`, `focus()`, and `reset()` hooks integrate with interaction and reset behavior.

## Explicit registration

Use `provideFormNodeControl()` when unusual component metadata prevents automatic discovery:

```ts
@Component({
  selector: 'app-date-picker',
  providers: [provideFormNodeControl(() => DatePicker)],
  template: `...`,
})
export class DatePicker {
  readonly value = model<Date | null>(null);
}
```

A library-specific optional `node` signal may receive the exact bound node when the component needs direct access to additional state.

## ControlValueAccessor

Existing CVA controls work without changes. If several accessors match, selection follows Angular's precedence: custom, specialized built-in, then default. Synchronous `NG_VALIDATORS` errors join the node's validation state. Asynchronous CVA validators are not adapted; use the node's [async validation](./async-validation.md) pipeline instead.

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

## Binding precedence

When several integration mechanisms are available, `[formNode]` chooses a matching CVA first, then an explicitly provided signal control, then an automatically discovered signal control, and finally native-control handling.
