import { NG_VALIDATORS, type ValidationErrors, type Validator } from '@angular/forms';
import { InjectionToken, computed, signal, type Provider, type Signal } from '@angular/core';

import type { ControlStateError } from './form-node-state';

/** Converts contributed errors to Angular's keyed validation representation. */
export const toAngularControlErrors = (errors: readonly ControlStateError[]): ValidationErrors | null => {
  return errors.length ? Object.fromEntries(errors.map(error => [error.kind, error])) : null;
};

/** Host-local bridge used by Angular Signal Forms' public NG_VALIDATORS integration. */
export class ControlErrorsBridge implements Validator {
  sources = signal<ReadonlyMap<object, Signal<readonly ControlStateError[]>>>(new Map());

  changed = () => {};

  errors = computed(() => Array.from(this.sources().values()).flatMap(source => source()));

  validate() {
    return toAngularControlErrors(this.errors());
  }

  registerOnValidatorChange(callback: () => void) {
    this.changed = callback;
  }

  register(source: Signal<readonly ControlStateError[]>) {
    const owner = {};
    this.sources.update(sources => new Map(sources).set(owner, source));
    this.changed();
    return () => {
      this.sources.update((sources) => {
        const remaining = new Map(sources);
        remaining.delete(owner);
        return remaining;
      });
      this.changed();
    };
  }
}

export const CONTROL_ERRORS_BRIDGE = new InjectionToken<ControlErrorsBridge>('Form Nodes control errors');

/**
 * Enables useFormNodeState({ errors }) on CVAs bound through Angular 22 Signal Forms.
 * Add this to the custom component's providers alongside NG_VALUE_ACCESSOR. Form Nodes,
 * Reactive Forms, and ngModel register contributions directly and do not require this provider.
 * Signal Forms on Angular 21 and signal-model controls do not support this bridge.
 * @example
 * providers: [provideFormNodeStateErrors()]
 */
export const provideFormNodeStateErrors = (): Provider[] => [
  { provide: CONTROL_ERRORS_BRIDGE, useFactory: () => new ControlErrorsBridge() },
  { provide: NG_VALIDATORS, useExisting: CONTROL_ERRORS_BRIDGE, multi: true },
];
