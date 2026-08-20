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
  name: field('', [(value) => value ? null : { required: true }]),
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
        ├── field.ts
        ├── form.ts
        ├── hidden-function-members.ts
        ├── node.ts
        └── validation.ts
```

## Development

Use Node.js 22.22.3 or newer, then run:

```sh
npm install
npm test
npm run build
```
