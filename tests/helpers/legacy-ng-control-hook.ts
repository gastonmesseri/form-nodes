/* eslint-disable @angular-eslint/no-uncalled-signals */
import { ChangeDetectorRef, computed, effect, inject, isSignal, signal, untracked, type Signal } from '@angular/core';
import { NgControl, Validators, type AbstractControl, type FormControlStatus, type ValidationErrors } from '@angular/forms';

// Fixture reproducing the consumer's method-wrapping observer, including untracked data reads.
const computedTracked = <T>(dependencies: () => unknown[], getter: () => T, _options?: unknown) => {
  return computed(() => {
    dependencies();
    return untracked(getter);
  });
};

export type FormControlState<T = any> = {
  value: T;
  status: FormControlStatus;
  touched: boolean;
  untouched: boolean;
  pristine: boolean;
  dirty: boolean;
  valid: boolean;
  invalid: boolean;
  pending: boolean;
  errors: ValidationErrors | null;
  disabled: boolean;
  enabled: boolean;
};

export type FormControlStateSignals<T = any> = ReturnType<typeof useFormControlState<T>>;

const TRACKER_KEY = Symbol('useFormControlState.tracker');

const DATA_METHODS = ['updateValueAndValidity', 'setErrors', 'enable', 'disable', 'reset'] as const;

const STATE_ONLY_METHODS = [
  'markAsTouched',
  'markAsUntouched',
  'markAllAsTouched',
  'markAllAsUntouched',
  'markAsDirty',
  'markAsPristine',
  'markAllAsDirty',
  'markAllAsPristine',
  'markAsPending',
  '_updateTouched',
  '_updatePristine',
] as const;

type InternalStateSignals = {
  touched: Signal<boolean>;
  pristine: Signal<boolean>;
  status: Signal<FormControlStatus | undefined>;
}

type FormControlTracker = {
  dataChangeSignal: Signal<number>;
  stateChangeSignal: Signal<number>;
  reactive: InternalStateSignals | null;
}

/** Reads Angular's `@internal` computeds. They are stripped from the .d.ts, hence the dynamic access. */
const readInternalStateSignals = (control: AbstractControl) => {
  const host = control as any as Record<string, unknown>;
  const touched = host['_touched'];
  const pristine = host['_pristine'];
  const status = host['_status'];

  if (isSignal(touched) && isSignal(pristine) && isSignal(status)) {
    return {
      touched: touched as Signal<boolean>,
      pristine: pristine as Signal<boolean>,
      status: status as Signal<FormControlStatus | undefined>,
    };
  }
  return null;
};

const patchFormControlMethod = (control: Record<string, any>, name: string, afterCall: () => any) => {
  const original = control[name];
  if (typeof original !== 'function') return;

  const patched = function (this: any, ...args: any[]) {
    try {
      return original.apply(this, args);
    } finally {
      afterCall();
    }
  };

  Object.defineProperty(control, name, {
    value: patched,
    writable: true,
    enumerable: false,
    configurable: true,
  });
};

const getFormControlTracker = (control: AbstractControl): FormControlTracker => {
  const existing = (control as any)[TRACKER_KEY] as FormControlTracker | undefined;
  if (existing) return existing;

  const dataChangeSignal = signal(0);
  const stateChangeSignal = signal(0);
  const reactive = readInternalStateSignals(control);

  // `untracked` allows writing signals even when the method is invoked from
  // inside a computed or an effect (avoids NG0600).
  const notifyStateChange = () => untracked(() => stateChangeSignal.update(v => v + 1));
  const notifyDataChange = () => untracked(() => {
    dataChangeSignal.update(v => v + 1);
    stateChangeSignal.update(v => v + 1);
  });

  for (const name of DATA_METHODS) {
    patchFormControlMethod(control, name, notifyDataChange);
  }

  if (!reactive) {
    for (const name of STATE_ONLY_METHODS) {
      patchFormControlMethod(control, name, notifyStateChange);
    }
  }

  const tracker: FormControlTracker = {
    dataChangeSignal: dataChangeSignal.asReadonly(),
    stateChangeSignal: stateChangeSignal.asReadonly(),
    reactive,
  };

  Object.defineProperty(control, TRACKER_KEY, {
    value: tracker,
    writable: true,
    enumerable: false,
    configurable: true,
  });

  return tracker;
};

