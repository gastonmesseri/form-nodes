import { isSignal, type WritableSignal } from '@angular/core';

// Angular 21.0 lacks isWritableSignal(); use the public signal marker and writer.
export const isWritableControlSignal = (value: unknown): value is WritableSignal<unknown> => {
  return isSignal(value) && typeof (value as WritableSignal<unknown>).set === 'function';
};
