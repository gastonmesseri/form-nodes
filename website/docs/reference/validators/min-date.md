---
title: minDate()
---

# minDate()

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
minDate(minimum)
minDate(minimum, message)
minDate(minimum, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## Usage and behavior

Requires a valid date on or after an inclusive minimum:

```ts
const myForm = form({
  appointment: field<Date>(null, [minDate('2026-08-24')]),
  sameDayAppointment: field<Date>(null, [minDate('today')]),
  reactiveTodayAppointment: field<Date>(null, [minDate(() => 'today')]),
  earliestAppointment: field<Date>(null, [minDate(() => bookingWindowStart())]),
  localAppointment: field<Date>(null, [
    minDate('2026-08-24', {
      parseAs: 'local',
    }),
  ]),
  messagedAppointment: field<Date>(null, [
    minDate('2026-08-24', 'Choose a later date.'),
  ]),
  momentAppointment: field<Date>(null, [
    minDate(moment('2026-08-24').toDate()),
  ]),
});
```

The limit accepts a `Date`, an ISO calendar-date string (`YYYY-MM-DD`), the relative shortcut `'today'`, or a reactive function returning any of them. Strings and the shortcut use UTC midnight by default; `parseAs: 'local'` selects local midnight. The shortcut is resolved when validation runs, so `minDate('today')` does not permanently capture its declaration date. The library does not create a midnight timer; after the day changes, the boundary updates on the next value or reactive dependency change. `null` and invalid current dates pass. An absent or invalid resolved limit disables the constraint. A failure is `{ kind: 'minDate', minDate, actual, message }`. The normalized `Date` contributes to `min()` metadata.

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
