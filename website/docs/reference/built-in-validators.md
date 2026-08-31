---
title: Built-in validators
description: Signatures, examples, empty-value behavior, errors, and metadata for every built-in Gem Forms validator.
---

# Built-in validators

This page documents every built-in validator, including every supported call style and the values each rule intentionally does not reject.

Most format and constraint validators accept an empty value so they compose cleanly with `required`:

```ts
field('', [required, email]);
```

Every built-in failure includes a default English `message`. A static message can be passed directly
as the last argument. Use the options object when the message is reactive or when another option is
needed:

```ts
min(18, 'You must be an adult.');
min(18, { message: () => translations().minimumAge });
minDate('2026-08-24', { parseAs: 'local', message: 'Choose a later date.' });
```

Returning `undefined` from a message function continues through form, provider, global, and built-in message fallbacks. See [Validator messages and i18n](../guides/validator-messages.md).

Constraints passed as functions are reactive. Signals read by them are tracked, and returning `undefined` temporarily disables constraints that support optional sources.

## Validator map

| Need | Validators |
| --- | --- |
| Presence | [`required`](./validators/required.md), [`requiredIf`](./validators/required-if.md) |
| Numeric limits and shape | [`min`](./validators/min.md), [`max`](./validators/max.md), [`between`](./validators/between.md), [`integer`](./validators/integer.md) |
| Text or collection size | [`minLength`](./validators/min-length.md), [`maxLength`](./validators/max-length.md) |
| Word count | [`minWords`](./validators/min-words.md), [`maxWords`](./validators/max-words.md) |
| Text format | [`pattern`](./validators/pattern.md), [`email`](./validators/email.md), [`url`](./validators/url.md) |
| Date limits | [`minDate`](./validators/min-date.md), [`maxDate`](./validators/max-date.md), [`dateBetween`](./validators/date-between.md) |
| Allowed or matching values | [`oneOf`](./validators/one-of.md), [`equalTo`](./validators/equal-to.md) |
| Collection uniqueness | [`uniqueItems`](./validators/unique-items.md) |
| Native/custom-control constraint hints | [Constraint metadata](#constraint-metadata) |
| Bundle behavior | [Tree shaking](#tree-shaking) |

## required

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
  roles: array(field(''), {
    initialValue: [],
    validators: [required, minLength(1)],
  }),
});
```

A failure is `{ kind: 'required', message }`. The validator contributes `required() === true` metadata to its node.

## requiredIf

Requires a value only while a reactive condition is true:

```ts
const businessAccount = signal(false);

const myForm = form({
  companyName: field('', [requiredIf(() => businessAccount())]),
});
```

Signals read by the condition are tracked. While it returns `false`, the rule contributes neither
an error nor required metadata. While it returns `true`, `requiredIf()` has the same empty-value,
message, and `{ kind: 'required' }` behavior as [`required`](./validators/required.md).

## min

Requires a number greater than or equal to an inclusive minimum:

```ts
const myForm = form({
  age: field(16, [min(18)]),
  dependentAge: field(16, [min(() => minimumAge())]),
  employeeAge: field(16, [min(18, 'You must be an adult.')]),
});
```

`null` and `NaN` pass. A reactive minimum returning `undefined` or `NaN` disables the constraint temporarily. A failure is `{ kind: 'min', min, actual, message }`. The resolved limit contributes to `min()` metadata.

## max

Requires a number less than or equal to an inclusive maximum:

```ts
const myForm = form({
  age: field(130, [max(120)]),
  dependentAge: field(130, [max(() => maximumAge())]),
  employeeAge: field(130, [max(120, 'Enter a realistic age.')]),
});
```

`null` and `NaN` pass. A reactive maximum returning `undefined` or `NaN` disables the constraint temporarily. A failure is `{ kind: 'max', max, actual, message }`. The resolved limit contributes to `max()` metadata.

## between

Requires a number within an inclusive range:

```ts
const myForm = form({
  age: field(17, [between(18, 65)]),
  dependentAge: field(70, [
    between(
      () => allowedAge().minimum,
      () => allowedAge().maximum,
    ),
  ]),
  employeeAge: field(70, [
    between(18, 65, 'Enter an age within the supported range.'),
  ]),
});
```

`null` and `NaN` pass. If either boundary resolves to `undefined` or `NaN`, the complete range is temporarily disabled. A failure is `{ kind: 'between', min, max, actual, message }`. Both boundaries contribute to `min()` and `max()` metadata.

## integer

Requires a JavaScript safe integer. It can be passed directly or called with message options:

```ts
const myForm = form({
  quantity: field(1.5, [integer]),
  attempts: field(1.5, [
    integer('Enter a whole number.'),
  ]),
});
```

It uses `Number.isSafeInteger()`, rejecting decimals, `NaN`, infinities, and integers outside JavaScript's exactly representable safe range. `null` passes. A failure is `{ kind: 'integer', actual, message }`.

## minLength

Requires a numeric `length` or `size` to meet a minimum:

```ts
const myForm = form({
  password: field('', [required, minLength(12)]),
  dependentPassword: field('', [minLength(() => minimumPasswordLength())]),
  tags: array(field(''), {
    initialValue: [],
    validators: [minLength(2, 'Choose more tags.')],
  }),
});
```

It supports strings, arrays, sets, maps, and other values with numeric `length` or `size`. `null` and `''` pass, but empty collections are measured normally. A reactive minimum returning `undefined` disables the constraint. A failure is `{ kind: 'minLength', minLength, actual, message }`. The resolved limit contributes to `minLength()` metadata.

## maxLength

Requires a numeric `length` or `size` not to exceed a maximum:

```ts
const myForm = form({
  biography: field('', [maxLength(500)]),
  dependentBiography: field('', [maxLength(() => biographyLimit())]),
  tags: array(field(''), {
    initialValue: ['angular'],
    validators: [maxLength(10, 'Choose at most 10 tags.')],
  }),
});
```

It supports the same `length` and `size` values as `minLength`. `null` and `''` pass, while empty collections are measured normally. A reactive maximum returning `undefined` disables the constraint. A failure is `{ kind: 'maxLength', maxLength, actual, message }`. The resolved limit contributes to `maxLength()` metadata.

## minWords

Requires a non-empty string to contain at least a number of words:

```ts
const myForm = form({
  summary: field('', [required, minWords(3)]),
  description: field('', [minWords(() => minimumWords())]),
  biography: field('', [minWords(3, 'Add more detail.')]),
});
```

`null` and `''` pass. A reactive minimum returning `undefined` or `NaN` disables the constraint. A word is a Unicode letter-or-number sequence that may contain internal apostrophes or hyphens, so `L'été` and `well-known` each count as one word. A failure is `{ kind: 'minWords', minWords, actual, message }`, where `actual` is the observed word count.