export const useFormControlState = <TValue, TRawValue extends TValue = TValue>(
  control: AbstractControl<TValue, TRawValue>,
  options?: {
    /** Use `control.value` instead of `control.getRawValue()` (defaults to the raw value). */
    useControlValue?: boolean;
    /** Equality for the `value` signal */
    valueEqual?: (a: TRawValue, b: TRawValue) => boolean;
  },
) => {
  const { dataChangeSignal, stateChangeSignal, reactive } = getFormControlTracker(control);

  const value = computedTracked(() => [dataChangeSignal()], () => {
    return !options?.useControlValue && typeof control.getRawValue === 'function'
      ? control.getRawValue()
      : control.value as TRawValue;
  }, { equal: options?.valueEqual });

  const errors = computedTracked(() => [dataChangeSignal()], () => control.errors);

  const status = reactive
    ? computed(() => reactive.status() ?? untracked(() => control.status))
    : computedTracked(() => [stateChangeSignal()], () => control.status);

  const touched = reactive?.touched
    ?? computedTracked(() => [stateChangeSignal()], () => control.touched);

  const pristine = reactive?.pristine
    ?? computedTracked(() => [stateChangeSignal()], () => control.pristine);

  // Derived signals
  const untouched = computed(() => !touched());
  const dirty = computed(() => !pristine());
  const valid = computed(() => status() === 'VALID');
  const invalid = computed(() => status() === 'INVALID');
  const pending = computed(() => status() === 'PENDING');
  const disabled = computed(() => status() === 'DISABLED');
  const enabled = computed(() => status() !== 'DISABLED');

  const state = computed((): FormControlState<TRawValue> => ({
    value: value(),
    status: status(),
    touched: touched(),
    untouched: untouched(),
    pristine: pristine(),
    dirty: dirty(),
    valid: valid(),
    invalid: invalid(),
    pending: pending(),
    errors: errors(),
    disabled: disabled(),
    enabled: enabled(),
  }));

  return {
    state,
    value,
    status,
    touched,
    untouched,
    pristine,
    dirty,
    valid,
    invalid,
    pending,
    errors,
    disabled,
    enabled,
  };
};


// Fixture matching direct accessor registration and state observation in the supplied hook.
export const useLegacyNgControl = <T = any>(options?: {
  writeValue?: (value: T | null) => unknown;
  setDisabledState?: (disabled: boolean) => unknown;
  validator?: (control: AbstractControl<T>) => any;
  asyncValidator?: (control: AbstractControl<T>) => any;
}) => {
  const ngControl = inject(NgControl, { optional: true });
  const changeDetectorRef = inject(ChangeDetectorRef);
  const ngFormControl = signal<AbstractControl | null>(null);
  const onChangeFunction = signal<((value: any) => any) | null>(null);
  const onTouchedFunction = signal<(() => any) | null>(null);
  const writeValueCallbacks: ((value: T | null) => unknown)[] = [];
  const ngFormControlState = computed(() => {
    const control = ngFormControl();
    return control ? useFormControlState(control) : null;
  });
  effect(() => {
    untracked(() => {
      ngFormControl.set(ngControl?.control ?? null);
      if (options?.validator || options?.asyncValidator) {
        if (options?.validator) ngFormControl()?.addValidators?.(options.validator);
        if (options?.asyncValidator) ngFormControl()?.addAsyncValidators?.(options.asyncValidator);
        ngFormControl()?.updateValueAndValidity();
        changeDetectorRef.detectChanges();
      }
    });
  });
  const hook = {
    ngControl,
    ngFormControl: computed(() => ngFormControl()),
    value: computed(() => ngFormControlState()?.value()),
    disabled: computed(() => ngFormControlState()?.disabled() ?? false),
    touched: computed(() => ngFormControlState()?.touched() ?? false),
    valid: computed(() => ngFormControlState()?.valid() ?? true),
    invalid: computed(() => ngFormControlState()?.invalid() ?? false),
    dirty: computed(() => ngFormControlState()?.dirty() ?? false),
    errors: computed(() => ngFormControlState()?.errors() ?? null),
    errorsAsArray: computed(() => {
      return Object.entries(ngFormControlState()?.errors() || {}).map(([key, value]) => ({ key, value }));
    }),
    required: computed(() => {
      ngFormControlState()?.state();
      return !!ngFormControlState()?.errors()?.['required'] || ngFormControl()?.hasValidator?.(Validators.required);
    }),
    initialized: computed(() => !!onChangeFunction() && !!onTouchedFunction()),
    emitChange(value: T) { return onChangeFunction()?.(value); },
    markAsTouched() { return onTouchedFunction()?.(); },
    onWriteValue(callback: (value: T | null) => unknown) { writeValueCallbacks.push(callback); },
  };
  if (ngControl) {
    ngControl.valueAccessor = {
      writeValue: (value: T | null) => {
        writeValueCallbacks.forEach(callback => callback(value));
        return options?.writeValue?.(value);
      },
      setDisabledState: (disabled: boolean) => options?.setDisabledState?.(disabled),
      registerOnChange: (fn: (value: any) => unknown) => onChangeFunction.set(value => fn(value)),
      registerOnTouched: (fn: () => unknown) => onTouchedFunction.set(() => {
        if (!hook.touched()) fn();
      }),
    };
  }
  return hook;
};
