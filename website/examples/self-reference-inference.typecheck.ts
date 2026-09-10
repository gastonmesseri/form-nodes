import { computed } from '@angular/core';
import { field, form, group, required, validator, type Validator, type ValidationResult } from '@ngblocks/form-nodes';

// A reusable helper that checks the condition's return type.
function requiredWhen(condition: () => boolean): Validator<unknown> {
  return required({ when: condition });
}

export class ExplicitComputedResult {
  form = form({
    other: field<number>(23),
    subType: field<string>(null, [requiredWhen(() => this.isTypeVisible())]),
  });

  isTypeVisible = computed((): boolean => (this.form.other() ?? 0) > 30);
}

export class ExplicitConditionResult {
  form = form({
    other: field<number>(23),
    subType: field<string>(null, [requiredWhen((): boolean => this.isTypeVisible())]),
  });

  isTypeVisible = computed(() => (this.form.other() ?? 0) > 30);
}

// An intentional helper-author tradeoff: callers must still return a boolean.
function inferredRequiredWhen(condition: () => any): Validator<unknown> {
  return required({ when: condition });
}

export class UnannotatedConsumer {
  form = form({
    other: field<number>(23),
    subType: field<string>(null, [inferredRequiredWhen(() => this.isTypeVisible())]),
  });

  isTypeVisible = computed(() => (this.form.other() ?? 0) > 30);
}

// The relaxed helper condition must not erase the form's inferred field types.
const model = new UnannotatedConsumer();
const visible: boolean = model.isTypeVisible();
const subType: string | null = model.form.subType();
// @ts-expect-error the field still rejects invalid writes
model.form.subType.set(123);
void [visible, subType];

// A localized escape hatch when the helper's signature cannot be changed.
export class UncheckedCallbackResult {
  form = form({
    other: field<number>(23),
    subType: field<string>(null, [requiredWhen((): any => this.isTypeVisible())]),
  });

  isTypeVisible = computed(() => (this.form.other() ?? 0) > 30);
}

// Direct declaration callbacks support self-reference; a checked helper uses an explicit result.
export const dateRange = group({
  endDate: field<string>(null),
  startDate: field<string>(null, validator(({ value }): ValidationResult => {
    const endDate = dateRange.endDate();
    return endDate && !value()
      ? { kind: 'missingStartDate', message: 'Enter a start date.' }
      : null;
  })),
});

const startDate: string | null = dateRange.startDate();
// @ts-expect-error The return annotation does not weaken the field's value type.
dateRange.startDate.set(123);
void startDate;
