import { computed } from '@angular/core';
import { field, form } from '@ngblocks/form-nodes';

const profile = form({
  name: field.strict<string>('Marco'),
  email: field.strict<string>('marco@example.com'),
});

// This preview treats names that differ only in letter case as interchangeable.
const previewValue = computed(() => profile(), {
  equal: (previous, next) => {
    return previous.name.toLowerCase() === next.name.toLowerCase()
      && previous.email === next.email;
  },
});

let previewRuns = 0;
const previewLabel = computed(() => {
  previewRuns++;
  const value = previewValue();
  return `${value.name} <${value.email}>`;
});

const initialPreview = previewValue();
previewLabel(); // 'Marco <marco@example.com>'

profile.name.set('MARCO');
profile().name; // 'MARCO'
previewValue().name; // 'Marco': the computed retains its previous value
previewLabel(); // 'Marco <marco@example.com>'

if (profile().name !== 'MARCO' || profile.name() !== 'MARCO') {
  throw new Error('Consumer equality must not replace the committed node value.');
}
if (previewValue() !== initialPreview || previewRuns !== 1) {
  throw new Error('An equivalent preview must retain its value and skip dependent recomputation.');
}

profile.email.set('marco@work.example');
previewLabel(); // 'MARCO <marco@work.example>'

if (previewValue() !== profile() || Number(previewRuns) !== 2) {
  throw new Error('A non-equivalent preview must publish the current value and update its consumer.');
}
