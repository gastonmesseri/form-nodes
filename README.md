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
  name: field('', [({ value }) => value() ? null : { required: true }]),
  address: form({ city: field('') }),
});

profile.name.set('Ada');
profile.api.patch({ address: { city: 'London' } });
profile(); // { name: 'Ada', address: { city: 'London' } }
```

The package exposes only its public entry point. Internal code is organized by role:

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
            ├── run-validators.ts
            └── validation.type.ts
```

## Development

Use Node.js 22.22.3 or newer, then run:

```sh
npm install
npm test
npm run build
```
