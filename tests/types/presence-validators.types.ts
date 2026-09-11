import { computed } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { field, form, required, requiredTrue, notNil, type ValidatorMessages } from '../../src/public-api';

const checkout = form({
  answer: field<boolean>(null, [required]),
  accepted: field(false, [requiredTrue]),
  reference: field<string>(null, [notNil]),
  strict: field.strict(false, [requiredTrue({ message: 'Accept the terms.' })]),
});

type Answer = Expect<Equal<ReturnType<typeof checkout.answer>, boolean | null>>;
type Strict = Expect<Equal<ReturnType<typeof checkout.strict>, boolean>>;
const acceptanceError = checkout.accepted.getError('requiredTrue');
const referenceError = checkout.reference.getError('notNil');
type AcceptanceKind = Expect<Equal<NonNullable<typeof acceptanceError>['kind'], 'requiredTrue'>>;
type ReferenceKind = Expect<Equal<NonNullable<typeof referenceError>['kind'], 'notNil'>>;

const messages: ValidatorMessages = {
  requiredTrue: () => 'Accept the terms.',
  notNil: 'Provide a value.',
};
form({ accepted: field(false, [requiredTrue('Accept the terms.')]) }, { validatorMessages: messages });
field(null, [notNil({ error: ({ value }) => value() === null ? { kind: 'missingReference' } : null })]);

class Model {
  checkout = form({
    enabled: field(true),
    accepted: field(false, [requiredTrue({ when: () => this.checkout.enabled() })]),
    reference: field<string>(null, [notNil({ when: () => this.active() })]),
  });

  active = computed(() => this.checkout.enabled() === true);
}
const model = new Model();
type Accepted = Expect<Equal<ReturnType<typeof model.checkout.accepted>, boolean | null>>;

// @ts-expect-error Custom messages and replacement errors are mutually exclusive.
requiredTrue({ message: 'Accept the terms.', error: { kind: 'consent' } });
// @ts-expect-error A context-taking activation predicate must return a boolean.
notNil({ when: context => context.value() });

export type PresenceAssertions = [Answer, Strict, AcceptanceKind, ReferenceKind, Accepted];
