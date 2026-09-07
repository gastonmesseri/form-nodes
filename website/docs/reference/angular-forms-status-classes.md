---
title: ANGULAR_FORMS_STATUS_CLASSES
---

# ANGULAR_FORMS_STATUS_CLASSES {#angular_forms_status_classes}

`ANGULAR_FORMS_STATUS_CLASSES` is a ready-made reactive class map for applications whose styles
expect Angular Forms status classes. It is an ordinary object, not a provider by itself.

## 📐 Type {#type}

```ts
const ANGULAR_FORMS_STATUS_CLASSES:
  NonNullable<FormNodesConfig['classes']>;
```

## 📖 Usage {#usage}

```ts
import type { ApplicationConfig } from '@angular/core';
import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      classes: ANGULAR_FORMS_STATUS_CLASSES,
    }),
  ],
};
```

## 💡 Included classes {#included-classes}

| Class | Active state |
| --- | --- |
| `ng-valid` | `binding.node().valid()` |
| `ng-invalid` | `binding.node().invalid()` |
| `ng-pending` | `binding.node().pending()` |
| `ng-pristine` | `binding.node().pristine()` |
| `ng-dirty` | `binding.node().dirty()` |
| `ng-untouched` | `binding.node().untouched()` |
| `ng-touched` | `binding.node().touched()` |

Opposite classes update together. The preset only reflects state; classes never mutate the node.
No automatic status classes are installed by default.

## ↩️ Extend the preset {#extend-the-preset}

```ts
provideFormNodesConfig({
  classes: {
    ...ANGULAR_FORMS_STATUS_CLASSES,
    'is-readonly': binding => binding.node().readonly(),
    'has-visible-error': binding =>
      binding.node().invalid() && binding.node().touched(),
  },
});
```

Each predicate tracks its dependencies independently. Through `provideFormNodesConfig()`, the map
applies to descendant `[formNode]` bindings.

See [`provideFormNodesConfig()`](./provide-form-nodes-config.md) and
[`[formNode]`](./form-node-binding.md#automatic-css-classes).
