import { computed, signal } from '@angular/core';

import { email, field, form, min, minLength, required, type FormNodeValue } from 'form-nodes';

// #region values
const profile = form({
  name: field('Ada'),
  email: field('ada@example.com'),
  address: {
    city: field('London'),
    country: field('UK'),
  },
});

profile.name(); // 'Ada'
profile.address.city(); // 'London'
profile.address(); // { city: 'London', country: 'UK' }
profile();
// Expected output:
// { name: 'Ada', email: 'ada@example.com', address: { city: 'London', country: 'UK' } }

const greeting = computed(() => `Hello, ${profile.name() ?? 'guest'}!`);
greeting(); // 'Hello, Ada!'
// #endregion values

if (greeting() !== 'Hello, Ada!' || profile.address.city() !== 'London') {
  throw new Error('The README model should expose its initial nested values.');
}

// #region writes
profile.name.set('Grace');
profile.name.update(name => name?.toUpperCase() ?? '');
profile.patch({ address: { city: 'Paris' } });

profile.name(); // 'GRACE'
profile.address(); // { city: 'Paris', country: 'UK' }
greeting(); // 'Hello, GRACE!'
// #endregion writes

if (greeting() !== 'Hello, GRACE!' || profile.address.country() !== 'UK' || profile.address.city() !== 'Paris') {
  throw new Error('Field writes should update computed consumers and patch only the supplied branch.');
}
if (profile.dirty() || profile.touched()) {
  throw new Error('Programmatic writes should preserve pristine and untouched state.');
}

profile.markAsDirty();
profile.markAsTouched();

// #region reset
profile.reset();
profile.name(); // 'GRACE'
profile.dirty(); // false
profile.touched(); // false

profile.reset({
  name: 'Ada',
  email: 'ada@example.com',
  address: { city: 'London', country: 'UK' },
});
profile.name(); // 'Ada'
// #endregion reset

if (profile.name() !== 'Ada' || profile.dirty() || profile.touched()) {
  throw new Error('An explicit reset should restore values and clear interaction state.');
}

// #region validation
const account = form({
  name: field('', [required, minLength(2)]),
  email: field('', [required, email]),
});

account.valid(); // false
account.name.getError('required')?.message; // 'This field is required.'
account.errors(); // [] — no rules are attached to the form itself
account.allErrors().length; // 2 — one required error per field

account.patch({ name: 'Ada', email: 'ada@example.com' });
account.valid(); // true
// #endregion validation

if (!account.valid() || account.allErrors().length !== 0) {
  throw new Error('Completing both required fields should make the README account valid.');
}

// #region sibling-field
const myForm = form({
  password: field('', [required]),
  confirmation: field('', [required, ctx => {
    const confirmation = ctx.value();
    if (!confirmation) return null;

    if (confirmation !== myForm.password()) {
      return { kind: 'passwordMismatch', message: 'Passwords must match.' };
    }

    return null;
  }]),
});
// #endregion sibling-field

if (!myForm.confirmation.getError('required') || myForm.confirmation.getError('passwordMismatch')) {
  throw new Error('An empty confirmation should be handled by required rather than the sibling rule.');
}
myForm.patch({ password: 'secret', confirmation: 'secret' });
if (!myForm.valid()) throw new Error('Matching passwords should make the sibling-rule example valid.');

myForm.password.set('changed-secret');
const siblingError = myForm.confirmation.getError('passwordMismatch');
if (!siblingError || siblingError.targetNode !== myForm.confirmation || myForm.valid()) {
  throw new Error('Changing only the password should put the mismatch error on the confirmation field.');
}
if (myForm.confirmation() !== 'secret') {
  throw new Error('Revalidating a sibling dependency should not change the confirmation value.');
}
myForm.password.set('secret');
if (!myForm.valid() || myForm.confirmation.getError('passwordMismatch')) {
  throw new Error('Restoring the password should clear the sibling error without editing confirmation.');
}

// #region cross-field
const passwords = form({
  password: field('', [required]),
  confirmation: field('', [required]),
}, {
  validators: [({ value }) => {
    const { password, confirmation } = value();
    return password === confirmation
      ? null
      : { kind: 'passwordMismatch', message: 'Passwords must match.' };
  }],
});
// #endregion cross-field

passwords.patch({ password: 'secret', confirmation: 'different' });
if (passwords.valid() || passwords.errors()[0]?.kind !== 'passwordMismatch') {
  throw new Error('The README form-level validator should reject mismatched passwords.');
}
passwords.confirmation.set('secret');
if (!passwords.valid()) throw new Error('Matching passwords should clear the form-level error.');

// #region reactive
const minimumAge = signal(18);
const locked = signal(false);

const application = form({
  age: field(20, [min(() => minimumAge())]),
  name: field('Ada', {
    disabled: () => locked() ? 'This account is locked.' : false,
  }),
});

application.age.valid(); // true
minimumAge.set(21);
application.age.valid(); // false

locked.set(true);
application.name.disabled(); // true
// #endregion reactive

if (application.age.valid() || !application.name.disabled()) {
  throw new Error('Constraint and option callbacks should track the signals they read.');
}
minimumAge.set(18);
locked.set(false);
if (!application.age.valid() || application.name.disabled()) {
  throw new Error('Reactive state should recover when its dependencies change back.');
}

const nullableName = field('Ada');
const strictName = field.strict('Ada');
const deferredAge = field<number>(null);
const acceptsNullable: FormNodeValue<typeof nullableName> = null;
const acceptsString: FormNodeValue<typeof strictName> = 'Ada';
const acceptsNumber: FormNodeValue<typeof deferredAge> = 21;
void [acceptsNullable, acceptsString, acceptsNumber];
