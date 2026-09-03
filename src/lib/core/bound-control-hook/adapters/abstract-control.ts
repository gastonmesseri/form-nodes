import { NgControl, type AbstractControl } from '@angular/forms';
import { DestroyRef, Injector, afterNextRender, computed, inject, signal } from '@angular/core';

import type { BoundControlSource } from '../bound-control';
import type { BoundControlAdapter } from '../bound-control-adapter';

type AbstractControlSource = Extract<BoundControlSource, 'formControl' | 'formControlName' | 'ngModel'>;

/** Creates normalized bound state for an Angular directive backed by an AbstractControl. */
export const injectAbstractControlBoundControl = <TValue>(source: AbstractControlSource, accepts: (directive: NgControl) => boolean): BoundControlAdapter<TValue> => {
  const injector = inject(Injector);
  const destroyRef = inject(DestroyRef);
  const control = signal<AbstractControl | null>(null);
  const revision = signal(0);
  const currentControl = () => {
    revision();
    return control()!;
  };

  afterNextRender(() => {
    const directive = injector.get(NgControl, null, { optional: true, self: true });
    if (!directive || !accepts(directive) || !directive.control) return;
    control.set(directive.control);
    const subscription = directive.control.events.subscribe(() => {
      revision.update(value => value + 1);
    });
    destroyRef.onDestroy(() => {
      subscription.unsubscribe();
      control.set(null);
    });
  }, { injector });

  return {
    source,
    connected: computed(() => control() !== null),
    value: computed(() => currentControl().value as TValue),
    disabled: computed(() => currentControl().disabled),
    disabledReasons: computed(() => []),
    dirty: computed(() => currentControl().dirty),
    errors: computed(() => Object.entries(currentControl().errors ?? {}).map(([kind, details]) =>
      details && typeof details === 'object' ? { ...details, kind } : details === true ? { kind } : { kind, value: details },
    )),
    hidden: computed(() => false),
    invalid: computed(() => currentControl().invalid),
    max: computed(() => undefined),
    maxLength: computed(() => undefined),
    min: computed(() => undefined),
    minLength: computed(() => undefined),
    name: computed(() => undefined),
    pattern: computed(() => []),
    pending: computed(() => currentControl().pending),
    readonly: computed(() => false),
    required: computed(() => false),
    touched: computed(() => currentControl().touched),
    markAsTouched() {
      currentControl().markAsTouched();
    },
  };
};
