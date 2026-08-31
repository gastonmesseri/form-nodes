---
title: required()
---

# required()

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
required
required(message)
required(options)
```

This validator has no configurable constraint value. Its options customize only the failure
message, which may itself be reactive.

## Usage and behavior

Requires a value to be present. It can be passed directly or called with message options:

```ts
const myForm = form({
  name: field('', [required]),
  surname: field('', [required('Enter your surname.')]),
});
```

It rejects `null`, `undefined`, `''`, `false`, and `NaN`. It does **not** reject empty arrays, sets, maps, or objects. Use `minLength(1)` when a collection must contain an item:

```ts
const myForm = form({
  roles: field<string[]>([], [required, minLength(1)]),
});
```

A failure is `{ kind: 'required', message }`. The validator contributes `required() === true` metadata to its node.

## Message configuration

Every failure has a default English message. Where supported, pass a string as the final argument
or use an options object for a static or reactive message, as shown above.

A message function may read signals. Returning `undefined` continues through node, Angular
provider, process-wide, and built-in message fallbacks. See
[Validator messages](../../guides/validator-messages.md).

## Reactive behavior

Reactive constraint functions and message functions track the signals they read. When a resolved
constraint becomes unavailable, validators that support optional constraint sources temporarily
stop contributing their error and metadata.

The validator runs synchronously as part of its node's validator source. Disabled, readonly, and
hidden nodes skip validation until they become interactive again.

## Related reference

- [Built-in validators](../built-in-validators.md)
- [Validation](../validation.md)
- [`validator()`](../validator.md)
