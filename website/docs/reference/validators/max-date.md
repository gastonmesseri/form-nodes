---
title: maxDate()
---

# maxDate()

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
maxDate(maximum)
maxDate(maximum, message)
maxDate(maximum, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## Usage and behavior

Requires a valid date on or before an inclusive maximum:

```ts
const myForm = form({
  appointment: field<Date>(null, [maxDate('2026-12-31')]),
  todayOnly: field<Date>(null, [maxDate('today')]),
  reactiveAppointment: field<Date>(null, [maxDate(() => bookingWindowEnd())]),
  localAppointment: field<Date>(null, [
    maxDate('2026-12-31', { parseAs: 'local' }),
  ]),
  messagedAppointment: field<Date>(null, [
    maxDate('2026-12-31', 'Choose an earlier date.'),
  ]),
  momentAppointment: field<Date>(null, [
    maxDate(moment('2026-12-31').toDate()),
  ]),
});
```

It accepts the same absolute dates, relative shortcuts, reactive sources, and parsing modes as `minDate`. `null` and invalid current dates pass. An absent or invalid resolved limit disables the constraint. A failure is `{ kind: 'maxDate', maxDate, actual, message }`. The normalized `Date` contributes to `max()` metadata.

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
