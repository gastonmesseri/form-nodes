---
title: Installation
---

# Installation

Install Form Nodes alongside Angular 21.0.7+ or 22.1.5+:

```bash
npm install --save form-nodes
```

Import only the primitives and validators that your application uses:

```ts
import { field, form, required } from 'form-nodes';
```

The package is distributed as side-effect-free ESM. Consumer bundlers can remove validators and
other exports that are not imported.

## Requirements

- Angular `^21.0.7 || ^22.1.5`
- TypeScript 5.9 for Angular 21, or TypeScript 6.0 for Angular 22
- Signals, which are provided by `@angular/core`

See the [complete compatibility table](../project/compatibility.md) before upgrading Angular or Form Nodes. The Form Nodes version does not mirror the Angular version.

:::tip Forms work outside Angular DI

Creating and using `field()` and `form()` does not require an Angular injection context. Angular
dependency injection is used only when an optional integration explicitly needs it.

:::

## Next step

Continue with [Your first form](./first-form.md).
