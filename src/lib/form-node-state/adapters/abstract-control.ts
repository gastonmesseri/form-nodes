import { NG_VALIDATORS, NgControl, RequiredValidator, Validators, type AbstractControl } from '@angular/forms';
import { DestroyRef, Injector, afterEveryRender, booleanAttribute, computed, inject, signal } from '@angular/core';

import type { ControlStateSource } from '../form-node-state';
import type { ControlStateAdapter } from '../form-node-state-adapter';

type AbstractControlSource = Extract<ControlStateSource, 'formControl' | 'formControlName' | 'ngModel'>;

/** Normalizes directive names without leaking numeric FormArray keys into the common facade. */
export const normalizeAbstractControlName = (name: string | number | null | undefined): string | undefined => {
  return name === null || name === undefined ? undefined : String(name);
};

/** Creates normalized bound state for an Angular directive backed by an AbstractControl. */
export const injectAbstractControlStateAdapter = <TValue>(
  source: AbstractControlSource,
  accepts: (directive: NgControl) => boolean,
  resolveName: (directive: NgControl) => string | undefined = () => undefined,
): ControlStateAdapter<TValue> => {
  const injector = inject(Injector);
  const destroyRef = inject(DestroyRef);
  const control = signal<AbstractControl | null>(null);
  const name = signal<string | undefined>(undefined);
  const revision = signal(0);
  let requiredDirectives: readonly RequiredValidator[] = [];
  const isRequired = (current: AbstractControl): boolean => {
    return current.hasValidator(Validators.required)
      || requiredDirectives.some(directive => booleanAttribute(directive.required));
  };
  let snapshot: readonly unknown[] = [];
  let subscription: { unsubscribe(): void } | undefined;
  const capture = (current: AbstractControl): readonly unknown[] => {
    return [current.value, current.disabled, current.dirty, current.errors, current.invalid, current.pending, current.touched, isRequired(current)];
  };
  const currentControl = () => {
    revision();
    return control()!;
  };

  afterEveryRender(() => {
    const directive = injector.get(NgControl, null, { optional: true, self: true });
    const acceptedDirective = directive && accepts(directive) ? directive : null;
    const nextControl = acceptedDirective?.control ?? null;
    requiredDirectives = nextControl
      ? (injector.get(NG_VALIDATORS, null, { optional: true, self: true }) ?? [])
        .filter((validator): validator is RequiredValidator => validator instanceof RequiredValidator)
      : [];
    name.set(acceptedDirective ? resolveName(acceptedDirective) : undefined);
    if (nextControl === control()) {
      if (!nextControl) return;
      const nextSnapshot = capture(nextControl);
      if (nextSnapshot.some((value, index) => !Object.is(value, snapshot[index]))) {
        snapshot = nextSnapshot;
        revision.update(value => value + 1);
      }
      return;
    }
    subscription?.unsubscribe();
    subscription = undefined;
    control.set(nextControl);
    if (!nextControl) return;
    snapshot = capture(nextControl);
    subscription = nextControl.events.subscribe(() => {
      snapshot = capture(nextControl);
      revision.update(value => value + 1);
    });
  }, { injector });
  destroyRef.onDestroy(() => {
    subscription?.unsubscribe();
    control.set(null);
  });

  return {
    source,
    connected: computed(() => control() !== null),
    value: computed(() => currentControl().value as TValue),
    disabled: computed(() => currentControl().disabled),
    disabledReasons: computed(() => []),
    dirty: computed(() => currentControl().dirty),
    errors: computed(() => {
      return Object.entries(currentControl().errors ?? {}).map(([kind, details]) => {
        return details && typeof details === 'object' ? { ...details, kind } : details === true ? { kind } : { kind, value: details };
      });
    }),
    hidden: computed(() => false),
    invalid: computed(() => currentControl().invalid),
    max: computed(() => undefined),
    maxLength: computed(() => undefined),
    min: computed(() => undefined),
    minLength: computed(() => undefined),
    name: computed(() => name()),
    pattern: computed(() => []),
    pending: computed(() => currentControl().pending),
    readonly: computed(() => false),
    required: computed(() => isRequired(currentControl())),
    touched: computed(() => currentControl().touched),
    markAsTouched() {
      currentControl().markAsTouched();
    },
  };
};
