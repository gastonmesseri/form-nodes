---
title: dateBetween()
---

# dateBetween()

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
dateBetween(minimum, maximum)
dateBetween(minimum, maximum, message)
dateBetween(minimum, maximum, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## Usage and behavior

Requires a valid date within an inclusive range:

```ts
const myForm = form({
  immediateBookingDate: field<Date>(null, [
    dateBetween('today', '2026-12-31'),
  ]),
  campaignDate: field<Date>(null, [
    dateBetween('2026-08-24', '2026-09-30'),
  ]),
  bookingDate: field<Date>(null, [
    dateBetween(
      () => bookingWindow().start,
      () => bookingWindow().end,
    ),
  ]),
  localDate: field<Date>(null, [
    dateBetween('2026-08-24', '2026-09-30', { parseAs: 'local' }),
  ]),
  messagedDate: field<Date>(null, [
    dateBetween('2026-08-24', '2026-09-30', {
      message: 'Choose a date within the booking window.',
    }),
  ]),
});
```

Both boundaries accept a `Date`, `YYYY-MM-DD`, `'today'`, or a reactive source. `parseAs` applies to both string limits and the shortcut. `null` and invalid current dates pass. If either limit is absent or invalid, the range and both metadata constraints are disabled together. A failure is `{ kind: 'dateBetween', minDate, maxDate, actual, message }`. The normalized boundaries contribute to `min()` and `max()` metadata.

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
