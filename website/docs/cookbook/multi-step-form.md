---
title: Multi-step form
---

# Build a multi-step form {#build-a-multi-step-form}

Model the complete workflow as one tree and render one nested branch at a time:

```ts
readonly activeStep = signal<1 | 2 | 3>(1);

form = form({
  account: {
    email: field('', [required, email]),
    password: field('', [required, minLength(12)]),
  },
  profile: {
    name: field('', [required]),
    age: field<number>(null, [between(18, 120)]),
  },
  preferences: {
    language: field('en', [oneOf(['en', 'de', 'es'])]),
    newsletter: field(false),
  },
});
```

Validate and touch only the current branch before advancing:

```ts
next() {
  const step = this.activeStep();
  const current = step === 1
    ? this.form.account
    : this.form.profile;

  current.markAsTouched();
  if (current.invalid()) {
    current.focus();
    return;
  }

  this.activeStep.update(value => value === 1 ? 2 : 3);
}
```

```html
@switch (activeStep()) {
  @case (1) {
    <input type="email" [formNode]="form.account.email" />
    <input type="password" [formNode]="form.account.password" />
  }
  @case (2) {
    <input [formNode]="form.profile.name" />
    <input type="number" [formNode]="form.profile.age" />
  }
  @case (3) {
    <select [formNode]="form.preferences.language">...</select>
    <input type="checkbox" [formNode]="form.preferences.newsletter" />
  }
}
```

:::info Rendering and participation are independent

An inactive step may remain part of form validity even when `@switch` does not render it. Apply
Form Nodes' hidden state only when the business rule says that step should stop contributing; do not use
it merely to mirror whether the step is currently rendered.

:::

The complete value remains available through `form()` at every step.

See [Interaction and availability](../guides/interaction-and-availability.md).
