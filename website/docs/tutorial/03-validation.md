---
title: 3. Add validation
---

# 3. Add validation

Add built-in validators where each field is declared:

```ts
myForm = form({
  name: field('', [required, minLength(2)]),
  age: field<number>(null, [between(18, 120), integer]),
  email: field('', [required, email]),
});
```

Import the rules with the form primitives:

```ts
import { FormNode, between, email, field, form, integer, minLength, required } from 'form-nodes';
```

Optional format and constraint validators accept empty values so they compose with `required`. For example, `email` checks format while `required` checks presence.

## Render errors after interaction

Use `getError()` for a specific rule. Known built-in kinds expose their typed payload:

```html
<label>
  Name
  <input [formNode]="myForm.name" />
</label>

@if (myForm.name.touched()) {
  @if (myForm.name.getError('required'); as error) {
    <p class="error">{{ error.message }}</p>
  }
  @if (myForm.name.getError('minLength'); as error) {
    <p class="error">
      Enter at least {{ error.minLength }} characters.
    </p>
  }
}
```

Use `errors()` for errors owned by one node and `allErrors()` for a complete subtree:

```ts
this.myForm.name.errors();
this.myForm.errors();
this.myForm.allErrors();
```

A field error makes every interactive ancestor invalid. The error remains owned by its field through `targetNode`.

## Related guides and reference

- [Validation](../guides/validation.md) covers custom validators, cross-field rules, reactive
  constraints, and validator metadata.
- [Errors and status](../guides/errors-and-status.md) explains `errors()`, `allErrors()`,
  `getError()`, ownership, `targetNode`, and aggregate validity.
- [Built-in validators](../reference/built-in-validators.md) documents every signature, error
  shape, empty-value rule, and concrete example.
- [Validator messages and i18n](../guides/validator-messages.md) covers default messages and global,
  provider, form-tree, and validator-local overrides.

Continue with [Step 4: Add nesting and reactive state](./04-nesting-and-state.md).
