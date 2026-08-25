import { DestroyRef, effect, signal, untracked, type Injector, type ModelSignal, type WritableSignal } from '@angular/core';

import type { Field } from '../../primitives/field';
import type { FormNodeControl } from './form-node-control';
import { connectSignalControlInputs } from './signal-control-inputs';
import { registerExternalValidationErrors } from '../../validation/external-validation-errors';

export type SignalControlConnection = {
  focus?: (options?: FocusOptions) => void;
};

const getControlModel = <TValue>(control: FormNodeControl<TValue>): ModelSignal<TValue> =>
  ('value' in control && control.value !== undefined ? control.value : control.checked) as ModelSignal<TValue>;

/** Connects a provided signal-based custom control to a field node. */
export const connectSignalControl = <TValue>(
  control: FormNodeControl<TValue>,
  field: () => Field<TValue>,
  injector: Injector,
): SignalControlConnection => {
  const model = getControlModel(control);
  const node = control.node as WritableSignal<Field<TValue> | null> | undefined;
  const validationOwner = {};
  const noErrors = signal<readonly []>([]);
  let writingControlValue = false;

  connectSignalControlInputs(control, field, injector);

  const valueSubscription = model.subscribe((value) => {
    if (!writingControlValue) field().setControlValue(value);
  });
  const touchSubscription = control.touch?.subscribe(() => field().markAsTouched());

  injector.get(DestroyRef).onDestroy(() => {
    valueSubscription.unsubscribe();
    touchSubscription?.unsubscribe();
    node?.set(null);
  });

  effect(() => {
    const currentField = field();
    const value = currentField.controlValue();
    untracked(() => {
      node?.set(currentField);
      if (Object.is(model(), value)) return;
      writingControlValue = true;
      try {
        model.set(value);
      } finally {
        writingControlValue = false;
      }
    });
  }, { injector });

  const reset = control.reset?.bind(control);
  if (reset) {
    effect((onCleanup) => {
      onCleanup(registerExternalValidationErrors(field(), validationOwner, noErrors, { onReset: reset }));
    }, { injector });
  }

  return control.focus ? { focus: control.focus.bind(control) } : {};
};