## maxWords

Requires a non-empty string to contain no more than a number of words:

```ts
const myForm = form({
  biography: field('', [maxWords(100)]),
  description: field('', [maxWords(() => maximumWords())]),
  summary: field('', [maxWords(100, 'Keep it concise.')]),
});
```

`null` and `''` pass. A reactive maximum returning `undefined` or `NaN` disables the constraint. It uses the same Unicode word definition as `minWords`. A failure is `{ kind: 'maxWords', maxWords, actual, message }`.

## pattern

Requires a non-empty string to match a regular expression:

```ts
const myForm = form({
  code: field('', [pattern(/^[A-Z]{3}-\d{4}$/)]),
  username: field('', [pattern(() => configuredPattern())]),
  countryCode: field('', [pattern(/^[A-Z]+$/, 'Use letters only.')]),
});
```

`null` and `''` pass. A reactive expression returning `undefined` disables the constraint. The expression's `lastIndex` is reset before every check, so global and sticky regular expressions do not reuse stale match state. A failure is `{ kind: 'pattern', pattern, actual, message }`. Every active expression appears in `pattern()` metadata.

## email

Validates Angular's standard email-address format. It can be passed directly or called with message options:

```ts
const myForm = form({
  email: field('', [required, email]),
  workEmail: field('', [
    email('Enter a valid work email.'),
  ]),
});
```

`null` and `''` pass. Use `required` when the address must be present. The format includes local-part, domain-label, and total-length restrictions. A failure is `{ kind: 'email', message }`; the rejected address is intentionally omitted from the error.

## url

Validates an absolute WHATWG URL. It can be passed directly or called with message options:

```ts
const myForm = form({
  website: field('', [required, url]),
  documentationUrl: field('', [
    url('Enter a complete URL.'),
  ]),
});
```

`null` and `''` pass. The validator uses `new URL(value)` without a base URL. It accepts absolute URLs with any valid scheme—including `https:`, `mailto:`, and custom schemes—but rejects relative references such as `/account`. A failure is `{ kind: 'url', message }`; the rejected URL is intentionally omitted.

## minDate

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

## maxDate

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

## dateBetween

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

## oneOf

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

## equalTo

Requires a value to equal a static or reactive expected value using `Object.is()`:

```ts
const password = field('');
const myForm = form({
  termsAccepted: field(false, [equalTo(true)]),
  password,
  confirmation: field('', [equalTo(() => password())]),
  confirmedTerms: field(false, [
    equalTo(true, 'You must accept the terms.'),
  ]),
});
```

Unlike optional format validators, `null` and `undefined` are compared as real values rather than skipped. Signals read by the expected-value source are tracked. A failure is `{ kind: 'equalTo', message }`; both compared values are deliberately omitted so confirmation errors do not expose secrets.

## uniqueItems

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

## Constraint metadata

Built-in constraints expose state even when the current value is valid:

```ts
age.min();
age.max();
password.minLength();
password.maxLength();
code.pattern();
name.required();
```

Multiple minimum constraints expose the strictest, largest minimum; multiple maximum constraints expose the strictest, smallest maximum. `pattern()` contains every active expression. Conditionally composed validators contribute metadata only while their branch is active. `[formNode]` forwards applicable metadata to native and compatible custom controls.

## Tree shaking

Validators are independent, side-effect-free exports. Consumer bundlers can remove validators and default messages that an application does not import; every validator remains available in the published package itself.

For authoring application-specific rules, see the [`validator()` reference](./validator.md)
and [`asyncValidator()` reference](./async-validator.md).
