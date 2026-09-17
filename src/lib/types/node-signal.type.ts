import type { Signal, WritableSignal } from '@angular/core';

type WritableSignalBrand = Exclude<keyof WritableSignal<unknown>, keyof Signal<unknown> | 'set' | 'update' | 'asReadonly'>;

/** Keeps Angular's type-only writable brand while node APIs define their own operations. */
export type NodeSignal<TValue> = Signal<TValue> & { [K in WritableSignalBrand]: TValue };
