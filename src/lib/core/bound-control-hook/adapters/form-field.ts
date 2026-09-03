import { FORM_FIELD, type FormField } from '@angular/forms/signals';
import { DestroyRef, Injector, afterNextRender, computed, inject, signal } from '@angular/core';

import type { BoundControlAdapter } from '../bound-control-adapter';

/** Resolves and observes a same-host Angular Signal Forms `[formField]`. */
export const injectFormFieldBoundControl = <TValue>(): BoundControlAdapter<TValue> => {
  const injector = inject(Injector);
  const destroyRef = inject(DestroyRef);
  const formField = signal<FormField<unknown> | null>(null);
  const state = () => formField()!.state();

  afterNextRender(() => {
    const directive = injector.get(FORM_FIELD, null, { optional: true, self: true });
    if (!directive) return;
    formField.set(directive);
    destroyRef.onDestroy(() => formField.set(null));
  }, { injector });

  return {
    source: 'formField',
    connected: computed(() => formField() !== null),
    value: computed(() => state().value() as TValue),
    disabled: computed(() => state().disabled()),
    disabledReasons: computed(() => state().disabledReasons().map(({ message }) => message === undefined ? {} : { message })),
    dirty: computed(() => state().dirty()),
    errors: computed(() => state().errors().map((error) => {
      const { fieldTree, formField: errorFormField, ...details } = error;
      void fieldTree;
      void errorFormField;
      return details;
    })),
    hidden: computed(() => state().hidden()),
    invalid: computed(() => state().invalid()),
    max: computed(() => state().max?.() as number | Date | undefined),
    maxLength: computed(() => state().maxLength?.()),
    min: computed(() => state().min?.() as number | Date | undefined),
    minLength: computed(() => state().minLength?.()),
    name: computed(() => state().name()),
    pattern: computed(() => state().pattern()),
    pending: computed(() => state().pending()),
    readonly: computed(() => state().readonly()),
    required: computed(() => state().required()),
    touched: computed(() => state().touched()),
    markAsTouched() {
      state().markAsTouched();
    },
  };
};
