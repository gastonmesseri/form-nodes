---
title: 4. Add nesting and state
---

# 4. Add nesting and reactive state

Group related fields with shorthand objects. Use an explicit `group()` when that branch needs its
own configuration.

The validators from the previous step are omitted here so the nested structure remains easy to
scan. They can stay on the same fields in the complete application without changing how nesting
works.

```ts
readonly useShippingAddress = signal(true);

myForm = form({
  name: field(''),
  age: field<number>(null),
  email: field(''),

  shippingAddress: {
    street: field(''),
    city: field(''),
    postalCode: field(''),
  },

  billingAddress: group({
    street: field(''),
    city: field(''),
    postalCode: field(''),
  }, {
    disabled: () => this.useShippingAddress()
      ? 'Using the shipping address for billing.'
      : false,
  }),
});
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

## Related guides and reference

- [Interaction and availability](../guides/interaction-and-availability.md) documents touched,
  dirty, disabled, readonly, hidden, propagation, and suppression behavior.
- [Tree navigation and API access](../concepts/tree-and-api.md) explains direct children, paths,
  parents, roots, and name collisions.
- [Values and state](../concepts/values-and-state.md) covers nested updates and aggregate state.
- [`group()` reference](../reference/group.md) documents nested shorthand and explicit group options.

Continue with [Step 5: Manage a dynamic array](./05-dynamic-arrays.md).
