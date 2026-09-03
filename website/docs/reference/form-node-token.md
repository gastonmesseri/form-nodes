---
title: FORM_NODE
---

# FORM_NODE

`FORM_NODE` is the Angular injection token for the concrete `[formNode]` binding on the current
host. Use it when a colocated directive or service needs that exact rendered control.

## Type

```ts
const FORM_NODE: InjectionToken<FormNodeBinding<Node>>;
```

## Same-host injection

```ts
import { Directive, inject } from '@angular/core';

import { FORM_NODE } from '@gem/ng-forms';

@Directive({
  selector: '[focusInvalidNode]',
  host: { '(click)': 'focusWhenInvalid()' },
})
export class FocusInvalidNode {
  private binding = inject(FORM_NODE, { self: true });

  focusWhenInvalid() {
    if (this.binding.node().invalid()) this.binding.focus();
  }
}
```

Use `{ self: true }` to avoid resolving an ancestor control. If the directive also supports hosts
without `[formNode]`, add `optional: true`; injection then returns `null` when absent.

## Binding surface

| Member | Purpose |
| --- | --- |
| `node()` | Current bound node |
| `errors()` | Errors visible to this binding |
| `element` | Host `HTMLElement` |
| `injector` | Host injector |
| `focus(options?)` | Focuses this exact control |
| `flush()` | Commits a pending control value |
| `reset()` | Resets interaction and parsing state |

Rebinding updates `node()` reactively. `FORM_NODE` represents a concrete binding, not merely a
model node; use the node API when code does not care which rendered control is involved.

Most components can use `#binding="formNode"` with `viewChild()` instead of injection.

See [`[formNode]`](./form-node-binding.md) and [Node API](./node-api.md).
