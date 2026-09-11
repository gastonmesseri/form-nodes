---
title: Installation
description: Install Form Nodes, check Angular compatibility, and choose the imports for your first component.
---

# Installation {#installation}

Install Form Nodes alongside Angular 21.0.7+ or 22.1.5+:

```bash
npm install --save @ngblocks/form-nodes
```

## 💡 Requirements {#requirements}

- Angular `^21.0.7 || ^22.1.5`
- TypeScript 5.9 for Angular 21, or TypeScript 6.0 for Angular 22
- Signals, which are provided by `@angular/core`

Keep `@angular/common`, `@angular/core`, and `@angular/forms` on matching Angular versions.
They are peer dependencies of Form Nodes; `@angular/common` supplies custom error-template rendering.

See the [complete compatibility table](../project/compatibility.md) before upgrading Angular or Form Nodes. The Form Nodes version does not mirror the Angular version.

## Choose your imports {#choose-your-imports}

Import the primitives and validators used by your model:

```ts
import { field, form, required } from '@ngblocks/form-nodes';
```

For Angular templates and custom controls, add the integration you need:

| Task | Import from `@ngblocks/form-nodes` | Where it goes |
| --- | --- | --- |
| Bind a control or native form with `[formNode]` | [`FormNodeDirective`](../reference/form-node-binding.md) | The component's `imports` array |
| Render `<form-node-errors>` | [`FormNodeErrors`](../reference/form-node-errors.md) | The component's `imports` array |
| Observe form state inside a custom control | [`useFormNodeState`](../reference/form-node-state.md) | Call in the control's class initializer |

The [first-form example](./first-form.md) shows the model, component imports, and template together.
If Angular does not recognize a binding, check the
[directive import troubleshooting section](../help/troubleshooting.md#angular-does-not-recognize-formnode).

The package is distributed as side-effect-free ESM. Consumer bundlers can remove validators and
other exports that are not imported. The published package includes TypeScript declarations,
source maps, the MIT license, and a changelog.

:::tip Forms work outside Angular DI

Creating and using [`field()`](../reference/field.md) and [`form()`](../reference/form.md) does not require an Angular injection context. Angular
dependency injection is used only when an optional integration explicitly needs it.

:::

## 🔗 Next step {#next-step}

Continue with [Your first form](./first-form.md).
