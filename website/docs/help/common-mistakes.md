---
title: Common mistakes
description: Frequent Form Nodes modeling and state mistakes, with corrected examples and explanations.
---

# Common mistakes {#common-mistakes}

Most surprises come from choosing the wrong node boundary or treating programmatic model updates as
if they were user interaction. This page collects the mistakes that are easiest to make when first
using Form Nodes. If something already fails or produces an unexpected result, start with
[Troubleshooting](./troubleshooting.md).

## 📚 Using array() for every array value {#using-array-for-every-array-value}

An array-shaped value does not automatically need an array node.

```ts
// Unnecessarily creates one node for every selected role.
const myForm = form({
  selectedRoles: array(field('')),
});
```

Use a normal field when one control owns the complete array, such as a multi-select:

```ts
const myForm = form({
  selectedRoles: field<string[]>([]),
});
```

```html
<select multiple [formNode]="myForm.selectedRoles">
  <option value="admin">Administrator</option>
  <option value="editor">Editor</option>
</select>
```

Use `array()` only when individual items need their own nodes, bindings, errors, paths, state, or
structural operations. See [Array field or `array()`](../guides/choosing-a-primitive.md#array-field-or-array).

## 🌳 Using a group for an atomic or nullable object {#using-a-group-for-an-atomic-or-nullable-object}

A group represents a permanent child structure. It cannot itself become `null`.

```ts
// Appropriate only when city and country need independent nodes.
const myForm = form({
  shippingAddress: {
    city: field(''),
    country: field(''),
  },
});
```

When one control edits the object as a unit, or the object itself may be absent, use a field:

```ts
type Address = {
  city: string;
  country: string;
};

const myForm = form({
  shippingAddress: field<Address>(),
});

myForm.shippingAddress.set(null);
```

See [Object field or group](../guides/choosing-a-primitive.md#object-field-or-group).

## ⚙️ Forgetting that fields are nullable by default {#forgetting-that-fields-are-nullable-by-default}

An initial string produces `string | null`, not only `string`:

```ts
const myForm = form({
  displayName: field(''),
});

myForm.displayName.set(null); // Valid.
```

Handle `null` as a business value or opt out explicitly when it is genuinely invalid:

```ts
const myForm = form({
  countryCode: field.strict('CH'),
});
```

`form()` and `array()` are structural containers and remain non-null. See
[`field()` nullability](../reference/field.md#nullability).

## 🔌 Reading controlValue() as the normal value {#reading-controlvalue-as-the-normal-value}

`controlValue()` is the immediate representation owned by a directly bound control. It may contain
a value that is still waiting for debounce.

```ts
const myForm = form({
  search: field('', { debounce: 300 }),
});

myForm.search.setControlValue('signals');

myForm.search.controlValue(); // 'signals'
myForm.search();              // '' until committed
```

Call the node itself for normal application logic. Validators and ancestors also observe the
committed node value. See [Value flow and debounce](../guides/value-flow-and-debounce.md).

## 👆 Expecting set() or patch() to mark a node dirty {#expecting-set-or-patch-to-mark-a-node-dirty}

Programmatic writes represent application state changes, not user interaction:

```ts
myForm.displayName.set('Ada');
myForm.patch({ displayName: 'Grace' });

myForm.displayName.dirty(); // false unless it was already dirty
```

A control-originated update marks its directly bound node dirty. If application code is deliberately
simulating user interaction, mark that intent explicitly:

```ts
myForm.displayName.set('Ada');
myForm.displayName.markAsDirty();
```

## ↩️ Expecting reset() to restore the declaration value {#expecting-reset-to-restore-the-declaration-value}

Calling `reset()` keeps the current committed value and clears interaction state:

```ts
myForm.displayName.set('Ada');
myForm.displayName.markAsTouched();
myForm.displayName.reset();

myForm.displayName();        // 'Ada'
myForm.displayName.touched(); // false
```

Pass the value to restore when resetting:

```ts
myForm.displayName.reset('');
```

Aggregate reset applies the same rule recursively. See [Values and state](../concepts/values-and-state.md#reset).

## 🚨 Using errors() for a complete form summary {#using-errors-for-a-complete-form-summary}

`errors()` contains only errors owned directly by the node:

```ts
myForm.errors();    // form-level errors only
myForm.allErrors(); // form and descendant errors
```

A form can be invalid because a child is invalid while `myForm.errors()` remains empty. Use
`allErrors()` for summaries and `errors()` for rules attached to that exact node. See
[Errors and validation status](../guides/errors-and-status.md#own-versus-descendant-errors).

## 🚨 Assuming pending() means invalid {#assuming-pending-means-invalid}

Pending work without a completed error has an unknown result:

```ts
myForm.username.pending();          // true
myForm.username.valid();            // false
myForm.username.invalid();          // false
myForm.username.validationStatus(); // 'unknown'
```

:::info Validity has three observable outcomes

While validation is pending, both `valid()` and `invalid()` can be false and
`validationStatus()` is `'unknown'`. Treat `pending()` as its own state instead of forcing a binary
interpretation or deriving `invalid` as `!valid`.

:::

## 🎛️ Expecting enable() to override every disabled cause {#expecting-enable-to-override-every-disabled-cause}

Effective disabled state can come from local mutable state, reactive configuration, or an ancestor:

```ts
const myForm = form({
  email: field(''),
}, {
  disabled: () => accountLocked(),
});

myForm.email.enable();
// Still disabled while `accountLocked()` is true.
```

`enable()` removes only the field's imperative `disable()` cause. Inspect `disabledReasons()` when
the remaining source is unclear. Readonly and hidden state follow the same layered model.

## 🔌 Expecting hidden() to remove the control from the DOM {#expecting-hidden-to-remove-the-control-from-the-dom}

Hidden is form state, not a rendering instruction. Remove hidden UI explicitly:

```html
@if (myForm.internalNote.visible()) {
  <input [formNode]="myForm.internalNote" />
}
```

Development builds warn when a hidden node remains bound to a rendered control. See
[Interaction and availability](../guides/interaction-and-availability.md#non-interactive-behavior).

## 📖 Reaching for .api in ordinary code {#reaching-for-api-in-ordinary-code}

Direct members are the normal, readable API:

```ts
myForm.displayName.set('Ada');
myForm.contacts.push({ label: 'Work', email: 'ada@example.com' });
myForm.valid();
```

Use `.api` for generic infrastructure or a form child name collision. Use `$api` only when the
`api` name itself collides or infrastructure needs a guaranteed path. See
[Tree navigation and API access](../concepts/tree-and-api.md).

## 📚 Recreating array items when identity matters {#recreating-array-items-when-identity-matters}

Without `trackBy`, complete array updates reuse nodes by position. That can associate touched,
dirty, or pending state with the wrong domain entity after server data is reordered.

```ts
const myForm = form({
  people: array({
    id: field(''),
    name: field(''),
  }, {
    initialValue: initialPeople,
    trackBy: 'id',
  }),
});
```

Use a stable domain key when complete values can arrive in a different order. In Angular templates,
track the node instance rather than `$index`:

```html
@for (person of myForm.people; track person) {
  <input [formNode]="person.name" />
}
```

See [Dynamic arrays](../guides/dynamic-arrays.md#complete-reconciliation).

## ⏳ Returning asyncValidator() from a synchronous validator {#returning-asyncvalidator-from-a-synchronous-validator}

Conditional synchronous composition cannot establish an async validator's lifecycle:

```ts
// Do not return an async validator from this callback.
field('', [() => enabled() ? asyncValidator(checkValue) : null]);
```

Configure it directly and use its reactive `when` option:

```ts
const myForm = form({
  username: field('', [
    asyncValidator(checkUsername, {
      when: () => usernameChecksEnabled(),
    }),
  ]),
});
```

See [`asyncValidator()`](../reference/async-validator.md).

## 🚨 Treating service failures as validation failures automatically {#treating-service-failures-as-validation-failures-automatically}

A rejected async operation contributes no validation error by default. Map infrastructure failure
only when the product should represent it as a validation problem:

```ts
asyncValidator(checkUsername, {
  onError: () => ({
    kind: 'availabilityUnavailable',
    message: 'Username availability could not be checked.',
  }),
});
```

This keeps network failure distinct from a valid domain response such as “username already taken.”

## 🔌 Expecting native controls to bind aggregate nodes {#expecting-native-controls-to-bind-aggregate-nodes}

Native `input`, `select`, and `textarea` elements edit field representations. A form or array can
bind directly only to a custom signal control or CVA that represents its complete value.

```html
<!-- Bind a native element to a leaf field. -->
<input [formNode]="myForm.address.city" />

<!-- A custom aggregate editor may bind the complete nested form. -->
<app-address-editor [formNode]="myForm.address" />
```

See [Advanced custom controls](../guides/custom-controls-advanced.md#aggregate-value-models).

## ⏳ Using NG_ASYNC_VALIDATORS for node async validation {#using-ng_async_validators-for-node-async-validation}

Synchronous `NG_VALIDATORS` from a CVA participate in node validation. `NG_ASYNC_VALIDATORS` are not
adapted because async work needs node-owned cancellation, debounce, dependency tracking, and stale
result protection. Declare it through `asyncValidator()` instead.

If the problem is already happening and its cause is unclear, continue with the upcoming
Troubleshooting guide. For a compact map of the complete public surface, see the
[API overview](../reference/api-overview.md).
