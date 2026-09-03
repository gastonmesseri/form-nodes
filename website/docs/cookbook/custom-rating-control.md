---
title: Custom rating control
---

# Build a custom rating control

A signal custom control needs a `value` model. Optional standard inputs and a `touch` output integrate additional form state:

```ts
import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-rating',
  template: `
    <div role="radiogroup" [attr.aria-disabled]="disabled()">
      @for (rating of ratings; track rating) {
        <button
          type="button"
          [disabled]="disabled()"
          [attr.aria-checked]="value() === rating"
          role="radio"
          (click)="choose(rating)"
          (blur)="touch.emit()"
        >
          {{ rating }}
        </button>
      }
    </div>
  `,
})
export class RatingControl {
  readonly value = model<number | null>(null);
  readonly disabled = input(false);
  readonly touch = output<void>();
  readonly ratings = [1, 2, 3, 4, 5];

  choose(rating: number) {
    if (!this.disabled()) this.value.set(rating);
  }
}
```

Use it like a native control:

```ts
@Component({
  selector: 'app-review-editor',
  imports: [FormNode, RatingControl],
  template: `
    <app-rating [formNode]="myForm.rating" />
  `,
})
export class ReviewEditor {
  myForm = form({
    rating: field<number>(null, [required, between(1, 5)]),
    comment: field('', [maxLength(1_000)]),
  });
}
```

`[formNode]` discovers the `value` model automatically and synchronizes both directions. `touch` marks the field touched, while the optional `disabled` input receives node state. Controls may also expose standard inputs such as `errors`, `invalid`, `required`, `min`, `max`, and `touched`, plus optional `focus()` and `reset()` hooks.

No library-specific provider is required for this conventional model shape. Signal-control discovery intentionally applies to components; use a component wrapper or `ControlValueAccessor` for directive-based controls.

See [Custom controls](../guides/custom-controls.md).
