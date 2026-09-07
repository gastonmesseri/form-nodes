---
title: Angular Material
description: Bind Form Nodes directly to Angular Material inputs, selects, checkboxes, datepickers, errors, and native forms.
---

# Angular Material

Angular Material controls work with `[formNode]` through their normal Angular Forms contracts. No
Form Nodes adapter, wrapper, `FormControl`, `FormsModule`, or `ReactiveFormsModule` is required.

## Install Material

Use Angular Material's schematic so dependencies, theme, and animations are configured together:

```bash
ng add @angular/material
```

Follow the official [Angular Material installation guide](https://material.angular.dev/guide/getting-started)
for theme and application setup. Form Nodes adds no Material-specific provider.

## Complete example

This component binds a native Material input, `mat-select`, `mat-checkbox`, and Material datepicker
to one form. The same `FormNode` import also handles the native `<form>` submission boundary.

```ts
import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormNode, email, field, form, maxDate, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-material-profile-editor',
  imports: [
    FormNode,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <form [formNode]="profileForm">
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput type="email" [formNode]="profileForm.email" />
        @if (profileForm.email.touched() && profileForm.email.invalid()) {
          <mat-error>{{ profileForm.email.errors()[0]?.message }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Country</mat-label>
        <mat-select [formNode]="profileForm.countryCode">
          <mat-option value="CH">Switzerland</mat-option>
          <mat-option value="ES">Spain</mat-option>
          <mat-option value="US">United States</mat-option>
        </mat-select>
        @if (profileForm.countryCode.touched() && profileForm.countryCode.invalid()) {
          <mat-error>{{ profileForm.countryCode.errors()[0]?.message }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Birth date</mat-label>
        <input matInput [matDatepicker]="picker" [formNode]="profileForm.birthDate" />
        <mat-datepicker-toggle matIconSuffix [for]="picker" />
        <mat-datepicker #picker />
        @if (profileForm.birthDate.touched() && profileForm.birthDate.invalid()) {
          <mat-error>{{ profileForm.birthDate.errors()[0]?.message }}</mat-error>
        }
      </mat-form-field>

      <mat-checkbox [formNode]="profileForm.acceptedTerms">
        I accept the terms
      </mat-checkbox>
      @if (profileForm.acceptedTerms.touched() && profileForm.acceptedTerms.invalid()) {
        <mat-error>{{ profileForm.acceptedTerms.errors()[0]?.message }}</mat-error>
      }

      <button mat-flat-button type="submit" [disabled]="profileForm.submitting()">
        Save profile
      </button>
    </form>
  `,
})
export class MaterialProfileEditor {
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

The date field uses `Date | null` because `provideNativeDateAdapter()` configures Material's native
`Date` representation. Use the field type that matches a different Material `DateAdapter`.

## How each control connects

| Material control | Connection used by `FormNode` |
| --- | --- |
| `<input matInput>` and `<textarea matInput>` | Native input events and values |
| `<mat-select>` | Its `ControlValueAccessor` |
| `<mat-checkbox>` | Its checkbox `ControlValueAccessor` |
| `input[matDatepicker]` | Material's datepicker value accessor |
| `<form [formNode]>` | Native submit and reset events |

`FormNode` provides a lightweight `NgControl` view on the host. Material controls that inspect
their injected control can read current value, errors, validity, pending, disabled, touched, and
dirty state. Material's standard error-state behavior can therefore react to node state.

See the official [input API](https://material.angular.dev/components/input/api),
[select guide](https://material.angular.dev/components/select/overview), and
[datepicker guide](https://material.angular.dev/components/datepicker/overview).

## Error messages

Form Nodes errors already contain their resolved message and target node. Render the relevant error
inside `mat-error`:

```html
@if (profileForm.email.touched() && profileForm.email.invalid()) {
  <mat-error>{{ profileForm.email.errors()[0]?.message }}</mat-error>
}
```

For multiple messages, choose one explicitly with `getError()`; Material normally reserves layout
space for one error message:

```html
@if (profileForm.email.getError('required'); as error) {
  <mat-error>{{ error.message }}</mat-error>
} @else if (profileForm.email.getError('email'); as error) {
  <mat-error>{{ error.message }}</mat-error>
}
```

See [Errors and validation status](../guides/errors-and-status.md).

## Required and constraint state

Built-in validators expose constraint metadata through the node. `FormNode` synchronizes supported
state such as `required`, `min`, `max`, `minLength`, `maxLength`, and `pattern` with native elements
and compatible component inputs. This lets Material display required markers and native input
constraints without duplicating validator configuration in the template.

## Disabled, readonly, focus, and reset

- Disabled state is passed through Material's `ControlValueAccessor` contract.
- Native Material inputs receive readonly state directly when applicable.
- `profileForm.email.focus()` focuses its first rendered binding.
- `profileForm.reset()` resynchronizes Material controls and clears interaction state.
- A native reset button inside the bound form delegates to the same node reset.

## Testing with Material harnesses

Material harnesses can drive the rendered control while assertions remain on the public node API:

```ts
const email = await loader.getHarness(MatInputHarness.with({ selector: '[type="email"]' }));

await email.setValue('ada@example.com');
await email.blur();

expect(component.profileForm.email()).toBe('ada@example.com');
expect(component.profileForm.email.dirty()).toBe(true);
expect(component.profileForm.email.touched()).toBe(true);
```

See [Testing forms](../guides/testing.md).

## Troubleshooting

- If Material reports that a form field has no control, import `MatInputModule` and add `matInput`.
- If the datepicker reports a missing `DateAdapter`, configure one such as
  `provideNativeDateAdapter()`.
- If an error is present but not displayed, inspect `invalid()` and `touched()`, then check the
  template condition or custom `ErrorStateMatcher`.
- Do not add `formControl`, `formControlName`, or `ngModel` to the same element as `[formNode]`.

For general symptoms, see [Troubleshooting](../help/troubleshooting.md).
