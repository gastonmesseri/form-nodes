import { computed, isSignal } from '@angular/core';

import { field, form, type ValidatorContext } from 'form-nodes';

let nodeSignal: ValidatorContext<string | null>['field'] | undefined;
const profile = form({
  email: field('', [(ctx) => {
    if (!Object.is(ctx.node, ctx.field)) {
      throw new Error('node and field must expose the same readonly signal.');
    }
    nodeSignal = ctx.node;
    return ctx.value() ? null : { kind: 'missingEmail' };
  }]),
});

profile.email.errors();
if (!nodeSignal || !isSignal(nodeSignal)) {
  throw new Error('The validator must receive a real Angular signal.');
}

const originalSignal = nodeSignal;
let identityReads = 0;
const validatedNode = computed(() => {
  identityReads++;
  return originalSignal();
});
const committedValue = computed(() => originalSignal().value());

if (validatedNode() !== profile.email || committedValue() !== '') {
  throw new Error('Read the signal for its node and the node value signal for its committed value.');
}

profile.email.set('ada@example.com');
profile.email.errors();
if (nodeSignal !== originalSignal || validatedNode() !== profile.email || identityReads !== 1) {
  throw new Error('Value changes must preserve both signal and node identity.');
}
if (committedValue() !== 'ada@example.com') {
  throw new Error('Reading the returned node must track its committed value.');
}
