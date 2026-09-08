import { field, form, type AnyNode, type DynamicNode } from '@ngblocks/form-nodes';

const response = form({
  api: field('v2'),
  reset: field('draft'),
});

response.api(); // 'v2'
response.reset(); // 'draft'

function touchNode(node: AnyNode) {
  node.$api.markAsTouched();
}

touchNode(response);
if (!response.$api.touched() || response.api() !== 'v2' || response.reset() !== 'draft') {
  throw new Error('Generic operations must preserve colliding children and target the node API.');
}

// This declaration is known not to shadow the direct common API.
const profile: DynamicNode = form({ username: field('Marco') });
profile.markAsTouched();
profile.touched(); // true

if (!profile.touched()) {
  throw new Error('A compatible DynamicNode must expose direct common operations.');
}

const registration = form({
  username: field('', [() => ({ kind: 'unavailable', message: 'Choose another username.' })]),
}, {
  validators: [() => ({ kind: 'reviewRequired' })],
});

function errorMessages(node: AnyNode): (string | undefined)[] {
  return node.$api.errors().map(error => error.message);
}

errorMessages(registration.username); // ['Choose another username.']
errorMessages(registration); // [undefined]

const registrationView: DynamicNode = registration;
const messages = registrationView.allErrors().map(error => error.message);
if (errorMessages(registration.username)[0] !== 'Choose another username.'
  || errorMessages(registration)[0] !== undefined
  || messages.length !== 2
  || !messages.includes('Choose another username.')
  || registrationView.getError('reviewRequired')?.message !== undefined) {
  throw new Error('Generic node APIs must preserve messages, including errors without a message.');
}
