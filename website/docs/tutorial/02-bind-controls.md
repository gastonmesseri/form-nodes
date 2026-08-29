---
title: 2. Bind controls
---

# 2. Bind controls

`[formNode]` binds naturally to native elements, signal custom controls, Angular Material, PrimeNG,
and other controls built on Angular's standard forms contracts. There are no Gem Forms adapters to
install, wrappers to write, or per-library providers to configure. Import the control as its own
documentation requires, then bind your node with the same `[formNode]` syntax.

## Bind native controls

Expand the initial name binding to every field with `[formNode]`.

```ts
import { Component } from '@angular/core';

import { FormNode, field, form } from '@gem/ng-forms';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `
    <label>
      Name
      <input [formNode]="myForm.name" />
    </label>

    <label>
      Age
      <input type="number" [formNode]="myForm.age" />
    </label>

    <label>
      Email
      <input type="email" [formNode]="myForm.email" />
    </label>

    <p>Current name: {{ myForm.name() }}</p>
    <p>Current age: {{ myForm.age() }}</p>
    <p>Current email: {{ myForm.email() }}</p>
  `,
})
export class ProfileEditor {
  myForm = form({
    name: field(''),
    age: field<number>(null),
    email: field(''),
  });
}
```

The directive handles both directions:

- Programmatic `set()` calls update the rendered control.
- User input updates the field and aggregated form value.
- User input marks the field dirty.
- Blur marks it touched.
- Numeric inputs produce numbers rather than raw strings.

The model remains the source of truth; no `FormControl`, `formControlName`, or string path is required.

The same `[formNode]` binding works across Angular's common control contracts.

## Bind signal custom controls naturally

A custom component can expose Angular's standard `model()` value contract:

```ts
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-rating',
  template: `
    <button type="button" (click)="value.set(1)">1</button>
    <button type="button" (click)="value.set(2)">2</button>
    <button type="button" (click)="value.set(3)">3</button>
  `,
})
export class RatingControl {
  readonly value = model<number | null>(null);
}
```

Bind it exactly like a native input:

```ts
@Component({
  imports: [FormNode, RatingControl],
  template: `<app-rating [formNode]="myForm.rating" />`,
})
export class ReviewEditor {
  myForm = form({
    rating: field<number>(null),
  });
}
```

No Gem Forms-specific interface or provider is required for the conventional `value = model()`
shape.

## Bind Angular Material controls naturally

No Angular Material-specific Gem Forms integration is required. After installing Material, import
its component modules normally and place `[formNode]` directly on controls that implement Angular
Forms APIs. For example, `mat-select` can replace a native country select without changing the
node or introducing a `FormControl`:

```ts
import { Component } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { field, FormNode, form } from '@gem/ng-forms';

@Component({
  imports: [FormNode, MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field>
      <mat-label>Country</mat-label>
      <mat-select [formNode]="myForm.country">
        <mat-option value="CH">Switzerland</mat-option>
        <mat-option value="ES">Spain</mat-option>
      </mat-select>
    </mat-form-field>
  `,
})
export class CountryEditor {
  myForm = form({
    country: field('CH'),
  });
}
```

See the official [Angular Material select documentation](https://material.angular.dev/components/select/overview)
for its ordinary installation and theming requirements. Gem Forms requires no additional Material
setup. Continue with the complete [Angular Material integration](../integrations/angular-material.md)
for inputs, selects, checkboxes, datepickers, errors, submission, and testing.

## Bind PrimeNG controls naturally

PrimeNG also needs no Gem Forms adapter or wrapper. Import its module normally and bind
`p-select` directly; its Angular Forms compatibility supplies the `ControlValueAccessor` contract
that `[formNode]` recognizes:

```ts
import { Component } from '@angular/core';
import { SelectModule } from 'primeng/select';

import { field, FormNode, form } from '@gem/ng-forms';

@Component({
  imports: [FormNode, SelectModule],
  template: `
    <p-select
      [formNode]="myForm.city"
      [options]="cities"
      placeholder="Select a city"
    />
  `,
})
export class CityEditor {
  cities = ['Madrid', 'Zurich', 'London'];

  myForm = form({
    city: field<string>(null),
  });
}
```

See the official [PrimeNG Select documentation](https://primeng.org/select) for package setup and
available options. Once PrimeNG itself is configured, there is no extra Gem Forms configuration.
Continue with the complete [PrimeNG integration](../integrations/primeng.md) for installation,
inputs, selects, checkboxes, datepickers, validation styling, submission, and testing.

## Bind other Angular-compatible controls

In general, use `[formNode]` with native elements, `value = model()` or `checked = model()` custom
controls, and components implementing `ControlValueAccessor`. This is why established Angular
component libraries work without library-specific support in Gem Forms: the integration is based
on Angular's contracts rather than component brand names. Gem Forms discovers the appropriate
mechanism automatically.

Based on their documented Angular Forms support, controls from these well-known libraries are also
expected to bind naturally:

| Library | Representative compatible control | Why it is expected to work |
| --- | --- | --- |
| Angular Material | [`mat-select`](https://material.angular.dev/components/select/overview) | Supports Angular Forms and participates through `NgControl` |
| PrimeNG | [`p-select`](https://primeng.org/select) | Supports template-driven and reactive Angular forms |
| Kendo UI for Angular | [`kendo-dropdownlist`](https://www.telerik.com/kendo-angular-ui/components/dropdowns/dropdownlist/forms) | Documents both `ngModel` and reactive-forms binding |
| NG-ZORRO | [`nz-select`](https://ng.ant.design/components/select/en) | Exposes `ngModel` and `SelectControlValueAccessor`-compatible semantics |
| Taiga UI | [Input controls](https://taiga-ui.dev/components/input/API/) | Use native inputs and/or follow Angular form-control state |

For example, a compatible Kendo or NG-ZORRO control uses the same binding shape:

```html
<kendo-dropdownlist [formNode]="myForm.country" [data]="countries" />

<nz-select [formNode]="myForm.country">
  <nz-option nzValue="CH" nzLabel="Switzerland" />
  <nz-option nzValue="ES" nzLabel="Spain" />
</nz-select>
```

This is a contract-based compatibility expectation, not a claim that every component in every
suite is a form control. Check that the particular component supports `ngModel`, reactive forms,
or `ControlValueAccessor`; display-only components do not have a value contract to bind. Components
with unusual integration requirements can use the explicit custom-control provider described in
the custom-controls guide.

The [Custom controls](../guides/custom-controls.md) guide documents the complete compatibility
matrix, state inputs, hooks, precedence, and limitations.

## Related guides and reference

- [Control binding](../guides/control-binding.md) details native value conversion, constraints,
  focus, status classes, SSR, and hydration.
- [Custom controls](../guides/custom-controls.md) covers `model()`, input/output pairs,
  `ControlValueAccessor`, and explicit registration.
- [Node API](../reference/node-api.md#binding-api) lists the public API available from a
  `viewChild()` binding.
- [Build a custom rating control](../cookbook/custom-rating-control.md) is a focused end-to-end
  recipe.

Continue with [Step 3: Add validation](./03-validation.md).
