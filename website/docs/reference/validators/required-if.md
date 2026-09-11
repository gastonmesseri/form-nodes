---
title: requiredIf()
---

import CodeBlock from '@theme/CodeBlock';
import selfReferenceSource from '!!raw-loader!../../../examples/required-if-self-reference.example.ts';

# requiredIf() {#requiredif}

## 🧭 API map {#api-map}

| I want to… | Details |
| --- | --- |
| See every accepted call style | [Signatures](#signatures) |
| Conditionally require a value | [Usage and behavior](#usage-and-behavior) |
| Customize the failure message | [Message configuration](#message-configuration) |
| Understand signal tracking | [Reactive behavior](#reactive-behavior) |
| Compare it with unconditional presence | [`required()`](./required.md) |

## 📐 Signatures {#signatures}

```ts
requiredIf(condition)
requiredIf(condition, message)
requiredIf(condition, options)
```

`condition` should return `boolean`; its declared return type is intentionally unchecked to support self-references. The options customize only the failure message,
which may itself be reactive.

It is a concise alternative to `required({ when })` when the condition does not need the validator
context:

```ts
requiredIf(() => businessAccount())
required({ when: () => businessAccount() })
```

## 📖 Usage and behavior {#usage-and-behavior}

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
[`required()`](./required.md): it rejects `null`, `undefined`, `''`, and `NaN`, while
both `false` and empty arrays, sets, maps, and objects remain present values.
For conditional acceptance, use `requiredTrue({ when: () => condition() })`.

The condition may also depend on a sibling node declared in the same form:

```ts
const myForm = form({
  accountType: field<'personal' | 'business'>('personal'),
  companyName: field('', [
    requiredIf(() => myForm.accountType() === 'business'),
  ]),
});
```

## 💬 Message configuration {#message-configuration}

Pass a string for a static message:

```ts
field('', [requiredIf(() => businessAccount(), 'Enter a company name.')]);
```

Use an options object for a reactive message:

```ts
field('', [
  requiredIf(() => businessAccount(), { message: () => translations().companyNameRequired })
]);
```

Returning `undefined` from the message function continues through node, Angular provider,
process-wide, and built-in message fallbacks. See
[Validator messages](../../guides/validator-messages.md).

## ⚡ Reactive behavior {#reactive-behavior}

Signals read by `condition` are tracked. Changing one invalidates validation and required metadata;
the condition is evaluated again when either state is next consumed. A reactive consumer of
`errors()`, `valid()`, `invalid()`, `validationStatus()`, or `required()` observes the change.

The message function is evaluated only for an active, failing rule. Disabled, readonly, and hidden
nodes skip validation until they become interactive again, while the configured required metadata
continues to reflect the condition.

## 🔗 Related reference {#related-reference}

- [`required()`](./required.md)
- [Built-in validators](../built-in-validators.md)
- [Validation](../validation.md)
- [`field()`](../field.md)

## Class self-references

A condition can reference the form being declared, directly or through a computed signal declared
later in the class. No explicit form type, computed type, or callback return annotation is needed.
The form's fields and the computed signal retain their inferred types.

<CodeBlock language="ts" title="profile-model.ts">{selfReferenceSource}</CodeBlock>

The condition parameter is typed `() => any` to break TypeScript's circular contextual-return
inference, just like parameterless validator callbacks. This means TypeScript does not reject
non-boolean returns: always return a boolean. Parameterless `when` callbacks on other validators support the same convention; callbacks
receiving a context retain their checked boolean result. It does not
cause eager condition evaluation or change reactive tracking. A nullable numeric field still
requires null handling in comparisons, as shown by `?? 0` above.

For custom helper signatures and explicit return-type alternatives, see
[troubleshooting circular type inference](../../guides/validation.md#circular-type-inference).
