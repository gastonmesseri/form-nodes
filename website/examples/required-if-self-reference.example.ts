import { computed } from '@angular/core';
import { field, form, required, requiredIf } from '@ngblocks/form-nodes';

class ProfileModel {
  form = form({
    other: field<number>(23, [required]),
    subType: field<string>(null, [requiredIf(() => this.isTypeVisible())]),
  });

  isTypeVisible = computed(() => (this.form.other() ?? 0) > 30);
}

const model = new ProfileModel();
model.isTypeVisible(); // false
if (model.form.subType.required() || !model.form.valid()) throw new Error('The hidden subtype must be optional.');
model.form.other.set(31);
model.isTypeVisible(); // true
if (!model.form.subType.required() || !model.form.invalid()) throw new Error('The visible subtype must be required.');
model.form.other.set(23);
if (model.form.subType.required() || !model.form.valid()) throw new Error('The condition must remain reactive.');
