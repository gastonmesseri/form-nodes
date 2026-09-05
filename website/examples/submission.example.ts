import { field, form, required } from '@ngblocks/form-nodes';

const savedValues: unknown[] = [];
let invalidAttempts = 0;

const profile = form({
  name: field('', [required]),
}, {
  onSubmit: async value => {
    await Promise.resolve();
    savedValues.push(value);
  },
  onSubmitBlocked: () => {
    invalidAttempts += 1;
  },
});

const firstResult = await profile.submit();
profile.name.set('Ada');
const secondResult = await profile.submit();

if (firstResult || !secondResult || invalidAttempts !== 1 || savedValues.length !== 1) {
  throw new Error('Submission did not follow the expected valid and invalid paths.');
}
