---
title: Localized messages
---

# Translate validator messages once

Register application defaults through Angular dependency injection instead of repeating messages on every validator:

```ts
import { ApplicationConfig, inject } from '@angular/core';

import { provideValidatorMessages } from 'form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideValidatorMessages(() => {
      const translations = inject(TranslationService);

      return {
        required: () => translations.text('validation.required'),
        minLength: ({ minLength }) => translations.text(
          'validation.minLength',
          { minLength },
        ),
        between: ({ min, max }) => translations.text(
          'validation.between',
          { min, max },
        ),
      };
    }),
  ],
};
```

Ordinary declarations stay concise:

```ts
const myForm = form({
  name: field('', [required, minLength(2)]),
  age: field<number>(null, [between(18, 120)]),
});
```

If `TranslationService` reads a locale signal, existing failing errors update automatically when the locale changes.

Use a form-level catalog for feature-specific vocabulary:

```ts
const myForm = form({
  quantity: field(0, [min(1)]),
}, {
  validatorMessages: {
    min: ({ min }) => `Choose at least ${min} ticket(s).`,
  },
});
```

Use validator-local `message` only when one rule needs unique wording. Precedence is local validator → closest form/array → closest provider → global catalog → built-in English.

See [Validator messages and i18n](../guides/validator-messages.md).
