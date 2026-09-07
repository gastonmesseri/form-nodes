import { FORM_FIELD, type FormField } from '@angular/forms/signals';
import { DestroyRef, Injector, afterNextRender, computed, inject, signal } from '@angular/core';

import type { ControlStateAdapter } from '../control-state-adapter';

/** Resolves and observes a same-host Angular Signal Forms `[formField]`. */
export const injectFormFieldControlStateAdapter = <TValue>(): ControlStateAdapter<TValue> => {
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
    errors: computed(() => {
      return state().errors().map((error) => {
        // Angular 21.0 exposes fieldTree; later versions can also attach a formField binding.
        const { fieldTree, formField: errorFormField, ...details } = error as typeof error & { formField?: unknown };
        void fieldTree;
        void errorFormField;
        return details;
      });
    }),
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
