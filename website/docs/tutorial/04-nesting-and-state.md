---
title: 4. Add nesting and state
---

# 4. Add nesting and reactive state

Group related fields with shorthand objects. Use an explicit nested `form()` when that branch needs its own configuration.

```ts
readonly useShippingAddress = signal(true);

myForm = form({
  name: field('', [required, minLength(2)]),
  age: field<number>(null, [between(18, 120), integer]),
  email: field('', [required, email]),

  shippingAddress: {
    street: field('', [required]),
    city: field('', [required]),
    postalCode: field('', [required]),
  },

  billingAddress: form({
    street: field('', [required]),
    city: field('', [required]),
    postalCode: field('', [required]),
  }, {
    disabled: () => this.useShippingAddress()
      ? 'Using the shipping address for billing.'
      : false,
  }),
});
```

Add `signal` to the Angular import:

```ts
import { Component, signal } from '@angular/core';
```

The billing branch reacts to `useShippingAddress()` automatically. While disabled:

- Its values remain readable and writable.
- Its errors and pending state are suppressed.
- It does not make the root invalid.
- `disabledReasons()` retains the message and source node.

Nested values and access remain direct:

```ts
this.myForm.shippingAddress.city(); // ''
this.myForm.billingAddress.disabled();
this.myForm.patch({
  shippingAddress: {
    city: 'Zurich',
  },
});
```

Continue with [Step 5: Manage a dynamic array](./05-dynamic-arrays.md).
