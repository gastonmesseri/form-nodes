---
title: Edit server data
---

# Load and edit server data

Declare the form once, then reset it with the complete server response:

```ts
type CustomerResponse = {
  name: string;
  email: string;
  address: {
    city: string;
    country: string;
  };
};

myForm = form({
  name: field(''),
  email: field('', [email]),
  address: {
    city: field(''),
    country: field(''),
  },
});

async loadCustomer(id: string) {
  const response = await fetch(`/api/customers/${id}`);
  const customer = await response.json() as CustomerResponse;

  this.myForm.reset(customer);
}
```

`reset(value)` assigns the complete value and clears dirty and touched state recursively, which is usually what an edit screen needs after loading or saving a snapshot.

Use `set()` when replacing the complete value while preserving interaction state:

```ts
this.myForm.set(customer);
```

Use `patch()` for a partial server event:

```ts
this.myForm.patch({
  address: {
    city: 'Geneva',
  },
});
```

All three operations are programmatic, synchronous, and never control-debounced. `set()` and `reset(value)` require the complete inferred shape; `patch()` rejects unknown keys but permits omitted branches.

See [Value flow and debounce](../guides/value-flow-and-debounce.md).
