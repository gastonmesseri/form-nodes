import type { AbstractControl } from './types';

export type Controls = Record<string, AbstractControl<unknown>>;

export type ControlsValue<TControls extends Controls> = {
  [K in keyof TControls]: TControls[K] extends AbstractControl<infer TValue>
    ? TValue
    : never;
};
