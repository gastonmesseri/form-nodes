---
title: provideFormNodeConfig()
---

# provideFormNodeConfig()

Configures reactive CSS classes for descendant `[formNode]` bindings and `$field`-backed Angular
`[formField]` bindings.

## Signature

```ts
provideFormNodeConfig(config: {
  classes?: Record<string, (binding: FormNodeBinding) => boolean>;
}): Provider[];
```

## Example

```ts
import type { ApplicationConfig } from '@angular/core';

import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodeConfig } from '@gem/ng-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodeConfig({
      classes: {
        ...ANGULAR_FORMS_STATUS_CLASSES,
        'has-visible-error': binding =>
          binding.node().invalid() && binding.node().touched(),
      },
    }),
  ],
};
```

Each predicate tracks its own signal dependencies and toggles its class independently. The closest
provider wins; class maps from ancestor providers are not merged automatically.

No classes are configured by default. `ANGULAR_FORMS_STATUS_CLASSES` supplies `ng-valid`,
`ng-invalid`, `ng-pending`, `ng-pristine`, `ng-dirty`, `ng-untouched`, and `ng-touched`.

Do not combine this provider with `provideSignalFormsConfig({ classes })` in the same injector:
Angular's class configuration token is not multi, so the last provider replaces the first.

See [Configuration](./configuration.md#binding-configuration) and [`[formNode]`](./form-node-binding.md#automatic-css-classes).
