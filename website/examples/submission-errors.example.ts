import { field, form, required } from '@ngblocks/form-nodes';

const registration = form({
  email: field('taken@example.com', [required]),
}, {
  onSubmit: async (value, node) => {
    // Replace this simulated response with your application's API call.
    const response = await Promise.resolve({ emailTaken: value.email === 'taken@example.com' });
    if (response.emailTaken) {
      return {
        kind: 'emailTaken',
        message: 'This email is already registered.',
        targetNode: node.email,
      };
    }
  },
});

const rejected = await registration.submit();
registration.email(); // 'taken@example.com'
registration.email.getError('emailTaken')?.message; // 'This email is already registered.'

if (rejected || !registration.email.invalid() || !registration.invalid()) {
  throw new Error('The server rejection must belong to the email field and invalidate the form.');
}

registration.email.set('available@example.com');
if (registration.email.errors().length !== 0) {
  throw new Error('Changing the email must clear its submission error.');
}

const accepted = await registration.submit();
if (!accepted || registration.submitting() || !registration.valid()) {
  throw new Error('The corrected registration must submit successfully.');
}
