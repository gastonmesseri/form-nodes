---
title: provideFormNodeConfig()
---

# provideFormNodeConfig()

Configures custom-control input synchronization and reactive CSS classes for descendant `[formNode]` bindings.

## Signature

```ts
provideFormNodeConfig(config: {
  syncControlInputs?: boolean; // Default: true
  classes?: Record<string, (binding: FormNodeBinding) => boolean>;
}): Provider[];
```

## Custom-control inputs

`syncControlInputs` defaults to `true`. Set it to `false` to preserve component defaults and
consumer template bindings for these custom-control inputs:

- `disabled`, `disabledReasons`, `readonly`, and `hidden`.
- `dirty`, `touched`, `invalid`, `pending`, and `errors`.
- `required`, `min`, `max`, `minLength`, `maxLength`, and `pattern`.
- `name`.

The option applies to signal controls, separate value/checked input-output pairs, and matching
inputs on custom CVA components. It uses public input names, including aliases. It is read when
the control connects and remains effective when the bound node changes.

Value/checked synchronization, the optional `node` signal, touch, focus, and reset hooks remain
connected. Native controls still receive their state, and CVAs still receive `setDisabledState()`.
Disabling input synchronization does not change the node's own disabled state, validation, or
value behavior. `useControlState()` remains available for explicit state reads.

See [Keep control of your component's inputs](../guides/custom-controls.md#keep-control-of-your-components-inputs)
for a complete application example. Angular's own binding directives use their own configuration.

## Provider scope

The nearest provider supplies the **entire configuration**; configurations are not merged.
A nearer provider that omits `syncControlInputs` restores the default `true`, even if an ancestor
sets it to `false`. Specify both `classes` and `syncControlInputs` in that nearer provider when
both settings should apply. Options are static configuration, not reactive signals.

## CSS classes example

```ts
import type { ApplicationConfig } from '@angular/core';

import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodeConfig } from 'form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodeConfig({
      classes: {
        ...ANGULAR_FORMS_STATUS_CLASSES,
        'has-visible-error': binding => {
          return binding.node().invalid() && binding.node().touched();
        },
      },
    }),
  ],
};
```

Each predicate tracks its own signal dependencies and toggles its class independently. The closest
provider wins; class maps from ancestor providers are not merged automatically.

No classes are configured by default. [`ANGULAR_FORMS_STATUS_CLASSES`](./angular-forms-status-classes.md) supplies `ng-valid`,
`ng-invalid`, `ng-pending`, `ng-pristine`, `ng-dirty`, `ng-untouched`, and `ng-touched`.

This provider can coexist with Angular's `provideSignalFormsConfig({ classes })`. They use
independent tokens and configure their respective binding directives.

See [Configuration](./configuration.md#binding-configuration) and [`[formNode]`](./form-node-binding.md#automatic-css-classes).
