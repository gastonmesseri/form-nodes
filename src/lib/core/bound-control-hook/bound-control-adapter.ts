import type { Signal } from '@angular/core';

import type { BoundControl, BoundControlSource } from './bound-control';

export type BoundControlAdapter<TValue> = Omit<BoundControl<TValue>, 'connected' | 'source'> & {
  readonly connected: Signal<boolean>;
  readonly source: BoundControlSource;
};
