---
title: 2. Bind controls
---

import CodeBlock from '@theme/CodeBlock';

import cvaControlBindingSource from '!!raw-loader!../../examples/cva-control-binding.typecheck.ts';
import nativeControlsSource from '!!raw-loader!../../examples/tutorial-native-controls.typecheck.ts';

# 2. Bind controls {#2-bind-controls}

`[formNode]` binds naturally to native elements, signal custom controls, Angular Material, PrimeNG,
and other controls built on Angular's standard forms contracts. There are no Form Nodes adapters to
install, wrappers to write, or per-library providers to configure. Import the control as its own
documentation requires, then bind your node with the same `[formNode]` syntax.

## 🔌 Bind native controls {#bind-native-controls}

Expand the initial name binding to every field with `[formNode]`. The same directive also binds
radio buttons, selects, checkboxes, and textareas:

<CodeBlock language="ts" title="Native controls and their model">{nativeControlsSource}</CodeBlock>

The directive handles both directions:

- Programmatic `set()` calls update the rendered control.
- User input updates the field and aggregated form value.
- User input marks the field dirty.
- Blur marks it touched.
- Numeric inputs produce numbers rather than raw strings.
- Radio buttons bound to the same field share a generated `name`. Each option has its own
  string `value`; selecting Phone writes `'phone'` to `myForm.contactMethod()`.
- A `<select>` with string-valued options writes the selected option value, such as `'CH'`.
- A checkbox writes `true` or `false`; `field.strict(false)` keeps this field non-nullable.
- A `<textarea>` reads and writes text just like a text input.

In the radio group, `field('email')` initially selects Email. Bind both options to
`myForm.contactMethod` and let `[formNode]` manage `name` and `checked`. The `fieldset`, `legend`,
and labels give the group and its options accessible names. See
[Radio buttons](../guides/control-binding.md#radio-buttons) for a focused example.

The model remains the source of truth; no `FormControl`, `formControlName`, or string path is required.

The same `[formNode]` binding works across Angular's common control contracts.

## 🔌 Bind signal custom controls naturally {#bind-signal-custom-controls-naturally}

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
  imports: [FormNodeDirective, RatingControl],
  template: `<app-rating [formNode]="myForm.rating" />`,
})
export class ReviewEditor {
  myForm = form({
    rating: field<number>(null),
  });
}
```

No Form Nodes-specific interface or provider is required for the conventional `value = model()`
shape.

## 🔌 Bind a custom ControlValueAccessor {#bind-a-custom-controlvalueaccessor}

A component registered through Angular's `NG_VALUE_ACCESSOR` token uses the same `[formNode]`
binding. The control implements `ControlValueAccessor`; Form Nodes connects its callbacks to the
field automatically:

<CodeBlock language="ts" title="Custom control and parent component">{cvaControlBindingSource}</CodeBlock>

- `writeValue()` displays programmatic field changes. It must not call `onChange()`.
- The control calls the registered `onChange()` callback for user input; this updates the field
  and marks it dirty.
- Calling the registered `onTouched()` callback on blur marks the field touched.
- `setDisabledState()` receives the field's disabled state and applies it to the inner input.

`NG_VALUE_ACCESSOR` is the standard Angular provider for the custom control. The parent only
imports `FormNodeDirective` and the control component; no `ngModel`, `FormControl`, or additional Form Nodes
provider is needed. The same component can still be used with Angular's other forms APIs.

See [ControlValueAccessor in the custom-controls guide](../guides/custom-controls.md#controlvalueaccessor)
for accessor selection, validation integration, and other supported contracts.

## 🔌 Bind Angular Material controls naturally {#bind-angular-material-controls-naturally}

No Angular Material-specific Form Nodes integration is required. After installing Material, import
its component modules normally and place `[formNode]` directly on controls that implement Angular
Forms APIs. For example, `mat-select` can replace a native country select without changing the
node or introducing a `FormControl`:

```ts
import { Component } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { field, FormNodeDirective, form } from '@ngblocks/form-nodes';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  imports: [FormNodeDirective, MatFormFieldModule, MatSelectModule],
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
for its ordinary installation and theming requirements. Form Nodes requires no additional Material
setup. Continue with the complete [Angular Material integration](../integrations/angular-material.md)
for inputs, selects, checkboxes, datepickers, errors, submission, and testing.

## 🔌 Bind PrimeNG controls naturally {#bind-primeng-controls-naturally}

PrimeNG also needs no Form Nodes adapter or wrapper. Import its module normally and bind
`p-select` directly; its Angular Forms compatibility supplies the `ControlValueAccessor` contract
that `[formNode]` recognizes:

```ts
import { Component } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { field, FormNodeDirective, form } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective, SelectModule],
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
available options. Once PrimeNG itself is configured, there is no extra Form Nodes configuration.
Continue with the complete [PrimeNG integration](../integrations/primeng.md) for installation,
inputs, selects, checkboxes, datepickers, validation styling, submission, and testing.

## 🔌 Bind other Angular-compatible controls {#bind-other-angular-compatible-controls}

In general, use `[formNode]` with native elements, `value = model()` or `checked = model()` custom
controls, and components implementing `ControlValueAccessor`. This is why established Angular
component libraries work without library-specific support in Form Nodes: the integration is based
on Angular's contracts rather than component brand names. Form Nodes discovers the appropriate
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
or `ControlValueAccessor`; display-only components do not have a value contract to bind.
For components with unusual integration requirements, see the
[advanced custom-controls guide](../guides/custom-controls-advanced.md).

The [Advanced custom controls](../guides/custom-controls-advanced.md) guide documents the complete compatibility
matrix, state inputs, hooks, precedence, and limitations.

## 🔗 Related guides and reference {#related-guides-and-reference}

- [Control binding](../guides/control-binding.md) details native value conversion, constraints,
  focus, status classes, SSR, and hydration.
- [Custom controls](../guides/custom-controls.md) introduces signal model components and
  existing `ControlValueAccessor` controls.
- [Node API](../reference/node-api.md#binding-api) lists the public API available from a
  `viewChild()` binding.
- [Build a custom rating control](../cookbook/custom-rating-control.md) is a focused end-to-end
  recipe.

Continue with [Step 3: Add validation](./03-validation.md).
