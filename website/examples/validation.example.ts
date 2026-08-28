import { field, form, minLength, required, uniqueItems } from '@gem/ng-forms';

const registration = form({
  username: field('', [required, minLength(3)]),
  password: field(''),
  confirmation: field(''),
  aliases: field<string[]>([], [uniqueItems]),
}, [({ value }) => value().password === value().confirmation
  ? null
  : { kind: 'passwordMismatch' }]);

registration.username.set('Ada');
registration.password.set('secret');
registration.confirmation.set('different');
registration.aliases.set(['countess', 'countess']);

if (!registration.getError('passwordMismatch')) {
  throw new Error('The form-level validator should report a password mismatch.');
}
if (!registration.aliases.getError('uniqueItems')) {
  throw new Error('The field validator should report duplicate aliases.');
}

registration.confirmation.set('secret');
registration.aliases.set(['countess', 'programmer']);

if (!registration.valid()) {
  throw new Error('The corrected registration should be valid.');
}
