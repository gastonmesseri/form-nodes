import { asyncValidator, field, form } from '@gem/ng-forms';

const accountForm = form({
  username: field('ada', [
    asyncValidator(async ({ value }) => {
      await Promise.resolve();
      return value() === 'ada' ? { kind: 'usernameTaken' } : null;
    }),
  ]),
});

if (!accountForm.username.pending() || accountForm.username.validationStatus() !== 'unknown') {
  throw new Error('The initial asynchronous validation should be pending and unknown.');
}

await Promise.resolve();
await Promise.resolve();
await Promise.resolve();

if (accountForm.username.pending() || !accountForm.username.getError('usernameTaken')) {
  throw new Error('The completed asynchronous validation should expose its error.');
}

accountForm.username.set('grace');

// Reactive async watchers schedule their rerun after the synchronous value update.
await Promise.resolve();

if (!accountForm.username.pending()) {
  throw new Error('Changing the value should start a new asynchronous validation.');
}

await Promise.resolve();
await Promise.resolve();
await Promise.resolve();

if (!accountForm.username.valid() || accountForm.username.errors().length !== 0) {
  throw new Error('The corrected username should become valid.');
}
