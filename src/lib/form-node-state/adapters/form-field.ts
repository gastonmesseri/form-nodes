import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FORM_FIELD, type FormField } from '@angular/forms/signals';
import { DestroyRef, Injector, VERSION, afterNextRender, computed, inject, signal, untracked } from '@angular/core';

import { CONTROL_ERRORS_BRIDGE } from '../control-errors';
import type { ControlStateAdapter } from '../form-node-state-adapter';

/** Resolves and observes a same-host Angular Signal Forms `[formField]`. */
export const injectFormFieldControlStateAdapter = <TValue>(): ControlStateAdapter<TValue> => {
  const injector = inject(Injector);
  const bridge = inject(CONTROL_ERRORS_BRIDGE, { optional: true, self: true });
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
    registerErrors(source) {
      if (Number(VERSION.major) < 22 || !bridge || !injector.get(NG_VALUE_ACCESSOR, null, { self: true })) {
        throw new Error('useFormNodeState({ errors }) with [formField] requires Angular 22+, a ControlValueAccessor, and provideFormNodeStateErrors() in the component providers.');
      }
      return untracked(() => bridge.register(source));
    },
    refreshErrors() {
      bridge?.changed();
    },
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
