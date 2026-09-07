import type { Signal } from '@angular/core';

import type { ControlState, ControlStateSource } from './form-node-state';

export type ControlStateAdapter<TValue> = Omit<ControlState<TValue>, 'connected' | 'source' | 'hasError' | 'getError' | 'hasValidator'> & {
  readonly connected: Signal<boolean>;
  readonly source: ControlStateSource;
  /** Optional validator-query capability; the facade handles semantic required queries. */
  hasValidator?(validator: unknown, options?: { resolve?: boolean }): boolean;
};
