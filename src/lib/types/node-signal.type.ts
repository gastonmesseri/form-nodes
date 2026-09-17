import type { Signal, WritableSignal } from '@angular/core';

type WritableSignalBrand = Exclude<keyof WritableSignal<unknown>, keyof Signal<unknown> | 'set' | 'update' | 'asReadonly'>;

/** Uses a named interface to cache recursive comparisons while retaining Angular's writable brand. */
export interface NodeSignal<TValue> extends Signal<TValue>, Pick<WritableSignal<TValue>, WritableSignalBrand> {}
