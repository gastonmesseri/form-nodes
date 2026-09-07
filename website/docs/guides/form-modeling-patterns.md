---
title: Form modeling patterns
description: Design Form Nodes trees around domain ownership, UI interaction, nullability, repeated data, validation, and server boundaries.
---

# Form modeling patterns {#form-modeling-patterns}

A good form model describes how the application edits data, not only the final TypeScript shape.
Two screens can submit identical JSON while needing different node trees because their controls,
validation boundaries, or item lifecycles differ.

## 🚀 Start with ownership and lifecycle {#start-with-ownership-and-lifecycle}

Ask these questions for every value:

1. Is it edited as one replaceable value or through independent controls?
2. Is its structure fixed or can users add, remove, and reorder entries?
3. Can the value itself be absent?
4. Which node should own its validation and interaction state?
5. Does its identity need to survive a server refresh or reorder?

| Modeling need | Recommended primitive |
| --- | --- |
| One control owns one complete value | `field()` |
| Fixed named properties need independent nodes | Nested object shorthand or `group()` |
| Object tree owns a submission workflow | `form()` |
| Repeated items need independent nodes | `array()` |
| Nullable object or collection edited atomically | Object- or array-valued `field()` |
| Runtime collection of keyed entries | `array()` of `{ key, value }` forms, or one record-valued `field()` |

The detailed feature comparison is in [Choosing a primitive](./choosing-a-primitive.md).

## 🔌 Model control ownership, not JavaScript shape {#model-control-ownership-not-javascript-shape}

An object does not automatically require a nested form. If a map picker edits coordinates as one
value, keep it atomic:

```ts
type Coordinates = {
  latitude: number;
  longitude: number;
};

const locationForm = form({
  coordinates: field<Coordinates>(),
});
```

If two inputs edit the same value independently, expose child nodes:

```ts
const locationForm = form({
  coordinates: {
    latitude: field<number>(null),
    longitude: field<number>(null),
  },
});
```

The first model has one touched state, one error list, and one binding boundary. The second has
independent paths, errors, touched state, and bindings for latitude and longitude.

The same rule applies to arrays. A multi-select normally owns one array-valued field:

```ts
const permissionsForm = form({
  selectedRoleIds: field<string[]>([]),
});
```

A list editor where every row has controls needs `array()`:

```ts
const teamForm = form({
  members: array({
    id: field(''),
    displayName: field(''),
  }),
});
```

## 🌳 Use shorthand for ordinary nested objects {#use-shorthand-for-ordinary-nested-objects}

Plain nested objects are the least cluttered representation of fixed structure:

```ts
const profileForm = form({
  displayName: field(''),
  address: {
    street: field(''),
    city: field(''),
    countryCode: field(''),
  },
});
```

Use explicit `group()` only when that boundary needs its own options or validators:

```ts
const profileForm = form({
  displayName: field(''),
  address: group({
    street: field(''),
    city: field(''),
    countryCode: field(''),
  }, {
    disabled: () => !permissions().canEditAddress,
  }),
});
```

This keeps ordinary hierarchy visually obvious while making exceptional behavior explicit.

## 🧭 Treat nullability as a domain decision {#treat-nullability-as-a-domain-decision}

:::tip Model absence deliberately

Nullable is the default because empty controls commonly represent no value. Use
`field.strict()` only when `null` is invalid throughout the domain, not merely because the
initial value happens to be present.

:::

Fields are nullable by default because an input can commonly represent no value. Use
`field.strict()` when the model must always contain a value:

```ts
const accountForm = form({
  username: field(''),       // string | null
  email: field.strict(''),   // string
});
```

Here, `username` may be absent from the domain model, so its complete API uses `string | null`.
The application always represents `email` as a string, even while the control is empty, so
`field.strict('')` preserves `string` without adding `null`. Strict nullability does not mean that
the string is non-empty or valid; add `required`, `email`, or other validators separately when the
UI needs those rules.

Do not use a group for a nullable object merely to obtain child syntax. Groups, forms, and arrays
are permanent containers. When the complete object can be missing, choose an object-valued
field or model the absence explicitly with a sibling field:

