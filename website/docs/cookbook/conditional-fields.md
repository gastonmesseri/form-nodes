---
title: Conditional fields
---

# Show and validate conditional fields {#show-and-validate-conditional-fields}

Use the same signal to drive node state and template rendering:

```ts
import { Component, signal } from '@angular/core';
import { FormNode, field, form, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-checkout',
  imports: [FormNode],
  template: `
    <label>
      <input
        type="checkbox"
        [checked]="isBusiness()"
        (change)="isBusiness.set(!isBusiness())"
      />
      Business customer
    </label>

    <input [formNode]="myForm.customerName" />

    @if (myForm.companyName.visible()) {
      <input [formNode]="myForm.companyName" />
      <input [formNode]="myForm.taxId" />
    }
  `,
})
export class Checkout {
  readonly isBusiness = signal(false);

  myForm = form({
    customerName: field('', [required]),
    companyName: field('', {
      validators: [required],
      hidden: () => !this.isBusiness(),
    }),
    taxId: field('', {
      validators: [required],
      hidden: () => !this.isBusiness(),
    }),
  });
}
```

Hidden nodes retain their values and validators but expose no errors and do not affect ancestor validity. When the business fields become visible again, validation resumes against their current values.

Node state does not hide DOM by itself. Keeping the `@if` aligned with `visible()` avoids rendering a hidden `[formNode]` control.

See [Interaction and availability](../guides/interaction-and-availability.md).
