---
title: Complete form example
description: A large, nested Form Nodes example with Angular bindings, arrays, validation, state, and submission.
---

# Complete form example {#complete-form-example}

Large forms remain ordinary typed trees. This customer-onboarding example combines nested objects, explicitly configured forms, arrays inside arrays, reactive state, validation, message overrides, debounce, and submission in one declaration.

## 🧩 Component and form model {#component-and-form-model}

```ts
import { Component, signal } from '@angular/core';
import { FormNodeDirective, array, between, dateBetween, email, field, form, maxLength, maxWords, minLength, oneOf, pattern, required, uniqueItems } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-customer-editor',
  imports: [FormNodeDirective],
  templateUrl: './customer-editor.html',
})
export class CustomerEditor {
  readonly useShippingAddress = signal(true);
  readonly availableCountries = signal<readonly string[]>(['CH', 'DE', 'ES', 'FR']);

  myForm = form({
    account: {
      email: field('', [required, email]),
      username: field('', [
        required,
        minLength(3),
        maxLength(30),
        pattern(/^[a-z0-9_-]+$/i, {
          message: 'Use letters, numbers, underscores, or hyphens.',
        }),
      ]),
      marketingConsent: field(false),
    },

    profile: {
      firstName: field('', [required, maxLength(80)]),
      lastName: field('', [required, maxLength(80)]),
      birthDate: field<Date>(null, [
        dateBetween('1900-01-01', '2010-12-31'),
      ]),
      biography: field('', [maxWords(250)]),
      preferredLanguage: field('en', [oneOf(['en', 'de', 'es', 'fr'])]),
    },

    shippingAddress: form({
      street: field('', [required]),
      city: field('', [required]),
      postalCode: field('', [required, pattern(/^[A-Z0-9 -]{3,12}$/i)]),
      country: field('CH', [oneOf(() => this.availableCountries())]),
    }, {
      debounce: 150,
    }),

    billingAddress: form({
      street: field('', [required]),
      city: field('', [required]),
      postalCode: field('', [required]),
      country: field('CH', [oneOf(() => this.availableCountries())]),
    }, {
      disabled: () => this.useShippingAddress()
        ? 'The shipping address is being used for billing.'
        : false,
    }),

    contacts: array({
      id: field(''),
      label: field('Work', [required]),
      email: field('', [required, email]),
      phone: field('', [pattern(/^\+?[0-9 ()-]{7,20}$/)]),
      primary: field(false),
    }, {
      initialValue: [
        {
          id: 'main',
          label: 'Primary',
          email: '',
          phone: '',
          primary: true,
        },
      ],
      trackBy: 'id',
      validators: [uniqueItems('email')],
    }),

    projects: array({
      id: field(''),
      name: field('', [required, maxLength(120)]),
      budget: field<number>(null, [between(0, 1_000_000)]),
      active: field(true),
      tasks: array({
        id: field(''),
        title: field('', [required]),
        completed: field(false),
      }, {
        initialValue: [],
        trackBy: 'id',
      }),
    }, {
      initialValue: [
        {
          id: 'website',
          name: 'Website redesign',
          budget: 25_000,
          active: true,
          tasks: [
            { id: 'research', title: 'User research', completed: false },
          ],
        },
      ],
      trackBy: 'id',
      validators: [minLength(1)],
    }),

    notes: field('', [maxLength(2_000)]),
  }, {
    debounce: 250,
    validatorMessages: {
      required: 'Complete this value.',
      minLength: ({ minLength }) => `Add at least ${minLength} item(s).`,
    },
    onSubmit: async value => {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(value),
      });

      if (!response.ok) throw new Error('Could not save the customer.');
    },
    onSubmitBlocked: formNode => {
      formNode.focus();
    },
  });
}
```

The declaration remains readable because every branch owns its value, validators, and local configuration. TypeScript derives the complete submission value and narrows every child access without a separately maintained interface.

## 💡 Template excerpt {#template-excerpt}

The template follows the same tree. Arrays expose live item nodes, so nested controls need no string paths or index-based lookup:

```html
<form [formNode]="myForm">
  <section>
    <h2>Account</h2>
    <input type="email" [formNode]="myForm.account.email" />
    <input [formNode]="myForm.account.username" />
    <input type="checkbox" [formNode]="myForm.account.marketingConsent" />
  </section>

  <section>
    <h2>Shipping address</h2>
    <input [formNode]="myForm.shippingAddress.street" />
    <input [formNode]="myForm.shippingAddress.city" />
    <input [formNode]="myForm.shippingAddress.postalCode" />
    <select [formNode]="myForm.shippingAddress.country">
      @for (country of availableCountries(); track country) {
        <option [value]="country">{{ country }}</option>
      }
    </select>
  </section>

  <section>
    <h2>Contacts</h2>
    @for (contact of myForm.contacts; track contact; let index = $index) {
      <input [formNode]="contact.label" />
      <input type="email" [formNode]="contact.email" />
      <input type="tel" [formNode]="contact.phone" />
      <button type="button" (click)="myForm.contacts.removeAt(index)">
        Remove contact
      </button>
    }

    <button type="button" (click)="myForm.contacts.push()">
      Add contact
    </button>
  </section>

  <section>
    <h2>Projects</h2>
    @for (project of myForm.projects; track project) {
      <input [formNode]="project.name" />
      <input type="number" [formNode]="project.budget" />

      @for (task of project.tasks; track task) {
        <input [formNode]="task.title" />
        <input type="checkbox" [formNode]="task.completed" />
      }

      <button type="button" (click)="project.tasks.push()">
        Add task
      </button>
    }
  </section>

  <button type="submit" [disabled]="myForm.submitting()">
    Save customer
  </button>
</form>
```

## 🌳 Working with the tree {#working-with-the-tree}

The large shape does not change the API conventions:

```ts
myForm(); // { account: { ... }, profile: { ... }, shippingAddress: { ... }, ... }
myForm.profile.firstName(); // ''
myForm.valid();
myForm.contacts.push(); // array operation directly on the node
myForm.projects[0]?.tasks.move(2, 0); // nested array operation
myForm.patch({
  profile: {
    preferredLanguage: 'de',
  },
});
```

State and validation aggregate through every level. A failing task makes its project, the projects
array, and the root form invalid; `myForm.allErrors()` collects the complete tree. Disabling
`billingAddress` removes that branch from interactive validation without destroying its values or
validators.