```ts
type Company = {
  name: string;
  registrationNumber: string;
};

const employmentForm = form({
  employer: field<Company>(),
});
```

## 💡 Give repeated domain entities stable identity {#give-repeated-domain-entities-stable-identity}

When complete values can be refreshed or reordered, use a stable domain key:

```ts
const orderForm = form({
  lines: array({
    id: field(''),
    productId: field(''),
    quantity: field(1),
  }, {
    initialValue: order.lines,
    trackBy: 'id',
  }),
});
```

With `trackBy`, incoming values reuse matching item nodes. Touched, dirty, validation, and pending
work stay attached to the same logical entity. Without it, complete updates reconcile by position.

Use client-generated stable IDs for unsaved rows if the server has not assigned IDs yet. Do not use
an editable label, array index, or another value that can collide as identity.

In Angular templates, track the live node:

```html
@for (line of orderForm.lines; track line) {
  <input type="number" [formNode]="line.quantity" />
}
```

See [Dynamic arrays](./dynamic-arrays.md#complete-reconciliation).

## ✅ Put validation at the smallest owning boundary {#put-validation-at-the-smallest-owning-boundary}

Field rules belong to fields, relationships belong to forms, and collection invariants belong to
arrays:

```ts
const registrationForm = form({
  credentials: form({
    password: field('', [required, minLength(12)]),
    confirmation: field('', [required]),
  }, [({ value }) => {
    return value().password === value().confirmation
      ? null
      : { kind: 'passwordMismatch' };
  }]),
  aliases: array(field(''), {
    validators: [uniqueItems],
  }),
});
```

This gives each error a meaningful `targetNode` and keeps rendering straightforward:

- Input errors come from the field's `errors()`.
- Relationship errors come from `credentials.errors()`.
- A page summary comes from `registrationForm.allErrors()`.

Avoid copying the same relationship error onto several fields. Focus or render the owning form
error near the related controls instead. See [Errors and validation status](./errors-and-status.md).

## 🎛️ Derive availability instead of duplicating state {#derive-availability-instead-of-duplicating-state}

When permissions or business state already exist as signals, derive form availability from them:

```ts
const accountForm = form({
  username: field(''),
  billingEmail: field('', {
    disabled: () => account().locked
      ? 'The account is locked.'
      : false,
    readonly: () => !permissions().canEditBilling,
    hidden: () => !features().billing,
  }),
});
```

Do not mirror those signals into additional mutable booleans with effects. Reactive options track
their dependencies and preserve the reason that caused a node to become disabled.

Use imperative `disable()`, `markAsReadonly()`, and `hide()` for genuinely imperative temporary
causes, not as synchronization mechanisms for other application state.

## 💡 Separate presentation from participation {#separate-presentation-from-participation}

Angular control flow decides what is rendered. Form Nodes `hidden` state decides whether a node
participates in validation and aggregate interaction state.

:::warning Hidden is form state, not DOM state

`hidden()` suppresses validation participation but does not remove an element. Use Angular `@if`
for rendering, and combine both only when the branch should be absent from the DOM and the form.

:::

Use `@if` alone when a step is temporarily not visible but should remain part of form validity:

```html
@if (activeStep() === 2) {
  <input [formNode]="checkoutForm.shippingAddress.city" />
}
```

Use the node's `hidden` option when the business rule says that branch currently does not
participate:

```ts
const hasCompanyDetails = field(false);

const checkoutForm = form({
  hasCompanyDetails,
  company: form({
    name: field('', [required]),
    taxId: field('', [required]),
  }, {
    hidden: () => !hasCompanyDetails(),
  }),
});
```

Hidden state does not remove DOM. Pair it with `@if` when both semantics are wanted. See
[Interaction and availability](./interaction-and-availability.md).

## 🔌 Normalize server DTOs at the boundary {#normalize-server-dtos-at-the-boundary}

Transport types often do not match UI value types. Convert them before writing to the form and
serialize them again during submission:

```ts
type CustomerResponse = {
  displayName: string;
  birthDate: string | null;
};

const customerForm = form({
  displayName: field(''),
  birthDate: field<Date>(),
});

function loadCustomer(customer: CustomerResponse) {
  customerForm.reset({
    displayName: customer.displayName,
    birthDate: customer.birthDate === null
      ? null
      : new Date(customer.birthDate),
  });
}
```

This keeps controls and validators working with one consistent domain type. Avoid scattering date
parsing, missing-value normalization, or API naming conversions across individual controls.

Choose the write operation from intent:

| Intent | Operation |
| --- | --- |
| Load or accept a new baseline and clear interaction state | `reset(value)` |
| Replace the complete current model while preserving state | `set(value)` |
| Apply a partial server or UI update | `patch(partial)` |

See [Load and edit server data](../cookbook/edit-server-data.md).

## 📝 Model runtime-keyed data deliberately {#model-runtime-keyed-data-deliberately}

`form()` has a fixed, statically typed child set. If users can create arbitrary keys, choose one of
these representations:

```ts
const metadataAsOneValue = field<Record<string, string>>({});

const metadataAsRows = array({
  key: field(''),
  value: field(''),
});
```

Use the record-valued field when one editor owns the complete object. Use array rows when every
entry needs its own binding, error, path, or add/remove lifecycle. Convert rows to a record at the
server boundary if necessary.

## 💡 Create fresh reusable definitions {#create-fresh-reusable-definitions}

Extract factories for repeated fixed structures. Return fresh nodes each time; one live node should
not be attached to two parents:

```ts
function createAddressFields() {
  return {
    street: field(''),
    city: field(''),
    countryCode: field(''),
  };
}

const checkoutForm = form({
  shippingAddress: createAddressFields(),
  billingAddress: createAddressFields(),
});
```

For repeated dynamic items, pass a template or factory to `array()`; the array owns cloning and
fresh runtime state.

## 🧩 Partition large forms by domain sections {#partition-large-forms-by-domain-sections}

Large forms remain readable when top-level children match product concepts rather than visual CSS
containers:

```ts
const onboardingForm = form({
  account: {
    email: field(''),
    username: field(''),
  },
  profile: {
    displayName: field(''),
    biography: field(''),
  },
  addresses: {
    shipping: createAddressFields(),
    billing: createAddressFields(),
  },
  contacts: array({
    label: field(''),
    value: field(''),
  }),
});
```

This gives each section a natural focus, validation, touch, reset, and testing boundary. A
multi-step UI can render one branch at a time while retaining one complete typed value. See the
[multi-step recipe](../cookbook/multi-step-form.md) and [complete form example](../examples/complex-form.md).

## 🔌 Keep one submission boundary per workflow {#keep-one-submission-boundary-per-workflow}

Configure submission on the form that owns the complete operation. Nested forms remain useful
validation and focus boundaries without needing separate actions:

```ts
const checkoutForm = form({
  customer: {
    email: field(''),
  },
  shippingAddress: createAddressFields(),
  lines: array({
    productId: field(''),
    quantity: field(1),
  }),
}, {
  onSubmit: value => placeOrder(value),
});
```

Use separate root forms when sections are saved independently, have different lifecycles, or can be
submitted without the rest of the screen.

## 🧪 Review checklist {#review-checklist}

Before finalizing a model, check that:

- Every `field()` represents one atomic interaction boundary.
- Every nested object has a fixed set of meaningful child nodes.
- Every `array()` item needs independent state or structural operations.
- Nullable fields represent real absence, not an accidental initialization shortcut.
- Reconciled domain entities have stable `trackBy` identity.
- Validators live on the smallest node that owns their rule.
- `hidden` means non-participating, not merely not rendered.
- Server parsing and serialization happen at the boundary.
- Reusable definitions create fresh nodes.
- Submission is configured at the workflow boundary.

For API-level details, continue with [`field()`](../reference/field.md),
[`form()`](../reference/form.md), and [`array()`](../reference/array.md).
