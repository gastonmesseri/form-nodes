# @gem/ng-forms

A small, typed, signal-based forms library for Angular.

## Install

```sh
npm install --save @gem/ng-forms
```

## Usage

```ts
import { field, form } from '@gem/ng-forms';

const profile = form({
  name: field('', [({ value }) => value() ? null : { kind: 'required' }]),
  address: { city: field('') },
});

profile.name.set('Ada');
profile.patch({ address: { city: 'London' } });
profile(); // { name: 'Ada', address: { city: 'London' } }
```

### Angular control binding

Import `FormNode`, add it to the component's `imports`, and bind a node with `[formNode]`:

```ts
import { Component, viewChild } from '@angular/core';

import { field, FormNode } from '@gem/ng-forms';

@Component({
  imports: [FormNode],
  template: `
    <input #nameBinding="formNode" [formNode]="name">
  `,
})
export class ProfileEditor {
  readonly name = field('', { nullable: false });
  readonly nameBinding = viewChild.required<FormNode<typeof this.name>>('nameBinding');

  focusName() {
    this.nameBinding().focus();
  }
}
```

`FormNode` is both the directive value used in `imports` and the clean public type used by `viewChild()`. The template reference must export `formNode`, while the string passed to `viewChild.required()` must match the local reference name (`nameBinding` in this example). Call `nameBinding()` to obtain the binding and `nameBinding().node()` to obtain its current form node.

A wrapper component can accept the same `formNode` input and delegate it to an inner control. Angular recognizes the outer directive as pass-through, so only the inner control binds to the field:

```ts
import { Component, input } from '@angular/core';

import { FormNode, type Field } from '@gem/ng-forms';

@Component({
  selector: 'app-text-field',
  imports: [FormNode],
  template: `<input [formNode]="formNode()">`,
})
export class TextField {
  readonly formNode = input.required<Field<string>>();
}
```

Use it as `<app-text-field [formNode]="name" />`. The input must be exposed under the exact template name `formNode`; no provider or registration helper is required.

## Documentation

- [Validator messages and internationalization](docs/validator-messages.md) explains global,
  Angular provider, form/array, and validator-local configuration, including reactive locale
  changes and SSR guidance.
- [Behavior reference](docs/behavior.md) records the complete implemented semantics and deliberate
  differences from Angular 22 Signal Forms.

Consumers should import from the package entry point. Internal code is organized by role:

```text
src/
├── public-api.ts
└── lib/
    └── core/
        ├── public-api.spec.ts
        ├── primitives/
        │   ├── field.spec.ts
        │   ├── field.ts
        │   ├── form.spec.ts
        │   └── form.ts
        ├── types/
        │   ├── hidden-function-members.type.ts
        │   └── node.type.ts
        └── validation/
            ├── run-sync-validators.ts
            └── validation.type.ts
```

## Development

Use Node.js 22.22.3 or newer, then run:

```sh
npm install
npm test
npm run build
```
