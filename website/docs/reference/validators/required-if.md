---
title: requiredIf()
---

# requiredIf()

## API map

| I want to… | Details |
| --- | --- |
| See every accepted call style | [Signatures](#signatures) |
| Conditionally require a value | [Usage and behavior](#usage-and-behavior) |
| Customize the failure message | [Message configuration](#message-configuration) |
| Understand signal tracking | [Reactive behavior](#reactive-behavior) |
| Compare it with unconditional presence | [`required()`](./required.md) |

## Signatures

```ts
requiredIf(condition)
requiredIf(condition, message)
requiredIf(condition, options)
```

`condition` is a function returning `boolean`. The options customize only the failure message,
which may itself be reactive.

## Usage and behavior

Use `requiredIf()` when whether a value is mandatory depends on reactive application or form state:

```ts
const businessAccount = signal(false);

const myForm = form({
  companyName: field('', [requiredIf(() => businessAccount())]),
});

myForm.companyName.required(); // false

businessAccount.set(true);
myForm.companyName.required(); // true
myForm.companyName.getError('required'); // { kind: 'required', ... }
```

When the condition returns `false`, the validator passes and contributes
`required() === false` metadata. When it returns `true`, it behaves exactly like
[`required()`](./required.md): it rejects `null`, `undefined`, `''`, `false`, and `NaN`, while
empty arrays, sets, maps, and objects remain present values.

The condition may also depend on a sibling node declared in the same form:

```ts
const myForm = form({
  accountType: field<'personal' | 'business'>('personal'),
  companyName: field('', [
    requiredIf(() => myForm.accountType() === 'business'),
  ]),
});
```

## Message configuration

Pass a string for a static message:

```ts
field('', [requiredIf(() => businessAccount(), 'Enter a company name.')]);
```

Use an options object for a reactive message:

```ts
field('', [requiredIf(() => businessAccount(), {
  message: () => translations().companyNameRequired,
})]);
```

Returning `undefined` from the message function continues through node, Angular provider,
process-wide, and built-in message fallbacks. See
[Validator messages](../../guides/validator-messages.md).

## Reactive behavior

Signals read by `condition` are tracked. Changing one invalidates validation and required metadata;
the condition is evaluated again when either state is next consumed. A reactive consumer of
`errors()`, `valid()`, `invalid()`, `validationStatus()`, or `required()` observes the change.

The message function is evaluated only for an active, failing rule. Disabled, readonly, and hidden
nodes skip validation until they become interactive again, while the configured required metadata
continues to reflect the condition.

## Related reference

- [`required()`](./required.md)
- [Built-in validators](../built-in-validators.md)
- [Validation](../validation.md)
- [`field()`](../field.md)
