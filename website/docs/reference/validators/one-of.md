---
title: oneOf()
---

# oneOf()

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
oneOf(allowedValues)
oneOf(allowedValues, message)
oneOf(allowedValues, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## Usage and behavior

Requires a non-empty value to equal one of the allowed values:

```ts
const myForm = form({
  status: field('draft', [oneOf(['draft', 'published'])]),
  reactiveStatus: field('draft', [oneOf(() => availableStatuses())]),
  publicationStatus: field('draft', [
    oneOf(['draft', 'published'], 'Choose an available status.'),
  ]),
});
```

`null`, `undefined`, and `''` pass. A reactive source returning `undefined` disables the constraint. Membership uses `Array.prototype.includes`: `NaN` matches `NaN`, while objects compare by reference. A failure is `{ kind: 'oneOf', options, actual, message }`.

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
const restrictStatus = signal(false);
const status = field('archived', [oneOf(['draft', 'published'], {
  when: () => restrictStatus(),
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
