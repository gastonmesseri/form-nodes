# TODO Validators

Consolidated list of common validators officially included in Vue validation libraries such as **VeeValidate**, **Vuelidate**, and **FormKit**.

> Names are normalized to avoid naming differences between libraries. For example, `minLength` is explicitly distinguished from `minValue`.

## Presence

| Validator        | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| `required`       | Value must not be empty.                                               |
| `requiredIf`     | Value is required when a condition is true.                            |
| `requiredUnless` | Value is required unless a condition is true.                          |
| `requireOne`     | At least one value from a group must be present.                       |
| `accepted`       | Value must represent an accepted state, such as `true`, `yes`, or `1`. |

## Length

| Validator   | Description                                      |
| ----------- | ------------------------------------------------ |
| `minLength` | Minimum string, array, or collection length.     |
| `maxLength` | Maximum string, array, or collection length.     |
| `length`    | Exact length or length within a specified range. |

## Numbers

| Validator  | Description                                               |
| ---------- | --------------------------------------------------------- |
| `number`   | Value must be a number.                                   |
| `numeric`  | Value must contain numeric characters only.               |
| `integer`  | Value must be an integer.                                 |
| `decimal`  | Value must be a decimal number.                           |
| `digits`   | Value must contain exactly a specified number of digits.  |
| `minValue` | Numeric value must be greater than or equal to a minimum. |
| `maxValue` | Numeric value must be less than or equal to a maximum.    |
| `between`  | Numeric value must be between a minimum and maximum.      |

## Characters

| Validator      | Description                                             |
| -------------- | ------------------------------------------------------- |
| `alpha`        | Only alphabetic characters are allowed.                 |
| `alphanumeric` | Only alphabetic and numeric characters are allowed.     |
| `alphaDash`    | Letters, numbers, underscores, and hyphens are allowed. |
| `alphaSpaces`  | Letters and spaces are allowed.                         |
| `lowercase`    | Value must contain lowercase characters only.           |
| `uppercase`    | Value must contain uppercase characters only.           |
| `symbol`       | Value must contain symbols only.                        |

## Character Composition

| Validator              | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `containsAlpha`        | Must contain at least one alphabetic character. |
| `containsAlphanumeric` | Must contain at least one letter or number.     |
| `containsAlphaSpaces`  | Must contain alphabetic characters or spaces.   |
| `containsLowercase`    | Must contain at least one lowercase character.  |
| `containsUppercase`    | Must contain at least one uppercase character.  |
| `containsNumeric`      | Must contain at least one numeric character.    |
| `containsSymbol`       | Must contain at least one symbol.               |

## Strings

| Validator    | Description                                        |
| ------------ | -------------------------------------------------- |
| `startsWith` | Value must start with a specified string or value. |
| `endsWith`   | Value must end with a specified string or value.   |

## Formats

| Validator    | Description                          |
| ------------ | ------------------------------------ |
| `email`      | Value must be a valid email address. |
| `url`        | Value must be a valid URL.           |
| `ipAddress`  | Value must be a valid IP address.    |
| `macAddress` | Value must be a valid MAC address.   |

## Comparison

| Validator   | Description                                              |
| ----------- | -------------------------------------------------------- |
| `sameAs`    | Value must equal another value or field.                 |
| `notSameAs` | Value must differ from another value or field.           |
| `is`        | Value must equal a specified value.                      |
| `isNot`     | Value must not equal a specified value.                  |
| `oneOf`     | Value must belong to a predefined set of allowed values. |
| `notOneOf`  | Value must not belong to a predefined set of values.     |

## Patterns

| Validator | Description                            |
| --------- | -------------------------------------- |
| `regex`   | Value must match a regular expression. |

## Dates

| Validator     | Description                                   |
| ------------- | --------------------------------------------- |
| `dateAfter`   | Date must occur after a specified date.       |
| `dateBefore`  | Date must occur before a specified date.      |
| `dateBetween` | Date must fall within a specified date range. |
| `dateFormat`  | Date must match a specified format.           |

## Files

| Validator         | Description                           |
| ----------------- | ------------------------------------- |
| `fileExtension`   | File must have an allowed extension.  |
| `mimeType`        | File must have an allowed MIME type.  |
| `image`           | File must be an image.                |
| `imageDimensions` | Image must have specified dimensions. |
| `fileSize`        | File must satisfy a size constraint.  |

## Logical Composition

| Validator | Description                                |
| --------- | ------------------------------------------ |
| `and`     | All provided validators must pass.         |
| `or`      | At least one provided validator must pass. |
| `not`     | Negates another validator.                 |

---

## Complete Validator List

