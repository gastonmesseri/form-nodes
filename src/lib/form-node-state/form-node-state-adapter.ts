import type { Signal } from '@angular/core';

import type { ControlState, ControlStateError, ControlStateSource } from './form-node-state';

export type ControlStateAdapter<TValue> = Omit<ControlState<TValue>, 'connected' | 'source' | 'hasError' | 'getError' | 'hasValidator'> & {
  readonly connected: Signal<boolean>;
  readonly source: ControlStateSource;
  /** Registers an independently owned source and returns its cleanup. */
  registerErrors(source: Signal<readonly ControlStateError[]>): () => void;
  /** Revalidates nonreactive Angular controls when the source changes. */
  refreshErrors?(): void;
  /** Optional validator-query capability; the facade handles semantic required queries. */
  hasValidator?(validator: unknown, options?: { resolve?: boolean }): boolean;
};
