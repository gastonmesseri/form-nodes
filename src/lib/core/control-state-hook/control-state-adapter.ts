import type { Signal } from '@angular/core';

import type { ControlState, ControlStateSource } from './control-state';

export type ControlStateAdapter<TValue> = Omit<ControlState<TValue>, 'connected' | 'source'> & {
  readonly connected: Signal<boolean>;
  readonly source: ControlStateSource;
};
