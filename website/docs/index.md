---
slug: /
title: Gem Forms
sidebar_label: Overview
---

# Typed, signal-based forms for Angular

Gem Forms provides small composable primitives for building Angular forms with signals. Create
leaf fields with `field()`, structured values with `form()`, and dynamic collections with
`array()`.

```ts
import { field, form, min, required } from '@gem/ng-forms';

const profile = form({
  name: field('', [required]),
  age: field(23, [min(18)]),
});

const name = profile.name();
profile.name.set('Marco');
profile.valid();
```

The public API works without Angular dependency injection. Bind a node to a native or custom
control with `[formNode]` when a user interface is required.

## Start here

- [Install the package](./getting-started/installation.md)
- [Build your first form](./getting-started/first-form.md)
- [Understand form nodes](./concepts/form-nodes.md)

## Explore the library

- [Create fields, forms, and arrays](./concepts/creating-nodes.md)
- [Work with values and state](./concepts/values-and-state.md)
- [Validate values](./guides/validation.md)
- [Bind native and custom controls](./guides/control-binding.md)
- [Submit a form](./guides/submission.md)
- [Browse the node API](./reference/node-api.md)
