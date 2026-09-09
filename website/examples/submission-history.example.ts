import { computed } from '@angular/core';
import { field, form, required } from '@ngblocks/form-nodes';

const profile = form({
  name: field('', [required]),
}, {
  onSubmit: async () => { await Promise.resolve(); },
});
const showErrors = computed(() => profile.name.invalid() && (profile.name.touched() || profile.submitted()));

profile.submitted(); // false
await profile.submit();
profile.submitted(); // true: validation blocked the attempt
profile.submitting(); // false: no action is running
if (!profile.submitted() || !showErrors() || profile.submitting()) {
  throw new Error('An invalid submission must expose its attempt without running an action.');
}

profile.name.reset();
profile.name.touched(); // false
showErrors(); // true: resetting one field preserves its form's submission history
if (!showErrors()) throw new Error('A field reset must not clear its owner form history.');

profile.name.set('Ada');
await profile.submit();
profile.submitted(); // true: successful completion preserves history
if (!profile.submitted() || profile.submitting()) throw new Error('Completed submission history must persist.');

profile.resetToInitial();
profile.submitted(); // false
showErrors(); // false
if (profile.submitted() || showErrors()) throw new Error('A form reset must clear submission history.');
