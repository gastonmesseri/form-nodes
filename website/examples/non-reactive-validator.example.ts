import { signal } from '@angular/core';
import { field, form, validator } from '@ngblocks/form-nodes';

const minimumAge = signal(18);
let executions = 0;
const profile = form({
  age: field(16, validator(({ value }) => {
    executions++;
    return value() !== null && value()! < minimumAge() ? { kind: 'minimumAge' } : null;
  }, { reactive: false })),
});

profile.age(); // 16
profile.invalid(); // true
if (!profile.invalid() || executions !== 1) throw new Error('The initial value must be validated.');

minimumAge.set(15);
profile.invalid(); // true
if (!profile.invalid() || Number(executions) !== 1) throw new Error('External changes must not trigger validation.');

profile.age.set(17);
profile.valid(); // true
if (!profile.valid() || Number(executions) !== 2) throw new Error('A new value must sample the latest minimum.');