```text
required
requiredIf
requiredUnless
requireOne
accepted

minLength
maxLength
length

number
numeric
integer
decimal
digits
minValue
maxValue
between

alpha
alphanumeric
alphaDash
alphaSpaces
lowercase
uppercase
symbol

containsAlpha
containsAlphanumeric
containsAlphaSpaces
containsLowercase
containsUppercase
containsNumeric
containsSymbol

startsWith
endsWith

email
url
ipAddress
macAddress

sameAs
notSameAs
is
isNot
oneOf
notOneOf

regex

dateAfter
dateBefore
dateBetween
dateFormat

fileExtension
mimeType
image
imageDimensions
fileSize

and
or
not
```

## Library Name Equivalences

Some libraries use different names for equivalent concepts:

| Normalized             | VeeValidate               | Vuelidate        | FormKit                 |
| ---------------------- | ------------------------- | ---------------- | ----------------------- |
| `required`             | `required`                | `required`       | `required`              |
| `requiredIf`           | `required_if`*            | `requiredIf`     | —                       |
| `requiredUnless`       | —                         | `requiredUnless` | —                       |
| `requireOne`           | —                         | —                | `require_one`           |
| `accepted`             | —                         | —                | `accepted`              |
| `minLength`            | `min`                     | `minLength`      | `min`                   |
| `maxLength`            | `max`                     | `maxLength`      | `max`                   |
| `length`               | `length`                  | —                | `length`                |
| `number`               | —                         | —                | `number`                |
| `numeric`              | `numeric`                 | `numeric`        | —                       |
| `integer`              | `integer`                 | `integer`        | —                       |
| `decimal`              | —                         | `decimal`        | —                       |
| `digits`               | `digits`                  | —                | —                       |
| `minValue`             | `min_value`               | `minValue`       | —                       |
| `maxValue`             | `max_value`               | `maxValue`       | —                       |
| `between`              | `between`                 | `between`        | `between`               |
| `alpha`                | `alpha`                   | `alpha`          | `alpha`                 |
| `alphanumeric`         | `alpha_num`               | `alphaNum`       | `alphanumeric`          |
| `alphaDash`            | `alpha_dash`              | —                | —                       |
| `alphaSpaces`          | `alpha_spaces`            | —                | `alpha_spaces`          |
| `lowercase`            | —                         | —                | `lowercase`             |
| `uppercase`            | —                         | —                | `uppercase`             |
| `symbol`               | —                         | —                | `symbol`                |
| `containsAlpha`        | —                         | —                | `contains_alpha`        |
| `containsAlphanumeric` | —                         | —                | `contains_alphanumeric` |
| `containsAlphaSpaces`  | —                         | —                | `contains_alpha_spaces` |
| `containsLowercase`    | —                         | —                | `contains_lowercase`    |
| `containsUppercase`    | —                         | —                | `contains_uppercase`    |
| `containsNumeric`      | —                         | —                | `contains_numeric`      |
| `containsSymbol`       | —                         | —                | `contains_symbol`       |
| `startsWith`           | —                         | —                | `starts_with`           |
| `endsWith`             | —                         | —                | `ends_with`             |
| `email`                | `email`                   | `email`          | `email`                 |
| `url`                  | `url`                     | `url`            | `url`                   |
| `ipAddress`            | —                         | `ipAddress`      | —                       |
| `macAddress`           | —                         | `macAddress`     | —                       |
| `sameAs`               | `confirmed`               | `sameAs`         | `confirm`               |
| `is`                   | `is`                      | —                | `is`                    |
| `isNot`                | `is_not`                  | —                | —                       |
| `oneOf`                | `one_of`                  | —                | —                       |
| `notOneOf`             | `not_one_of` / `excluded` | —                | —                       |
| `regex`                | `regex`                   | —                | `matches`               |
| `dateAfter`            | —                         | —                | `date_after`            |
| `dateBefore`           | —                         | —                | `date_before`           |
| `dateBetween`          | —                         | —                | `date_between`          |
| `dateFormat`           | —                         | —                | `date_format`           |
| `fileExtension`        | `ext`                     | —                | —                       |
| `mimeType`             | `mimes`                   | —                | —                       |
| `image`                | `image`                   | —                | —                       |
| `imageDimensions`      | `dimensions`              | —                | —                       |
| `fileSize`             | `size`                    | —                | —                       |
| `and`                  | —                         | `and`            | —                       |
| `or`                   | —                         | `or`             | —                       |
| `not`                  | —                         | `not`            | `not`                   |

* Availability/name can depend on the VeeValidate version.

## Naming Convention

For a unified validation API, prefer explicit names:

```text
minLength / maxLength
```

for collection/string length, and:

```text
minValue / maxValue
```

for numeric bounds.

This avoids the ambiguity present in libraries where `min` and `max` may refer to length rather than numeric value.
