---
title: PrimeNG
description: Bind Form Nodes directly to PrimeNG inputs, selects, checkboxes, datepickers, validation styles, and native forms.
---

# PrimeNG {#primeng}

PrimeNG form controls work with [`[formNode]`](../reference/form-node-binding.md) through native elements and Angular's
`ControlValueAccessor` contract. No Form Nodes adapter, wrapper, `FormControl`, `FormsModule`, or
`ReactiveFormsModule` is required.

PrimeNG aligns its major releases with Angular. For Angular 22, use a compatible PrimeNG 22 release;
the official changelog records Angular 22 compatibility in PrimeNG 22.1.

## 🚀 Install and configure PrimeNG {#install-and-configure-primeng}

```bash
npm install --save primeng @primeuix/themes
```

Configure PrimeNG and a theme in the normal application providers:

```ts
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
  ],
};
```

See the official [PrimeNG installation guide](https://primeng.org/installation). Form Nodes requires
no additional PrimeNG provider.

## 🧪 Complete example {#complete-example}

This example combines the native `pInputText` directive with PrimeNG Select, Checkbox, and
DatePicker components:

```ts
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ANGULAR_FORMS_STATUS_CLASSES, FormNodeDirective, email, field, form, maxDate, provideFormNodesConfig, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-primeng-profile-editor',
  imports: [FormNodeDirective, ButtonModule, SelectModule, CheckboxModule, DatePickerModule, InputTextModule],
  providers: [
    provideFormNodesConfig({
      classes: ANGULAR_FORMS_STATUS_CLASSES,
    }),
  ],
  template: `
    <form [formNode]="profileForm">
      <div>
        <label for="email">Email</label>
        <input id="email" type="email" pInputText [formNode]="profileForm.email" />
        @if (profileForm.email.touched() && profileForm.email.invalid()) {
          <small>{{ profileForm.email.errors()[0]?.message }}</small>
        }
      </div>

      <div>
        <label for="country">Country</label>
        <p-select
          inputId="country"
          [options]="countries"
          optionLabel="name"
          optionValue="code"
          placeholder="Select a country"
          [formNode]="profileForm.countryCode"
        />
        @if (profileForm.countryCode.touched() && profileForm.countryCode.invalid()) {
          <small>{{ profileForm.countryCode.errors()[0]?.message }}</small>
        }
      </div>

      <div>
        <label for="birth-date">Birth date</label>
        <p-datepicker inputId="birth-date" [showIcon]="true" [formNode]="profileForm.birthDate" />
        @if (profileForm.birthDate.touched() && profileForm.birthDate.invalid()) {
          <small>{{ profileForm.birthDate.errors()[0]?.message }}</small>
        }
      </div>

      <div>
        <p-checkbox inputId="terms" [binary]="true" [formNode]="profileForm.acceptedTerms" />
        <label for="terms">I accept the terms</label>
        @if (profileForm.acceptedTerms.touched() && profileForm.acceptedTerms.invalid()) {
          <small>{{ profileForm.acceptedTerms.errors()[0]?.message }}</small>
        }
      </div>

      <p-button type="submit" label="Save profile" [disabled]="profileForm.submitting()" />
    </form>
  `,
})
export class PrimeNgProfileEditor {
  countries = [
    { name: 'Switzerland', code: 'CH' },
    { name: 'Spain', code: 'ES' },
    { name: 'United States', code: 'US' },
  ];

  profileForm = form({
    email: field('', [required, email]),
    countryCode: field('', [required]),
    birthDate: field<Date>(null, [maxDate(() => new Date())]),
    acceptedTerms: field.strict(false, [required]),
  }, {
    onSubmit: value => saveProfile(value),
  });
}
```

`p-select` returns the `code` because `optionValue="code"` is configured. Without `optionValue`,
type the node for the complete selected option object. PrimeNG DatePicker uses `Date` values in its
ordinary single-date mode.

## 🔌 How each control connects {#how-each-control-connects}

| PrimeNG control | Connection used by `FormNodeDirective` |
| --- | --- |
| `<input pInputText>` | Native input events and values |
| `<p-select>` | Its `ControlValueAccessor` |
| `<p-checkbox [binary]="true">` | Its boolean `ControlValueAccessor` |
| `<p-datepicker>` | Its date `ControlValueAccessor` |
| `<form [formNode]>` | Native submit and reset events |

PrimeNG's official guides document Angular Forms support for
[Select](https://primeng.org/select), [Checkbox](https://primeng.org/checkbox), and
[DatePicker](https://primeng.org/datepicker). `[formNode]` connects to those contracts directly.

## ✅ Validation styling {#validation-styling}

PrimeNG uses Angular-style status classes such as `ng-invalid` and `ng-dirty` for invalid-state
styling. For an application that uses PrimeNG broadly, register the preset once in the standalone
application configuration, alongside the normal PrimeNG providers:

```ts
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import type { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    provideFormNodesConfig({
      classes: ANGULAR_FORMS_STATUS_CLASSES,
    }),
  ],
};
```

This makes the classes available to every `[formNode]` binding created below the application
injector. If only one feature uses PrimeNG styling, put the same `provideFormNodesConfig(...)` call
in that route's or component's `providers` array instead. The complete component example above
demonstrates that narrower component scope.

The preset adds `ng-valid`/`ng-invalid`, `ng-pending`, `ng-pristine`/`ng-dirty`, and
`ng-untouched`/`ng-touched` reactively. It is optional: node validity and message rendering work
without it. Form Nodes adds no status classes by default.

## 📚 Binary and collection checkboxes {#binary-and-collection-checkboxes}

Use `[binary]="true"` with a boolean field. For a checkbox group that owns one complete collection
value, use an array-valued [`field()`](../reference/field.md) rather than [`array()`](../reference/array.md). Use `array()` only when each item needs
an independent Form Nodes node. See
[Choosing a primitive](../guides/choosing-a-primitive.md#array-field-or-array).

## ↩️ Disabled, focus, and reset {#disabled-focus-and-reset}

- Disabled state is passed through PrimeNG's `ControlValueAccessor` contract.
- `profileForm.countryCode.focus()` focuses its first rendered binding; a component without a
  specific focus hook falls back to its host.
- `profileForm.reset()` resynchronizes PrimeNG controls and clears interaction state.
- A native reset button inside the bound form delegates to the node reset.

## 🧪 Testing PrimeNG bindings {#testing-primeng-bindings}

Use `TestBed` and interact with the rendered component as a user would. Keep assertions on the
public node API. Overlay controls such as Select and DatePicker are best covered in a real browser
when keyboard, focus, or overlay behavior matters. See [Testing forms](../guides/testing.md).

## 🔍 Troubleshooting {#troubleshooting}

- Import the module belonging to every PrimeNG component used by the template.
- Configure PrimeNG's theme and animation providers as its installation guide requires.
- Use a PrimeNG major compatible with the application's Angular major.
- Add `[binary]="true"` when a Checkbox represents one boolean field.
- Configure `optionValue` when a Select node should contain one property rather than the complete
  option object.
- Do not add `formControl`, `formControlName`, or `ngModel` to the same control as `[formNode]`.

For general symptoms, see [Troubleshooting](../help/troubleshooting.md).
