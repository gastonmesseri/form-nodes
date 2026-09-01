---
title: Installation
---

# Installation

Install Gem Forms alongside Angular 22:

```bash
npm install --save @gem/ng-forms
```

Import only the primitives and validators that your application uses:

```ts
import { field, form, required } from '@gem/ng-forms';
```

The package is distributed as side-effect-free ESM. Consumer bundlers can remove validators and
other exports that are not imported.

## Requirements

- Angular 22
- A TypeScript configuration compatible with Angular 22
- Signals, which are provided by `@angular/core`

See the [complete compatibility table](../project/compatibility.md) before upgrading Angular or Gem
Forms. The Gem Forms version does not mirror the Angular version.

Creating and using `field()` and `form()` does not require an Angular injection context. Angular
dependency injection is used only when an optional integration explicitly needs it.

## Next step

Continue with [Your first form](./first-form.md).
