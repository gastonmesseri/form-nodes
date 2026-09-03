---
title: uniqueItems()
---

# uniqueItems()

## API map

| I want to… | Details |
| --- | --- |
| See every accepted call style | [Signatures](#signatures) |
| See common and advanced usage | [Usage and behavior](#usage-and-behavior) |
| Customize messages | [Message configuration](#message-configuration) |
| Understand reactive constraints | [Reactive behavior](#reactive-behavior) |
| Return to the complete catalog | [Built-in validators](../built-in-validators.md) |

## Signatures

```ts
uniqueItems
uniqueItems()
uniqueItems(options)
uniqueItems(propertyKey, options?)
uniqueItems(selectKey, options?)
```

Property selectors read the named property. Function selectors receive each item and may read
signals; those signal reads become reactive dependencies of the validator.

## Usage and behavior

Requires every array item—or a selected item key—to be unique. It supports direct use, an options factory, a property key selector, and a key-selector function:

```ts
const myForm = form({
  roles: array(field(''), {
    initialValue: ['admin', 'admin'],
    validators: [uniqueItems],
  }),
  labelledRoles: array(field(''), {
    initialValue: ['admin', 'admin'],
    validators: [uniqueItems({ message: 'Roles must be unique.' })],
  }),
  explicitRoles: array(field(''), {
    initialValue: ['admin', 'admin'],
    validators: [uniqueItems()],
  }),
  contacts: array({
    email: field(''),
    name: field(''),
  }, {
    initialValue: [
      { email: 'same@example.com', name: 'First' },
      { email: 'same@example.com', name: 'Second' },
    ],
    validators: [uniqueItems('email')],
  }),
  products: array(productTemplate, {
    initialValue: initialProducts,
    validators: [
      uniqueItems<Product>(product => `${tenantId()}:${product.sku}`),
    ],
  }),
});
```

Calling `uniqueItems()` without arguments is equivalent to direct `[uniqueItems]`. Without a key selector, comparison uses SameValueZero like `Set`: `NaN` matches `NaN`, `0` matches `-0`, and objects compare by reference. Property and function key selectors compare their derived keys; key-selector functions may read signals reactively.

`null` and `undefined` pass as empty arrays. Empty and one-item arrays pass. A failure is `{ kind: 'uniqueItems', duplicateIndexes, message }`. It belongs to the array node and reports every participating index in ascending order while deliberately omitting duplicate values.

## Message configuration

Every failure has a default English message. Where supported, pass a string as the final argument
or use an options object for a static or reactive message, as shown above.

A message function may read signals. Returning `undefined` continues through node, Angular
provider, process-wide, and built-in message fallbacks. See
[Validator messages](../../guides/validator-messages.md).

## Reactive behavior

The options object accepts a reactive `when` predicate. Signals read from its validator context are
tracked; while it returns `false`, the rule contributes neither errors nor constraint metadata.

```ts
const enforceUniqueRoles = signal(false);
const roles = field(['admin', 'admin'], [uniqueItems({
  when: () => enforceUniqueRoles(),
})]);
```

Reactive constraint functions and message functions track the signals they read. When a resolved
constraint becomes unavailable, validators that support optional constraint sources temporarily
stop contributing their error and metadata.

The validator runs synchronously as part of its node's validator source. Disabled, readonly, and
hidden nodes skip validation until they become interactive again.

## Related reference

- [Built-in validators](../built-in-validators.md)
- [Validation](../validation.md)
- [`validator()`](../validator.md)
