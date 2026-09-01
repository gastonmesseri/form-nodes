---
title: createFormPrimitives()
description: Create form primitives with a shared field-nullability default.
---

import CodeBlock from '@theme/CodeBlock';

import createFormPrimitivesSource from '!!raw-loader!../../examples/create-form-primitives.typecheck.ts';

# `createFormPrimitives()`

`createFormPrimitives()` creates an isolated set of `form`, `field`, `group`, and `array` factories with a
shared default for field nullability. Use it when an application wants fields to be non-nullable
unless a declaration explicitly opts into `null`.

The package-level factories remain nullable by default. Creating a configured set does not change
them or any other configured set.

## Signature

```ts
createFormPrimitives();
createFormPrimitives(options?);
```

The options object and its `nullable` property are optional. Omitting either uses `nullable: true`:

```ts
const defaultForms = createFormPrimitives();
const explicitDefaultForms = createFormPrimitives({});

defaultForms.field('');         // Field<string | null>
explicitDefaultForms.field(''); // Field<string | null>
```

## Create non-nullable factories

<CodeBlock language="ts" title="create-form-primitives.typecheck.ts">{createFormPrimitivesSource}</CodeBlock>

Here, `field('')` and the `city: ''` shorthand both produce `Field<string>`. An explicit
`{ nullable: true }` continues to produce `Field<string | null>`.

## Precedence

An explicit field option takes precedence over the shared default:

```ts
const { field } = createFormPrimitives({ nullable: false });

field('');                            // Field<string>
field('', { nullable: true });        // Field<string | null>
field('', { nullable: false });       // Field<string>
```

Passing `null` or `undefined` still creates a nullable field because there is no non-null initial
value to preserve:

```ts
const { field } = createFormPrimitives({ nullable: false });

field(null);      // Field<unknown>
field(undefined); // Field<unknown>
```

Provide the future type and opt into nullability when it is known:

```ts
const nickname = field<string>(null, { nullable: true });

nickname(); // null
```

## Shorthands and dynamic nodes

The default applies throughout definitions created by the configured factories. This includes
nested object shorthands, children added later with `add()`, and current or future items created by
an array template or factory.

An explicitly created node keeps the policy of the factory that created it:

```ts
const nullableForms = createFormPrimitives({ nullable: true });
const nonNullableForms = createFormPrimitives({ nullable: false });
const nullableField = nullableForms.field('');

const profile = nonNullableForms.form({
  displayName: nullableField,
}, {});
```

The configured `form()` attaches that existing node without changing its value type.

## Application entry point

Applications can expose one configured entry point so declarations share the same policy:

```ts title="src/app/forms.ts"
import { createFormPrimitives } from '@gem/ng-forms';

export const {
  form,
  field,
  group,
  array,
} = createFormPrimitives({
  nullable: false,
});
```

Import those factories from the application module when declaring forms.

## Related references

- [`field()`](./field.md)
- [`form()`](./form.md)
- [`array()`](./array.md)
- [Configuration](./configuration.md)
