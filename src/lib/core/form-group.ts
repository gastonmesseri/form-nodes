import { computed, signal } from '@angular/core';
import type { AbstractControl } from './types';
import type { Controls, ControlsValue } from './value-types';

export class FormGroup<TControls extends Controls>
  implements AbstractControl<ControlsValue<TControls>>
{
  readonly dirty = signal(false);
  readonly touched = signal(false);
  readonly value;
  readonly errors;
  readonly status;

  constructor(readonly controls: TControls) {
    this.value = computed(() => {
      const entries = Object.entries(this.controls).map(([key, control]) => [key, control.value()]);
      return Object.fromEntries(entries) as ControlsValue<TControls>;
    });
    this.errors = computed(() =>
      Object.entries(this.controls).flatMap(([key, control]) =>
        control.errors().map((error) => `${key}: ${error}`),
      ),
    );
    this.status = computed(() => (this.errors().length === 0 ? 'valid' : 'invalid'));
  }

  setValue(value: ControlsValue<TControls>): void {
    for (const key of Object.keys(this.controls) as Array<keyof TControls>) {
      this.controls[key]!.setValue(value[key] as never);
    }
    this.dirty.set(true);
  }

  reset(value?: ControlsValue<TControls>): void {
    for (const key of Object.keys(this.controls) as Array<keyof TControls>) {
      const control = this.controls[key]!;
      value === undefined ? control.reset() : control.reset(value[key] as never);
    }
    this.dirty.set(false);
    this.touched.set(false);
  }

  markAsTouched(): void {
    Object.values(this.controls).forEach((control) => control.markAsTouched());
    this.touched.set(true);
  }
}
