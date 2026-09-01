# @gem/ng-forms

A small, typed, signal-based forms library for Angular.

## Install

```sh
npm install @gem/ng-forms
```

## Usage

```ts
import { field, form } from '@gem/ng-forms';

const profile = form({
  name: field('', [({ value }) => value() ? null : { kind: 'required' }]),
  address: form({ city: field('') }),
});

profile.name.set('Ada');
profile.api.patch({ address: { city: 'London' } });
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
