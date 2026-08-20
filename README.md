# @acme/ng-forms

A small, typed, signal-based forms library for Angular.

## Install

```sh
npm install @acme/ng-forms
```

## Usage

```ts
import { Component } from '@angular/core';
import { FormFieldDirective, array, field, form, group } from '@acme/ng-forms';

@Component({
  standalone: true,
  imports: [FormFieldDirective],
  template: `<input [formField]="profile.controls.name" />`,
})
export class ProfileComponent {
  readonly profile = form({
    name: field('', [(value) => (value ? null : 'Name is required')]),
    address: group({ city: field('') }),
    tags: array([field('angular')]),
  });
}
```

The package exposes only its public entry point. Internal code is organized by role:

```text
src/
├── public-api.ts
└── lib/
    ├── core/
    │   ├── factories.ts
    │   ├── form-array.ts
    │   ├── form-control.ts
    │   ├── form-group.ts
    │   ├── types.ts
    │   └── value-types.ts
    └── directives/
        └── form-field.directive.ts
```

## Development

Use Node.js 22.22.3 or newer, then run:

```sh
npm install
npm test
npm run build
```
